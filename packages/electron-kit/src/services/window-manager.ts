import { BrowserWindow, app, dialog } from 'electron';
import { join } from 'path';
import { filter, first, firstValueFrom, Subject } from 'rxjs';
import { createIPCHandler } from 'trpc-electron/main';
import { RendererServeService } from './renderer-serve.service';
import { deepMerge } from '../utils/deep-merge';
import { v7 as uuidv7 } from 'uuid';
import { arch, release, type } from 'os';
import { createLogScope } from '../utils/create-log';
import { container, inject, injectable } from 'tsyringe';
import { UIConfigsService } from './ui-configs.service';
import { AnyTRPCRouter } from '@trpc/server';

/**
 * Kiểu dữ liệu cho cửa sổ được quản lý.
 */
export interface ManagedWindow {
  id: string;
  browserWindow: Electron.BrowserWindow;
  parentId?: string;
}

export class WindowManagerOptions {
  modalOptions?: Electron.BrowserWindowConstructorOptions;
  mainWindowOptions?: Electron.BaseWindowConstructorOptions;
}

/**
 * Quản lý tất cả các cửa sổ (MainWindow, ModalWindow) của ứng dụng Electron.
 * Đảm bảo việc tạo, đóng, truy vấn, và các thao tác liên quan đến cửa sổ được thực hiện tập trung.
 */
@injectable()
export class WindowManager {
  /**
   * Danh sách các cửa sổ đang quản lý, key là id của cửa sổ.
   */
  private windows = new Map<string, ManagedWindow>();
  /**
   * Logger cho window-manager.
   */
  private logger = createLogScope(WindowManager.name);

  /**
   * Handler cho trpc-electron.
   */
  private ipcHandler?: ReturnType<typeof createIPCHandler<AnyTRPCRouter>>;

  /**
   * Sự kiện khi số lượng modal thuộc về một MainWindow thay đổi.
   */
  public onModalParentChanged = new Subject<{ id: string; modals: number }>();

  /**
   * Subject phát sự kiện khi một modal trả về result
   */
  public onModalResultChanged = new Subject<{ modalId: string; result: unknown }>();

  constructor(
    @inject(RendererServeService) private frontendServeService: RendererServeService,
    @inject(WindowManagerOptions) private options: WindowManagerOptions
  ) {}

  public registerIPCHandler<TRouter extends AnyTRPCRouter>(router: TRouter) {
    this.ipcHandler = createIPCHandler<AnyTRPCRouter>({ router });
    this.windows.forEach(win => {
      if (!win.browserWindow.isDestroyed()) {
        this.ipcHandler?.attachWindow(win.browserWindow);
      } else {
        this.windows.delete(win.id);
      }
    });
  }

  /**
   * Sinh cấu hình BrowserWindow dùng chung cho MainWindow và ModalWindow.
   * @param options Các tuỳ chọn bổ sung (width, height, parent, modal, ...)
   */
  private getCommonBrowserWindowOptions(
    options: Partial<Electron.BrowserWindowConstructorOptions> = {}
  ): Electron.BrowserWindowConstructorOptions {
    const uiConfigsService = container.resolve(UIConfigsService);
    return deepMerge(
      {
        frame: options.frame ?? false,
        parent: options.parent,
        modal: options.modal,
        show: false,
        center: true,
        useContentSize: true,
        webPreferences: {
          zoomFactor: uiConfigsService.getConfig('zoomFactor'),
          devTools: !app.isPackaged,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          v8CacheOptions: 'bypassHeatCheckAndEagerCompile',
          backgroundThrottling: false,
          preload: options.webPreferences?.preload ?? join(__dirname, 'preload.js'),
        },
      },
      options
    );
  }

  /**
   * Sinh các tham số dòng lệnh bổ sung cho BrowserWindow
   * @param name Tên cửa sổ
   * @param id ID cửa sổ
   * @param parentId ID cửa sổ cha (nếu có)
   * @param data Dữ liệu kèm theo (nếu có)
   */
  private buildAdditionalArguments<TData extends object | undefined>(
    name: string,
    id: string,
    parentId?: string,
    data?: TData
  ): string[] {
    const uiConfigsService = container.resolve(UIConfigsService);
    this.logger.debug('Building additional arguments', { name, id, parentId, data });
    const args = [
      `--name=${name}`,
      `--id=${id}`,
      `--uiConfigs=${JSON.stringify(uiConfigsService.getAllConfig())}`,
      `--version=${app.getVersion()}`,
      `--os=${type()} ${arch()} ${release()}`,
    ];
    if (parentId) {
      args.push(`--parentId=${parentId}`);
      if (data) {
        args.push(`--data=${JSON.stringify(data)}`);
      }
    }
    this.logger.debug('Build additional arguments', { args });
    return args;
  }

