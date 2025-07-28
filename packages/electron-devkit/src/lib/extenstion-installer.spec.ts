import { installExtensions } from './extenstion-installer';
import { ExtensionInstallItem, Logger } from './types';

// Mock các dependency
jest.mock('./extension-downloader', () => ({
  downloadExtension: jest.fn(),
}));
jest.mock('./extension-loader', () => ({
  _loadExtension: jest.fn(),
}));
jest.mock('electron', () => ({
  session: {
    defaultSession: {
      loadExtension: jest.fn(),
    },
  },
}));

const mockDownloadExtension = require('./extension-downloader').downloadExtension;
const mockLoadExtension = require('./extension-loader')._loadExtension;

/**
 * Tạo mock session và extension cho test
 */
function createMockSession(extensions: any[] = []): any {
  // Proxy để mock mọi thuộc tính/method chưa có của Electron.Session
  const base = {
    extensions: {
      getAllExtensions: jest.fn(() => extensions),
      removeExtension: jest.fn(),
      loadExtension: jest.fn(),
    },
    on: jest.fn(),
    removeListener: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    addListener: jest.fn(),
    addWordToSpellCheckerDictionary: jest.fn(),
  };
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop as keyof typeof target];
      // Trả về jest.fn() cho mọi thuộc tính chưa mock
      return jest.fn();
    },
  });
}

describe('installExtensions', () => {
  let logger: Logger;
  beforeEach(() => {
    logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    jest.clearAllMocks();
  });

  it('Cài extension mới khi chưa có', async () => {
    const session = createMockSession([]);
    const ext = { id: 'abc' };
    mockDownloadExtension.mockResolvedValue('/fake/path');
    mockLoadExtension.mockResolvedValue(ext);
    const items: ExtensionInstallItem[] = [{ id: 'abc', session }];
    const result = await installExtensions(items, logger);
    expect(mockDownloadExtension).toHaveBeenCalledWith('abc', expect.objectContaining({ logger }));
    expect(mockLoadExtension).toHaveBeenCalledWith(
      '/fake/path',
      expect.objectContaining({ session })
    );
    expect(result).toEqual([ext]);
    expect(logger.info).toHaveBeenCalledWith('Starting to install extension: abc');
    expect(logger.info).toHaveBeenCalledWith('Loading unpacked extension: /fake/path');
    expect(logger.info).toHaveBeenCalledWith('Extension installed successfully: abc');
  });

  it('Bỏ qua cài đặt nếu extension đã tồn tại và không forceDownload', async () => {
    const ext = { id: 'abc' };
    const session = createMockSession([ext]);
    const items: ExtensionInstallItem[] = [{ id: 'abc', session }];
    const result = await installExtensions(items, logger);
    expect(result).toEqual([ext]);
    expect(logger.info).toHaveBeenCalledWith('Extension already exists, skipping: abc');
    expect(mockDownloadExtension).not.toHaveBeenCalled();
    expect(mockLoadExtension).not.toHaveBeenCalled();
  });

  it('Gỡ extension cũ và cài lại khi forceDownload', async () => {
    const ext = { id: 'abc' };
    const session = createMockSession([ext]);
    // Giả lập event extension-unloaded
    session.on.mockImplementation((event: string, handler: any) => {
      if (event === 'extension-unloaded') {
        setTimeout(() => handler(null, ext), 0);
      }
    });
    mockDownloadExtension.mockResolvedValue('/fake/path');
    mockLoadExtension.mockResolvedValue(ext);
    const items: ExtensionInstallItem[] = [{ id: 'abc', session, forceDownload: true }];
    const result = await installExtensions(items, logger);
    expect(session.extensions.removeExtension).toHaveBeenCalledWith('abc');
    expect(mockDownloadExtension).toHaveBeenCalledWith(
      'abc',
      expect.objectContaining({ forceDownload: true, logger })
    );
    expect(mockLoadExtension).toHaveBeenCalledWith(
      '/fake/path',
      expect.objectContaining({ session })
    );
    expect(result).toEqual([ext]);
    expect(logger.info).toHaveBeenCalledWith('Removing old extension: abc');
  });

  it('Cài nhiều extension', async () => {
    const ext1 = { id: 'abc' };
    const ext2 = { id: 'def' };
    const session1 = createMockSession([]);
    const session2 = createMockSession([]);
    mockDownloadExtension.mockResolvedValueOnce('/path/abc').mockResolvedValueOnce('/path/def');
    mockLoadExtension.mockResolvedValueOnce(ext1).mockResolvedValueOnce(ext2);
    const items: ExtensionInstallItem[] = [
      { id: 'abc', session: session1 },
      { id: 'def', session: session2 },
    ];
    const result = await installExtensions(items, logger);
    expect(result).toEqual([ext1, ext2]);
    expect(mockDownloadExtension).toHaveBeenCalledTimes(2);
    expect(mockLoadExtension).toHaveBeenCalledTimes(2);
  });
});
