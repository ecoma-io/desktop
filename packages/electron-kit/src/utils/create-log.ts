import log from 'electron-log/main';
/**
 * Tạo logger với scope theo tên file truyền vào
 * @param scope Tên file (ví dụ: 'window-manager.ts')
 */
export function createLogScope(scope: string) {
  return log.scope(`${scope}`);
}
