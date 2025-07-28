import { BrowserContext, ElectronApplication, Page, _electron as electron } from 'playwright';
import { join } from 'path';
import { workspaceRoot } from '@nx/devkit';
import { sleep } from '@ecoma-io/sleep';
import { findLatestBuild, parseElectronApp } from './parse-build';

/**
 * Kiểu tuỳ chọn cho electron.launch (trừ args)
 * (Dựa theo tài liệu Playwright _electron.launch)
 */
export type ElectronLaunchOptions = Partial<{
  acceptDownloads: boolean;
  bypassCSP: boolean;
  colorScheme: 'light' | 'dark' | 'no-preference' | null;
  cwd: string;
  env: Record<string, string | number | boolean>;
  executablePath: string;
  extraHTTPHeaders: Record<string, string>;
  geolocation: { latitude: number; longitude: number; accuracy?: number };
  httpCredentials: {
    username: string;
    password: string;
    origin?: string;
    send?: 'unauthorized' | 'always';
  };
  ignoreHTTPSErrors: boolean;
  locale: string;
  offline: boolean;
  timeout: number;
  timezoneId: string;
  tracesDir: string;
  headless: boolean;
}>;

/**
 * Lớp tiện ích để khởi tạo và dọn dẹp ứng dụng Electron cho các bài test Playwright.
 * Cho phép cấu hình electron.launch options (trừ args) và tên file trace.
 */
export class TestContext {
  /** Tuỳ chọn electron.launch (trừ args) */
  private launchOptions: ElectronLaunchOptions;
  /** Đối tượng ElectronApplication */
  private _app: ElectronApplication | undefined;
  /** Đối tượng BrowserContext */
  private _BrowserContext: BrowserContext | undefined;
  /** Trang cửa sổ đầu tiên */
  private _firstWindow: Page | undefined;
  /**Đường dẫn thư mục user-data của ứng dụng Electron trong quá trình test*/
  userDataPath: string | undefined;

  /**
   * Khởi tạo TestContext với các tuỳ chọn electron.launch (trừ args)
   * @param options Các tuỳ chọn electron.launch (không bao gồm args)
   */
  constructor(options?: ElectronLaunchOptions) {
    this.launchOptions = options ?? {};
  }

  /**
   * Lấy đối tượng ElectronApplication. Nếu chưa khởi tạo sẽ throw lỗi.
   */
  public get app(): ElectronApplication {
    if (!this._app)
      throw new Error('Chưa khởi tạo ElectronApplication (app)! Hãy gọi setup() trước.');
    return this._app;
  }

  /**
   * Lấy đối tượng BrowserContext. Nếu chưa khởi tạo sẽ throw lỗi.
   */
  public get BrowserContext(): BrowserContext {
    if (!this._BrowserContext)
      throw new Error('Chưa khởi tạo BrowserContext! Hãy gọi setup() trước.');
    return this._BrowserContext;
  }

  /**
   * Lấy trang cửa sổ đầu tiên. Nếu chưa khởi tạo sẽ throw lỗi.
   */
  public get firstWindow(): Page {
    if (!this._firstWindow) throw new Error('Chưa khởi tạo firstWindow! Hãy gọi setup() trước.');
    return this._firstWindow;
  }

  /**
   * Khởi tạo ứng dụng Electron
   */
  async setup(appDir: string) {
    const { env, ...otherOptions } = this.launchOptions;

    const artifactsPath = join(workspaceRoot, 'dist/artifacts', appDir);
    const latestBuild = findLatestBuild(artifactsPath);
    const appInfo = parseElectronApp(latestBuild);

    this._app = await electron.launch({
      executablePath: appInfo.executable,
      args: [appInfo.main],
      env: Object.fromEntries(
        Object.entries({ ...process.env, ...(env || {}) })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ),
      ...otherOptions,
    });
    this._BrowserContext = this._app.context();
    if (this._BrowserContext) {
      await this._BrowserContext.tracing.start({ screenshots: true, snapshots: true });
    }
    this._firstWindow = await this._app.firstWindow();
    await this._firstWindow.waitForLoadState('domcontentloaded');
    // TODO: Kiểm tra cửa sổ đầu tiên có hiển thị không
    await sleep(2000);
  }

  /**
   * Dọn dẹp tracing và đóng app
   */
  async teardown() {
    if (this._app) {
      try {
        await this._app.close();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Chờ cho đến khi modal có tên xác định xuất hiện.
   * @param name Tên của modal (ví dụ: 'feedback')
   * @param timeout Thời gian chờ tối đa (ms)
   */
  async waitForModal(name: string, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const allWindows = this.app.windows();
      for (const window of allWindows) {
        try {
          const info = await window.evaluate(
            () => (window as { information?: { parentId?: string; name?: string } }).information
          );
          if (info && info.parentId && info.name === name) {
            await window.waitForLoadState('domcontentloaded');
            return;
          }
        } catch {
          // Bỏ qua lỗi nếu page đang tải hoặc không có `window.information`
        }
      }
      await sleep(100); // Chờ 100ms trước khi thử lại
    }
    throw new Error(`Timeout waiting for modal "${name}"`);
  }

  /**
   * Lấy về đối tượng Page của modal.
   * @param name Tên của modal
   * @returns Đối tượng Page của modal, hoặc null nếu không tìm thấy.
   */
  async getModal(name: string): Promise<Page | null> {
    const allWindows = this.app.windows();
    for (const window of allWindows) {
      try {
        const info = await window.evaluate(
          () => (window as { information?: { parentId?: string; name?: string } }).information
        );
        if (info && info.parentId && info.name === name) {
          return window;
        }
      } catch {
        // Bỏ qua lỗi nếu page đang tải hoặc không có `window.information`
      }
    }
    return null;
  }

  /**
   * Lấy về phiên bản ứng dụng
   * @returns Phiên bản ứng dụng
   */
  async getAppVersion(): Promise<string> {
    return this.app.evaluate(process => process.app.getVersion());
  }
}
