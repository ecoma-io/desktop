import { _loadExtension, loadUnpackedExtensions } from './extension-loader';
import { Logger, UnpackedExtensionItem } from './types';

let mockLoadExtension: jest.Mock;
let mockSession: any;
let mockDefaultSession: any;

jest.mock('electron', () => ({
  session: {
    get defaultSession() {
      return mockDefaultSession;
    },
  },
}));

function createMockSession() {
  return {
    extensions: { loadExtension: mockLoadExtension },
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  } as any;
}

describe('extension-loeader', () => {
  describe('_loadExtension', () => {
    beforeEach(() => {
      mockLoadExtension = jest.fn();
      mockSession = createMockSession();
      mockDefaultSession = createMockSession();
      jest.clearAllMocks();
    });

    it('gọi loadExtension với đúng tham số', async () => {
      const fakeExt = { id: 'abc' };
      mockLoadExtension.mockResolvedValueOnce(fakeExt);
      const result = await _loadExtension('/path/to/ext', {
        session: mockSession,
        loadExtensionOptions: { allowFileAccess: true },
      });
      expect(mockLoadExtension).toHaveBeenCalledWith('/path/to/ext', { allowFileAccess: true });
      expect(result).toBe(fakeExt);
    });

    it('dùng defaultSession nếu không truyền session', async () => {
      const fakeExt = { id: 'def' };
      mockLoadExtension.mockResolvedValueOnce(fakeExt);
      const result = await _loadExtension('/path/to/ext');
      expect(mockLoadExtension).toHaveBeenCalledWith('/path/to/ext', undefined);
      expect(result).toBe(fakeExt);
    });
  });

  describe('loadUnpackedExtensions', () => {
    let logger: Logger;
    beforeEach(() => {
      mockLoadExtension = jest.fn();
      mockSession = createMockSession();
      mockDefaultSession = createMockSession();
      jest.clearAllMocks();
      logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    });

    it('load thành công tất cả unpacked extensions', async () => {
      const fakeExt1 = { id: '1' };
      const fakeExt2 = { id: '2' };
      mockLoadExtension.mockResolvedValueOnce(fakeExt1).mockResolvedValueOnce(fakeExt2);
      const items: UnpackedExtensionItem[] = [
        { path: '/a' },
        { path: '/b', session: mockSession, loadExtensionOptions: { allowFileAccess: true } },
      ];
      const result = await loadUnpackedExtensions(items, logger);
      expect(result).toEqual([fakeExt1, fakeExt2]);
      expect(logger.info).toHaveBeenCalledWith('Loading unpacked extension: /a');
      expect(logger.info).toHaveBeenCalledWith('Loaded unpacked extension successfully: /a');
      expect(logger.info).toHaveBeenCalledWith('Loading unpacked extension: /b');
      expect(logger.info).toHaveBeenCalledWith('Loaded unpacked extension successfully: /b');
    });

    it('báo lỗi logger.error nếu loadExtension throw', async () => {
      mockLoadExtension.mockRejectedValueOnce(new Error('fail'));
      const items: UnpackedExtensionItem[] = [{ path: '/err' }];
      const result = await loadUnpackedExtensions(items, logger);
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith('Loading unpacked extension: /err');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error loading unpacked extension /err:')
      );
    });

    it('không lỗi nếu logger không được truyền', async () => {
      const fakeExt = { id: 'x' };
      mockLoadExtension.mockResolvedValueOnce(fakeExt);
      const items: UnpackedExtensionItem[] = [{ path: '/no-logger' }];
      await expect(loadUnpackedExtensions(items)).resolves.toEqual([fakeExt]);
    });
  });
});
