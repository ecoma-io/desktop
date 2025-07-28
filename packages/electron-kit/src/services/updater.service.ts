/**
 * Service quản lý cập nhật tự động cho ứng dụng Electron
 * Sử dụng electron-updater
 */
import express from 'express';
import { autoUpdater, UpdateDownloadedEvent } from 'electron-updater';
import { ManagedWindow, WindowManager } from './window-manager';
import { join } from 'path';
import { AddressInfo } from 'net';
import { writeFileSync } from 'fs';
import { MessageBoxData } from '../types';
import { filter, first } from 'rxjs/operators';
import { app } from 'electron';
import { inject, injectable } from 'tsyringe';
import { createLogScope } from '../utils/create-log';
import { cwd } from 'process';

export class UpdaterOptions {
  repo!: {
    owner: string;
    name: string;
  };
  token?: string;
}

@injectable()
export class UpdaterService {
  /**
   * Trạng thái đã khởi tạo hay chưa
   */
  private initialized = false;

  /**
   * Logger cho auto-updater service
   */
  private logger = createLogScope(UpdaterService.name);

  constructor(
    @inject(WindowManager) private windowManager: WindowManager,
    @inject(UpdaterOptions) private options: UpdaterOptions
  ) {}

  /**
   * Khởi tạo lắng nghe các sự kiện cập nhật
   */
  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.setupAutoUpdaterLoggerAndOptions();
    autoUpdater.on('update-downloaded', info => this.handleUpdateReady(info));
    autoUpdater.on('error', info => this.handleUpdateError(info));

    if (process.env['TEST_DEV_UPDATE']) {
      autoUpdater.forceDevUpdateConfig = true;
      await this.setupMockUpdateServerForDevelopment(process.env['TEST_DEV_UPDATE']);
    } else {
      this.setupFeedUrlForProduction();
    }

    this.initialized = true;
  }

  /**
   * Thiết lập logger và các tuỳ chọn cho autoUpdater
   */
  private setupAutoUpdaterLoggerAndOptions(): void {
    this.logger.info('Initializing auto update');
    autoUpdater.logger = this.logger;
    autoUpdater.allowPrerelease = false;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;
  }

  /**
   * Thiết lập feed URL cho môi trường production
   */
  private setupFeedUrlForProduction(): void {
    const { owner, name: repo } = this.options.repo;
    autoUpdater.setFeedURL({
      owner,
      repo,
      provider: 'github',
      token: this.options.token ?? undefined,
      channel: process.platform,
    });
  }

  /**
   * Ghi file cấu hình YAML cho mock update server
   * @param filePath Đường dẫn file
   * @param url URL server
   */
  private writeMockUpdateYaml(filePath: string, url: string): void {
    const yaml = require('js-yaml');
    const ymlContent = yaml.dump({
      provider: 'generic',
      url,
      updaterCacheDirName: 'updates',
    });
    writeFileSync(filePath, ymlContent);
  }

  /**
   * Thiết lập mock update server cho môi trường development
   */
  private async setupMockUpdateServerForDevelopment(assetsPath: string): Promise<void> {
    const mockUpdateServer = express();
    this.logger.info('Update assets path:', assetsPath);
    mockUpdateServer.get(/(.*)/, (req, res) => {
      res.sendFile(join(cwd(), assetsPath, req.path));
    });

    await new Promise<void>(res => {
      const server = mockUpdateServer.listen(0, () => {
        const serverAddress = server.address() as AddressInfo;
        const url = 'http://127.0.0.1:' + serverAddress.port;
        this.logger.info('Mock update server is running at url: ' + url);
        this.writeMockUpdateYaml(
          join(__dirname, app.isPackaged ? '../../app-update.yml' : 'dev-app-update.yml'),
          url
        );
        autoUpdater.setFeedURL({ provider: 'generic', url, channel: process.platform });
        res();
      });
    });
  }

  /**
   * Xử lý khi đã tải xong bản cập nhật
   */
  private handleUpdateReady(info: UpdateDownloadedEvent): void {
    this.logger.info('Ready to update', { info });
    this.startPollingForMainWindowFocus(info);
  }

  /**
   * Lấy main window đang được focus (nếu có)
   */
  private getFocusedMainWindow(): ManagedWindow | null {
    const mains = this.windowManager.getMainWindows();
    return mains.find((w: ManagedWindow) => w.browserWindow.isFocused()) || null;
  }

  /**
   * Bắt đầu polling để chờ main window focus
   */
  private startPollingForMainWindowFocus(info: UpdateDownloadedEvent): void {
    let pollingId: NodeJS.Timeout | null = null;
    const poll = () => {
      const focusWin = this.getFocusedMainWindow();
      if (focusWin) {
        this.logger.info('Main window focused detected, showing update notification modal', {
          parentId: focusWin.id,
        });
        try {
          this.showUpdateAvailableModal(focusWin.id, info);
        } catch (err) {
          this.logger.error('Error while creating update notification modal', err);
        }
        if (pollingId) clearInterval(pollingId);
      }
    };
    pollingId = setInterval(poll, 1000);
  }

  /**
   * Hiển thị modal thông báo cập nhật mới
   */
  private async showUpdateAvailableModal(
    parentId: string,
    info: UpdateDownloadedEvent
  ): Promise<void> {
    const { version } = info;
    const modalWindow = await this.windowManager.createModalWindow<MessageBoxData>(
      parentId,
      'message-box',
      {
        data: {
          styles: {
            win32: { width: 400, height: 200 },
            darwin: { width: 330, height: 300 },
          },
          closeable: true,
          title: 'Đã có phiên bản mới',
          message: `Phiên bản ${version} đã được phát hành.\nVui lòng khởi động lại để hoàn tất cập nhật`,
          type: 'update-avaiable',
          buttons: [
            { label: 'Để sau', style: 'secondary' },
            { label: 'Cài đặt ngay', style: 'primary' },
          ],
        },
      }
    );

    // Lắng nghe result từ modal
    const subscription = this.windowManager.onModalResultChanged
      .pipe(
        filter((e: { modalId: string; result: unknown }) => e.modalId === modalWindow.id),
        first()
      )
      .subscribe(({ result }: { result: unknown }) => {
        this.logger.info('User closed update modal', { result });
        if (result === 1) {
          this.logger.info('User chose to restart to update');
          this.quitAndInstall();
        }
        subscription.unsubscribe();
      });
  }

  /**
   * Kiểm tra cập nhật mới
   */
  async checkForUpdates(): Promise<void> {
    this.logger.info('Checking for new updates');
    await this.init();
    await autoUpdater.checkForUpdates();
  }

  /**
   * Thoát ứng dụng và cài đặt bản cập nhật mới
   */
  quitAndInstall(): void {
    this.logger.info('Quitting app and installing new update');
    autoUpdater.quitAndInstall();
  }

  /**
   * Xử lý lỗi cập nhật
   */
  private handleUpdateError(error: Error): void {
    this.logger.error('Error on updating', error);
  }
}
