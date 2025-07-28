import { Extension, Session, session as electronSession } from 'electron';
import { UnpackedExtensionItem, Logger } from './types';

export async function _loadExtension(
  extensionPath: string,
  options?: { loadExtensionOptions?: Electron.LoadExtensionOptions; session?: Session }
): Promise<Extension> {
  const targetSession = options?.session || electronSession.defaultSession;
  return targetSession.extensions.loadExtension(extensionPath, options?.loadExtensionOptions);
}

export async function loadUnpackedExtensions(
  unpackedExtensionInstalls: UnpackedExtensionItem[],
  logger?: Logger
): Promise<Extension[]> {
  const loaded: Extension[] = [];
  for (const item of unpackedExtensionInstalls) {
    const { path, loadExtensionOptions, session } = item;
    const targetSession = session || electronSession.defaultSession;
    try {
      logger?.info?.(`Loading unpacked extension: ${path}`);
      const ext = await _loadExtension(path, { loadExtensionOptions, session: targetSession });
      loaded.push(ext as Extension);
      logger?.info?.(`Loaded unpacked extension successfully: ${path}`);
    } catch (err) {
      logger?.error?.(`Error loading unpacked extension ${path}: ${err}`);
    }
  }
  return loaded;
}