  /**
   * Tạo và quản lý một cửa sổ Electron (MainWindow hoặc ModalWindow)
   * @param options Tuỳ chọn cho BrowserWindow
   * @param parentId ID của cửa sổ cha (nếu là modal)
   * @param data Dữ liệu kèm theo (nếu có)
   */
  private createManagedWindow<TData extends object | undefined>(
    name: string,
    options: Electron.BrowserWindowConstructorOptions,
    parentId?: string,
    data?: TData
  ): ManagedWindow {
    this.logger.debug('Creating managed window', { name, options, parentId, data });
    const id = uuidv7();
    const additionalArguments = this.buildAdditionalArguments(name, id, parentId, data);
    const win = new BrowserWindow(
      deepMerge(
        { webPreferences: { additionalArguments } },
        this.getCommonBrowserWindowOptions(options)
      )
    );
    // Gán parentId, data nếu có
    const managed: ManagedWindow = { id, browserWindow: win };
    if (parentId) managed.parentId = parentId;
    this.setupWindowEvents(managed);
    this.windows.set(id, managed);
    return managed;
  }

  /**
   * Thiết lập các sự kiện cho cửa sổ
   * @param managed Thông tin cửa sổ quản lý
   */
  private setupWindowEvents({ browserWindow, id, parentId }: ManagedWindow) {
    if (this.ipcHandler) {
      this.ipcHandler.attachWindow(browserWindow);
    }
    browserWindow.on('ready-to-show', () => this.handleReadyToShow(browserWindow));
    if (!parentId) {
      browserWindow.on('focus', () => this.handleMainWindowFocus(id, browserWindow));
    }
    browserWindow.on('closed', () => this.handleWindowClosed(id, parentId));
  }

  /**
   * Xử lý sự kiện ready-to-show cho BrowserWindow
   */
  private handleReadyToShow(browserWindow: Electron.BrowserWindow) {
    setTimeout(() => browserWindow.show(), 168);
  }

  /**
   * Xử lý sự kiện focus cho MainWindow
   */
  private handleMainWindowFocus(id: string, browserWindow: Electron.BrowserWindow) {
    const modals = this.getModalWindows(id);
    if (modals.length > 0) {
      browserWindow.blur();
      modals
        .filter(w => !w.browserWindow.isDestroyed())
        .sort((a, b) => b.id.localeCompare(a.id))[0]
        ?.browserWindow.focus();
    }
  }

  /**
   * Xử lý sự kiện đóng cửa sổ
   */
  private handleWindowClosed(id: string, parentId?: string) {
    this.logger.info('Window closed', { id, parentId });
    this.windows.delete(id);
    if (parentId) {
      this.onModalParentChanged.next({
        id: parentId,
        modals: this.getModalWindows(parentId).length,
      });
    }
  }

  /**
   * Lấy baseUrl để load nội dung cho BrowserWindow.
   */
  private getBaseUrl(): Promise<string> {
    return firstValueFrom(
      this.frontendServeService.baseUrlSubject.pipe(
        filter(p => p !== undefined),
        first()
      )
    );
  }

