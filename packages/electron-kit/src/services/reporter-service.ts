// Import các thư viện cần thiết
import axios, { AxiosInstance } from 'axios';
import { ReportOptions, ReportType } from '../types';
import { arch, type as osType, release, cpus, totalmem } from 'os';
import { readFileSync } from 'fs';
import { app } from 'electron';
import { join } from 'path';
import { inject, injectable } from 'tsyringe';
import { createLogScope } from '../utils/create-log';

export class ReporterOptions {
  repo!: {
    owner: string;
    name: string;
  };
  token?: string;
}

/**
 * Service gửi báo cáo tạo issue lên GitHub
 * @author ecoma-io
 */
@injectable()
export class ReporterService {
  /** Logger cho service */
  private logger = createLogScope(ReporterService.name);

  /** Axios instance để gửi request */
  private axiosInstance: AxiosInstance;

  /** Đường dẫn file log của ứng dụng */
  public logFilePath: string;

  /**
   * Khởi tạo service với thông tin repo và token
   */
  constructor(@inject(ReporterOptions) private options: ReporterOptions) {
    const { owner, name: repo } = this.options.repo;
    this.axiosInstance = axios.create({
      baseURL: `https://api.github.com/repos/${owner}/${repo}`,
      headers: {
        'User-Agent': 'tikertok-app',
        Accept: 'application/vnd.github+json',
        ...(this.options.token ? { Authorization: `token ${this.options.token}` } : {}),
      },
    });
    // Lấy vị trí file log từ electron-log/main
    this.logFilePath = join(app.getPath('userData'), 'app.log');
  }

  /**
   * Lấy thông tin hệ thống và phiên bản app để chèn vào body
   */
  private getSystemInfo(): string {
    const cpuInfo = cpus()[0];
    const cpuModel = cpuInfo ? cpuInfo.model : 'Unknown';
    const cpuCores = cpus().length;
    const totalRam = (totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    const osInfo = `${osType()} ${release()} (${arch()})`;
    return (
      '\n---\n' +
      'System Information:\n' +
      `- Operating System: ${osInfo}\n` +
      `- CPU: ${cpuModel} (${cpuCores} cores)\n` +
      `- RAM: ${totalRam}\n` +
      `- Application Version: ${app.getVersion()}`
    );
  }

  /**
   * Đọc 2000 dòng cuối cùng của file log
   */
  private getLastLogLines(maxLines = 2000): string {
    try {
      const logContent = readFileSync(this.logFilePath, 'utf8');
      const lines = logContent.split(/\r?\n/);
      return lines.slice(-maxLines).join('\n');
    } catch (err) {
      this.logger.error(err);
      return '[Cannot read log file]';
    }
  }

  /**
   * Tạo object dữ liệu issue cho GitHub
   */
  private buildIssueData(title: string, body: string, type: ReportType) {
    let bodyWithInfo = body;
    // Chỉ chèn log nếu là report lỗi
    if (type === 'feedback:bug' || type === 'unhandled-rejection' || type === 'uncaught') {
      const logTail = this.getLastLogLines();
      bodyWithInfo += '\n---\n' + '**Last 2000 log lines:**\n' + '```\n' + logTail + '\n```';
    }
    bodyWithInfo += this.getSystemInfo();
    return {
      title,
      body: bodyWithInfo,
      labels: [type],
    };
  }

  /**
   * Gửi issue thường (không kèm log)
   */
  private async sendIssue(data: unknown) {
    const response = await this.axiosInstance.post('/issues', data);
    return response.data;
  }

  /**
   * Gửi báo cáo tạo issue lên GitHub
   * @param options Tuỳ chọn tạo issue
   * @returns true nếu gửi thành công, false nếu thất bại
   */
  async send(options: ReportOptions): Promise<boolean> {
    try {
      const { title, body, type } = options;
      // Luôn gửi issue thường, không đính kèm file log
      const data = this.buildIssueData(title, body, type);
      await this.sendIssue(data);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.error('AxiosError:', err.response?.data);
      } else {
        this.logger.error(err);
      }
      return false;
    }
  }
}
