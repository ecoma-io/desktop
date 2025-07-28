import { DevkitOptions } from './types';
import { registerAutoOpenDevtools } from './devtools-auto-open';
import { installExtensions } from './extenstion-installer';
import { loadUnpackedExtensions } from './extension-loader';

export async function setupDevkit(options: DevkitOptions = {}) {
  const logger = options.logger;
  // Mở devtools nếu có options
  if (options.showDevToolsWindowOpened || options.devToolsMode) {
    registerAutoOpenDevtools(options);
  }
  // Cài extension từ Chrome Store
  if (options.extensionInstalls && options.extensionInstalls.length > 0) {
    await installExtensions(options.extensionInstalls, logger);
  }
  // Load unpacked extension
  if (options.unpackedExtensionInstalls && options.unpackedExtensionInstalls.length > 0) {
    await loadUnpackedExtensions(options.unpackedExtensionInstalls, logger);
  }
}
