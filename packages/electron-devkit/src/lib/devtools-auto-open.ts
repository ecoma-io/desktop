import { app, BrowserWindow } from 'electron';
import { DevkitOptions } from './types';

/**
 * Đăng ký tự động mở DevTools cho mọi BrowserWindow mới được tạo
 * @param options Tuỳ chọn DevtoolsOptions
 */
export function registerAutoOpenDevtools(options: DevkitOptions) {
  const logger = options.logger;
  app.on('browser-window-created', (_event, win: BrowserWindow) => {
    win.webContents.once('dom-ready', () => {
      if (options.showDevToolsWindowOpened) {
        const devToolsOpts =
          options.devToolsMode && options.devToolsMode !== 'previous'
            ? { mode: options.devToolsMode as Electron.OpenDevToolsOptions['mode'] }
            : undefined;
        logger?.info?.('Mở DevTools cho cửa sổ mới');
        win.webContents.openDevTools(devToolsOpts);
      }
    });
  });
}
