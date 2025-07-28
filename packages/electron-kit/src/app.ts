// ===== IMPORTS =====
import { app, dialog } from 'electron';
import { container } from 'tsyringe';
import { RendererServeOptions, RendererServeService } from './services/renderer-serve.service';
import { WindowManager, WindowManagerOptions } from './services/window-manager';
import { UpdaterOptions, UpdaterService } from './services/updater.service';
import { UIConfigsService } from './services/ui-configs.service';
import { ReporterOptions, ReporterService } from './services/reporter-service';
import { ReportType } from './types';
import { DialogService } from './services/dialog.service';
import { AnyTRPCRouter } from '@trpc/server';
import { constructor } from 'tsyringe/dist/typings/types';
import { reporterRoute } from './routers/reporter.router';
import { uiConfigsRouter } from './routers/ui-config.router';
import { windowRouter } from './routers/window.router';
import { createLogScope } from './utils/create-log';
import { router } from './trpc';

export interface ApplicationOptions {
  renderer: RendererServeOptions;
  reporter: ReporterOptions;
  updater: UpdaterOptions;
  routers: Record<string, AnyTRPCRouter>;
  services: Array<constructor<unknown>>;
  windowManager?: WindowManagerOptions;
}

export class Application {
  private logger = createLogScope(Application.name);

  constructor(private options: ApplicationOptions) {
    this.setupDependencyInjection();
    this.setupEventHandlers();
    this.checkForUpdates();
  }

  // ===== DEPENDENCY INJECTION SETUP =====
  private setupDependencyInjection(): void {
    container.register(WindowManagerOptions, { useValue: this.options.windowManager ?? {} });
    container.register(RendererServeOptions, { useValue: this.options.renderer });
    container.register(UpdaterOptions, { useValue: this.options.updater });
    container.register(ReporterOptions, { useValue: this.options.reporter });
    container.registerSingleton(RendererServeService);
    container.registerSingleton(WindowManager);
    container.registerSingleton(UpdaterService);
    container.registerSingleton(ReporterService);
    container.registerSingleton(UIConfigsService);
    container.registerSingleton(DialogService);
    this.options.services.forEach(service => {
      container.registerSingleton(service);
    });
  }

  // ===== EVENT HANDLERS SETUP =====
  private setupEventHandlers(): void {
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('ready', this.createMainWindowAndFrontend.bind(this));
    app.on('activate', this.onActivate.bind(this));
    this.registerGlobalErrorHandlers();
  }

  // ===== WINDOW EVENTS =====
  private onWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      this.logger.info('All windows closed, quitting app');
      app.quit();
    } else {
      this.logger.info('All windows closed');
    }
  }

  private onActivate(): void {
    this.logger.info('App activate event');
    const windowManager = container.resolve(WindowManager);
    if (windowManager.getMainWindows().length === 0) {
      this.logger.info('No windows found, re-initializing main window');
      this.createMainWindowAndFrontend();
    }
  }

  private async createMainWindowAndFrontend(): Promise<void> {
    this.logger.info('App is ready, initializing main window');
    const windowManager = container.resolve(WindowManager);
    windowManager.registerIPCHandler(
      router({
        ...this.options.routers,
        reporter: reporterRoute,
        uiConfigs: uiConfigsRouter,
        window: windowRouter,
      })
    );
    windowManager.createMainWindow();
  }

  // ===== ERROR HANDLING =====
  private async showErrorDialogAndMaybeReport(
    reason: unknown,
    reportType: ReportType
  ): Promise<void> {
    const message = reason instanceof Error ? reason.stack || reason.message : String(reason);
    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Unhandled rejection error',
      message,
      buttons: ['Bỏ qua', 'Báo cáo lỗi'],
      defaultId: 1,
      cancelId: 0,
    });
    if (result.response === 1) {
      let reportTitle = '';
      let reportBody = message;
      if (reason) {
        if (reportType === 'uncaught') {
          reportTitle =
            'Uncaught Error: ' + (reason instanceof Error ? reason.message : String(reason));
          const stackOrMsg =
            reason instanceof Error ? reason.stack || reason.message : String(reason);
          reportBody = `\n\n\\${stackOrMsg}\n\n`;
        } else if (reportType === 'unhandled-rejection') {
          reportTitle =
            'Unhandled Rejection Error: ' +
            (reason instanceof Error ? reason.message : String(reason));
          const stackOrMsg =
            reason instanceof Error ? reason.stack || reason.message : String(reason);
          reportBody = `\n\n\\${stackOrMsg}\n\n`;
        }
      }
      const reporterService = container.resolve(ReporterService);
      const success = await reporterService.send({
        title: reportTitle,
        body: reportBody,
        type: reportType,
      });
      if (success) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'Báo cáo thành công',
          message: 'Báo cáo lỗi đã được gửi thành công. Cảm ơn bạn đã phản hồi!',
          buttons: ['Đóng'],
          defaultId: 0,
        });
      } else {
        const retry = await dialog.showMessageBox({
          type: 'error',
          title: 'Gửi báo cáo thất bại',
          message: 'Không thể gửi báo cáo lỗi. Bạn có muốn thử lại không?',
          buttons: ['Bỏ qua', 'Thử lại'],
          defaultId: 1,
          cancelId: 0,
        });
        if (retry.response === 1) {
          await this.showErrorDialogAndMaybeReport(reason, reportType);
        }
      }
    }
  }

  private registerGlobalErrorHandlers(): void {
    process.on('uncaughtException', err => {
      this.logger.error('Uncaught error:', err);
      if (app.isReady()) {
        this.showErrorDialogAndMaybeReport(err, 'uncaught');
      } else {
        app.on('ready', () => {
          this.showErrorDialogAndMaybeReport(err, 'uncaught');
        });
      }
    });

    process.on('unhandledRejection', reason => {
      if (
        reason instanceof Error &&
        reason.message &&
        reason.message.includes('No published versions on GitHub')
      ) {
        this.logger.warn('No release found');
        return;
      }
      this.logger.error('Unhandled rejection error:', reason);
      if (app.isReady()) {
        this.showErrorDialogAndMaybeReport(reason, 'unhandled-rejection');
      } else {
        app.on('ready', () => {
          this.showErrorDialogAndMaybeReport(reason, 'unhandled-rejection');
        });
      }
    });
  }

  private checkForUpdates(): void {
    const autoUpdaterService = container.resolve(UpdaterService);
    autoUpdaterService.checkForUpdates();
  }
}
