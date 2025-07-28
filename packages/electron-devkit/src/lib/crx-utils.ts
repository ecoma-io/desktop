import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

/**
 * Chuyển buffer .crx (v2 or v3) sang buffer zip (chuẩn Chrome Extension)
 * @param buf Buffer file .crx
 * @returns Buffer zip
 */
export function crxToZip(buf: Buffer): Buffer {
  function calcLength(a: number, b: number, c: number, d: number): number {
    let length = 0;
    length += a << 0;
    length += b << 8;
    length += c << 16;
    length += (d << 24) >>> 0;
    return length;
  }
  // 50 4b 03 04: zip file
  if (buf[0] === 80 && buf[1] === 75 && buf[2] === 3 && buf[3] === 4) {
    return buf;
  }
  // 43 72 32 34 (Cr24)
  if (buf[0] !== 67 || buf[1] !== 114 || buf[2] !== 50 || buf[3] !== 52) {
    throw new Error('Invalid header: Does not start with Cr24');
  }
  const isV3 = buf[4] === 3;
  const isV2 = buf[4] === 2;
  if ((!isV2 && !isV3) || buf[5] || buf[6] || buf[7]) {
    throw new Error('Unexpected crx format version number.');
  }
  if (isV2) {
    const publicKeyLength = calcLength(buf[8], buf[9], buf[10], buf[11]);
    const signatureLength = calcLength(buf[12], buf[13], buf[14], buf[15]);
    const zipStartOffset = 16 + publicKeyLength + signatureLength;
    return buf.slice(zipStartOffset, buf.length);
  }
  // v3 format
  const headerSize = calcLength(buf[8], buf[9], buf[10], buf[11]);
  const zipStartOffset = 12 + headerSize;
  return buf.slice(zipStartOffset, buf.length);
}

/**
 * Đệ quy set chmod cho tất cả file và thư mục bên trong dir
 * @param dir Thư mục gốc
 * @param mode Quyền chmod (vd: 0o755)
 */
export async function setChmodRecursive(dir: string, mode: number) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    await fs.promises.chmod(fullPath, mode);
    if (entry.isDirectory()) {
      await setChmodRecursive(fullPath, mode);
    }
  }
}

/**
 * Giải nén file .crx thành thư mục unpacked extension và set quyền chmod
 * @param crxFilePath Đường dẫn file .crx
 * @param destination Thư mục đích (mặc định cùng tên file)
 */
export async function unzipCrx(crxFilePath: string, destination?: string): Promise<void> {
  const filePath = path.resolve(crxFilePath);
  const extname = path.extname(crxFilePath);
  const basename = path.basename(crxFilePath, extname);
  const dirname = path.dirname(crxFilePath);
  const dest = destination || path.resolve(dirname, basename);
  const buf = await fs.promises.readFile(filePath);
  const zipBuf = crxToZip(buf);
  await fs.promises.mkdir(dest, { recursive: true });
  const zip = new AdmZip(zipBuf);
  zip.extractAllTo(dest, true);
  await setChmodRecursive(dest, 0o755);
}
