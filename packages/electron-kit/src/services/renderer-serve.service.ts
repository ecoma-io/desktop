import express from 'express';
import { join } from 'path';
import { AddressInfo } from 'net';
import { createLogScope } from '../utils/create-log';
import { inject, injectable } from 'tsyringe';
import { BehaviorSubject } from 'rxjs';
import { app } from 'electron';
import { sleep } from '@ecoma-io/sleep';

export class RendererServeOptions {
  devUrl!: string;
  prodPath!: string;
  retryInterval?: number;
  maxRetry?: number;
}

@injectable()
export class RendererServeService {
  /**
   * Logger cho frontend-serve service
   */
  private logger = createLogScope(RendererServeService.name);
  private options: RendererServeOptions & { maxRetry: number; retryInterval: number };
  public baseUrlSubject = new BehaviorSubject<string | undefined>(undefined);

  constructor(@inject(RendererServeOptions) options: RendererServeOptions) {
    this.options = {
      maxRetry: 60,
      retryInterval: 1000,
      ...options,
    };

    if (app.isPackaged) {
      this.startFrontendProd();
    } else {
      this.waitDevServer();
    }
  }

  /**
   * Kiểm tra dev server đã sẵn sàng chưa
   */
  private async isDevServerReady(): Promise<boolean> {
    try {
      const response = await fetch(this.options.devUrl);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Chờ dev server sẵn sàng, trả về Promise resolve khi sẵn sàng
   */
  async waitDevServer(): Promise<void> {
    let retry = 0;
    while (retry < this.options.maxRetry) {
      if (await this.isDevServerReady()) {
        this.logger.info('Dev server is ready:', this.options.devUrl);
        this.baseUrlSubject.next(this.options.devUrl);
        return;
      } else {
        this.logger.debug('Dev server is not ready, retrying...');
      }
      await sleep(this.options.retryInterval);
      retry++;
    }
    throw new Error('Dev server không sẵn sàng sau nhiều lần thử');
  }

  /**
   * Tạo express app phục vụ frontend production
   */
  private createFrontendApp(): express.Express {
    const frontendApp = express();
    const frontendBasePath = this.options.prodPath;
    frontendApp.use(express.static(frontendBasePath));
    frontendApp.get(/(.*)/, (_req, res) => {
      return res.sendFile(join(frontendBasePath, 'index.html'));
    });
    return frontendApp;
  }

  /**
   * Lắng nghe server trên port bất kỳ, trả về url đã sẵn sàng
   */
  private listenOnAvailablePort(app: express.Express): Promise<string> {
    return new Promise(resolve => {
      const server = app.listen(0, () => {
        const serverAddress = server.address() as AddressInfo;
        const url = 'http://127.0.0.1:' + serverAddress.port;
        resolve(url);
      });
    });
  }

  /**
   * Khởi động express phục vụ frontend production, trả về url đã sẵn sàng
   */
  async startFrontendProd(): Promise<void> {
    const app = this.createFrontendApp();
    const url = await this.listenOnAvailablePort(app);
    this.logger.info('Frontend started at', url);
    this.baseUrlSubject.next(url);
  }
}
