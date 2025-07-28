import { Extension, session as electronSession } from 'electron';
import { ExtensionInstallItem, Logger } from './types';
import { downloadExtension } from './extension-downloader';
import { _loadExtension } from './extension-loader';

export async function installExtensions(
  extensionInstalls: ExtensionInstallItem[],
  logger?: Logger
): Promise<Extension[]> {
  const installed: Extension[] = [];
  for (const item of extensionInstalls) {
    const { id, forceDownload, loadExtensionOptions, session } = item;
    const targetSession = session || electronSession.defaultSession;
    logger?.info?.(`Starting to install extension: ${id}`);
    // Kiểm tra extension đã cài chưa
    const already = targetSession.extensions.getAllExtensions().find(e => e.id === id);
    if (!forceDownload && already) {
      logger?.info?.(`Extension already exists, skipping: ${id}`);
      installed.push(already);
      continue;
    }
    // Tải extension về nếu chưa có
    const extensionFolder = await downloadExtension(id, { forceDownload: !!forceDownload, logger });
    // Nếu forceDownload và đã cài, gỡ ra trước khi cài lại
    if (already?.id) {
      logger?.info?.(`Removing old extension: ${id}`);
      const unloadPromise = new Promise<void>(resolve => {
        const handler = (_: unknown, ext: Extension) => {
          if (ext.id === already.id) {
            targetSession.removeListener('extension-unloaded', handler);
            resolve();
          }
        };
        targetSession.on('extension-unloaded', handler);
      });
      targetSession.extensions.removeExtension(already.id);
      await unloadPromise;
    }
    // Load extension unpacked
    logger?.info?.(`Loading unpacked extension: ${extensionFolder}`);
    const ext = await _loadExtension(extensionFolder, {
      loadExtensionOptions,
      session: targetSession,
    });
    logger?.info?.(`Extension installed successfully: ${id}`);
    installed.push(ext as Extension);
  }
  return installed;
}
