import { registerAutoOpenDevtools } from './devtools-auto-open';
import { DevtoolsOptions } from './types';

// Tạo biến appMock ở scope ngoài để module mock có thể truy cập
let appMock: any;

jest.mock('electron', () => ({
  get app() {
    return appMock;
  },
  BrowserWindow: jest.fn(),
}));

describe('registerAutoOpenDevtools', () => {
  function createAppMock() {
    const onMock = jest.fn();
    return {
      on: onMock,
      off: jest.fn(),
      once: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  }
  function createLoggerMock() {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }

  beforeEach(() => {
    appMock = createAppMock();
  });

  it('đăng ký event mở DevTools cho BrowserWindow mới', () => {
    const openDevToolsMock = jest.fn();
    const win = {
      webContents: { once: jest.fn((ev, cb) => cb()), openDevTools: openDevToolsMock },
    };
    const logger = createLoggerMock();
    const options: DevtoolsOptions = { showDevToolsWindowOpened: true, logger };
    registerAutoOpenDevtools(options);
    // Giả lập event
    const handler = appMock.on.mock.calls.find(
      ([event]: [string]) => event === 'browser-window-created'
    )[1];
    handler({}, win);
    expect(win.webContents.once).toHaveBeenCalledWith('dom-ready', expect.any(Function));
    expect(openDevToolsMock).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Mở DevTools cho cửa sổ mới');
  });

  it('mở DevTools với mode chỉ định', () => {
    const openDevToolsMock = jest.fn();
    const win = {
      webContents: { once: jest.fn((ev, cb) => cb()), openDevTools: openDevToolsMock },
    };
    const logger = createLoggerMock();
    const options: DevtoolsOptions = {
      showDevToolsWindowOpened: true,
      devToolsMode: 'right',
      logger,
    };
    registerAutoOpenDevtools(options);
    const handler = appMock.on.mock.calls.find(
      ([event]: [string]) => event === 'browser-window-created'
    )[1];
    handler({}, win);
    expect(openDevToolsMock).toHaveBeenCalledWith({ mode: 'right' });
  });

  it('không mở DevTools nếu showDevToolsWindowOpened là false', () => {
    const openDevToolsMock = jest.fn();
    const win = {
      webContents: { once: jest.fn((ev, cb) => cb()), openDevTools: openDevToolsMock },
    };
    const logger = createLoggerMock();
    const options: DevtoolsOptions = { showDevToolsWindowOpened: false, logger };
    registerAutoOpenDevtools(options);
    const handler = appMock.on.mock.calls.find(
      ([event]: [string]) => event === 'browser-window-created'
    )[1];
    handler({}, win);
    expect(openDevToolsMock).not.toHaveBeenCalled();
  });
});
