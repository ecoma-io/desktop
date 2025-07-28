import axios from 'axios';
import { getExtensionStorePath, downloadFile } from './extension-downloader';

jest.mock('electron', () => ({
  app: { getPath: jest.fn(() => '/mock/userData') },
}));
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn(),
    createWriteStream: jest.fn(),
  };
});
jest.mock('axios');

const fs = require('fs');

describe('extension-downloader', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getExtensionStorePath trả về đúng path', () => {
    const result = getExtensionStorePath().replace(/\\/g, '/');
    expect(result).toContain('mock/userData/Extensions');
  });

  it('downloadFile tải file thành công với axios', async () => {
    const onMock = jest.fn();
    const writerMock = { on: onMock };
    fs.createWriteStream.mockReturnValue(writerMock);
    const pipeMock = jest.fn();
    (axios.get as jest.Mock).mockResolvedValue({ data: { pipe: pipeMock } });
    // Khi gọi on('finish', cb), gọi cb ngay để resolve promise
    onMock.mockImplementation((event, cb) => {
      if (event === 'finish') cb();
      return writerMock;
    });
    const promise = downloadFile('from', 'to');
    expect(axios.get).toHaveBeenCalledWith('from', { responseType: 'stream' });
    expect(pipeMock).not.toHaveBeenCalled(); // pipe sẽ được gọi trong promise
    await expect(promise).resolves.toBeUndefined();
    expect(pipeMock).toHaveBeenCalledWith(writerMock);
    expect(onMock).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
