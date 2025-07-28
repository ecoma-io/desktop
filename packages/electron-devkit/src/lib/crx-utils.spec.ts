import { crxToZip, unzipCrx, setChmodRecursive } from './crx-utils';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

jest.mock('adm-zip');

describe('crx-utils', () => {
  describe('crxToZip', () => {
    it('trả về buffer gốc nếu là file zip', () => {
      const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]);
      expect(crxToZip(buf)).toBe(buf);
    });

    it('throw nếu header không phải Cr24', () => {
      const buf = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(() => crxToZip(buf)).toThrow('Invalid header');
    });

    it('throw nếu version không hợp lệ', () => {
      const buf = Buffer.from([0x43, 0x72, 0x32, 0x34, 5, 0, 0, 0]);
      expect(() => crxToZip(buf)).toThrow('Unexpected crx format version number.');
    });

    it('parse đúng crx v2', () => {
      // Cr24, v2, publicKeyLen=4, sigLen=4, sau đó là zip
      const buf = Buffer.concat([
        Buffer.from([0x43, 0x72, 0x32, 0x34, 2, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0]),
        Buffer.from([0, 0, 0, 0]), // publicKey
        Buffer.from([0, 0, 0, 0]), // sig
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), // zip
      ]);
      const zip = crxToZip(buf);
      expect(zip[0]).toBe(0x50);
      expect(zip[1]).toBe(0x4b);
    });

    it('parse đúng crx v3', () => {
      // Cr24, v3, headerSize=4, header, sau đó là zip
      const buf = Buffer.concat([
        Buffer.from([0x43, 0x72, 0x32, 0x34, 3, 0, 0, 0, 4, 0, 0, 0]),
        Buffer.from([0, 0, 0, 0]), // header
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), // zip
      ]);
      const zip = crxToZip(buf);
      expect(zip[0]).toBe(0x50);
      expect(zip[1]).toBe(0x4b);
    });
  });

  describe('setChmodRecursive', () => {
    it('set chmod cho file và folder', async () => {
      const readdirMock = jest.spyOn(fs.promises, 'readdir').mockResolvedValueOnce([
        { name: 'file1', isDirectory: () => false },
        { name: 'dir1', isDirectory: () => true },
      ] as any);
      const chmodMock = jest.spyOn(fs.promises, 'chmod').mockResolvedValue(undefined as any);
      // Đệ quy cho dir1
      const readdirMock2 = jest.spyOn(fs.promises, 'readdir').mockResolvedValueOnce([] as any);
      await setChmodRecursive('root', 0o755);
      expect(readdirMock).toHaveBeenCalledWith('root', { withFileTypes: true });
      expect(chmodMock).toHaveBeenCalledWith(path.join('root', 'file1'), 0o755);
      expect(chmodMock).toHaveBeenCalledWith(path.join('root', 'dir1'), 0o755);
      expect(readdirMock2).toHaveBeenCalledWith(path.join('root', 'dir1'), { withFileTypes: true });
    });
  });

  describe('unzipCrx', () => {
    it('giải nén zip buffer ra thư mục và set chmod', async () => {
      const readFileMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValueOnce(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]));
      const mkdirMock = jest.spyOn(fs.promises, 'mkdir').mockResolvedValueOnce(undefined as any);
      const extractAllToMock = jest.fn();
      const chmodMock = jest.spyOn(fs.promises, 'chmod').mockResolvedValue(undefined as any);
      jest.spyOn(fs.promises, 'readdir').mockResolvedValueOnce([] as any);
      (AdmZip as any).mockImplementation(() => ({ extractAllTo: extractAllToMock }));
      await unzipCrx('file.crx', 'dest');
      expect(readFileMock).toHaveBeenCalledWith(path.resolve('file.crx'));
      expect(mkdirMock).toHaveBeenCalledWith('dest', { recursive: true });
      expect(extractAllToMock).toHaveBeenCalledWith('dest', true);
      expect(chmodMock).toHaveBeenCalled();
    });
  });
});