  /**
   * Tạo MainWindow mới.
   * @param options Tuỳ chọn bổ sung cho BrowserWindow
   */
  async createMainWindow(
    options?: Electron.BrowserWindowConstructorOptions & { path?: string; name: string }
  ): Promise<ManagedWindow> {
    const managed = this.createManagedWindow(
      options?.name ?? 'main',
      deepMerge(this.options.mainWindowOptions, { width: 1366, height: 768 }, options)
    );
    this.logger.info('Create new MainWindow', { id: managed.id });
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${options?.path ?? '/'}`;
    this.logger.info('Loading URL for window', { id: managed.id, url });
    managed.browserWindow.loadURL(url);
    return managed;
  }

  /**
   * Tạo ModalWindow mới.
   * @param parentId ID của MainWindow cha
   * @param name Tên modal
   * @param options Tuỳ chọn bổ sung cho BrowserWindow
   */
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  async createModalWindow<TData extends Object>(
    parentId: string,
    name: string,
    options?: Electron.BrowserWindowConstructorOptions & { path?: string; data?: TData }
  ): Promise<ManagedWindow> {
    const parent = this.windows.get(parentId);
    if (!parent) {
      this.logger.error('Parent window not found', { parentId });
      throw new Error('Parent window not found');
    }
    const managed = this.createManagedWindow(
      name,
      deepMerge<Electron.BrowserWindowConstructorOptions>(
        this.options.modalOptions,
        {
          maximizable: false,
          minimizable: false,
          modal: true,
          fullscreenable: false,
          parent: parent.browserWindow,
        },
        options
      ),
      parentId,
      options?.data
    );
    this.logger.info('Create new ModalWindow', { id: managed.id, parentId });
    this.onModalParentChanged.next({ id: parentId, modals: this.getModalWindows(parentId).length });
    const baseUrl = await this.getBaseUrl();
    this.logger.info('Đang load URL cho window', { id: managed.id, url: baseUrl });
    managed.browserWindow.loadURL(`${baseUrl}/modals/${name}`);
    return managed;
  }

  /**
   * Lấy thông tin cửa sổ theo id.
   * @param id ID của cửa sổ
   */
  getWindow(id: string): ManagedWindow | undefined {
    const win = this.windows.get(id);
    this.logger.debug('Query window', { id, found: !!win });
    return win;
  }

  /**
   * Lấy danh sách MainWindow.
   */
  getMainWindows(): ManagedWindow[] {
    const result = Array.from(this.windows.values()).filter(w => !w.parentId);
    this.logger.debug('Get MainWindow list', { count: result.length });
    return result;
  }

  /**
   * Lấy danh sách ModalWindow theo parentId.
   * @param parentId ID của MainWindow cha
   */
  getModalWindows(parentId: string): ManagedWindow[] {
    const result = Array.from(this.windows.values()).filter(w => w.parentId === parentId);
    this.logger.debug('Get ModalWindow list', { count: result.length, parentId });
    return result;
  }

  /**
   * Đóng cửa sổ theo id.
   * @param id ID của cửa sổ
   */
  closeWindow(id: string) {
    const win = this.windows.get(id);
    if (win) {
      this.logger.info('Close window', { id });
      win.browserWindow.close();
    } else {
      this.logger.warn('Window to close not found', { id });
    }
  }

  /**
   * Đóng tất cả các cửa sổ.
   */
  closeAll() {
    this.logger.info('Close all windows');
    for (const win of Array.from(this.windows.values())) {
      win.browserWindow.close();
    }
    this.windows.clear();
  }

  /**
   * Đặt zoom factor cho tất cả các cửa sổ (MainWindow và ModalWindow).
   * @param zoomFactor Hệ số zoom (ví dụ: 1.0 là mặc định, 1.25 là phóng to 125%)
   */
  setZoomFactor(zoomFactor: number) {
    this.logger.info('Set zoom factor for all windows', { zoomFactor });
    for (const win of Array.from(this.windows.values())) {
      win.browserWindow.webContents.setZoomFactor(zoomFactor);
    }
  }

  /**
   * Lưu result và phát event khi modal đóng
   */
  emitModalResult(modalId: string, result: unknown) {
    this.onModalResultChanged.next({ modalId, result });
  }

  /**
   * Mở hộp thoại chọn file/thư mục (Open Dialog) cho một cửa sổ cụ thể
   * @param windowId ID của cửa sổ
   * @param options Tuỳ chọn cho dialog.showOpenDialog
   */
  async openDialogOpen(
    windowId: string,
    options: Electron.OpenDialogOptions
  ): Promise<Electron.OpenDialogReturnValue> {
    const win = this.windows.get(windowId)?.browserWindow;
    if (!win) throw new Error('Window not found');
    return await dialog.showOpenDialog(win, options);
  }

  /**
   * Mở hộp thoại lưu file (Save Dialog) cho một cửa sổ cụ thể
   * @param windowId ID của cửa sổ
   * @param options Tuỳ chọn cho dialog.showSaveDialog
   */
  async openDialogSave(
    windowId: string,
    options: Electron.SaveDialogOptions
  ): Promise<Electron.SaveDialogReturnValue> {
    const win = this.windows.get(windowId)?.browserWindow;
    if (!win) throw new Error('Window not found');
    return await dialog.showSaveDialog(win, options);
  }
}
