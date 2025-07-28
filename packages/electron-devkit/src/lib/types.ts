export interface Logger {
  info(message?: unknown): void;
  warn(message?: unknown): void;
  error(message?: unknown): void;
  debug?(message: string): void;
}

export interface ExtensionInstallItem {
  id: string; // Chrome Store ID
  loadExtensionOptions?: Electron.LoadExtensionOptions;
  forceDownload?: boolean;
  session?: Electron.Session;
}

export interface UnpackedExtensionItem {
  path: string;
  loadExtensionOptions?: Electron.LoadExtensionOptions;
  session?: Electron.Session;
}

export interface DevkitOptions {
  logger?: Logger;
  showDevToolsWindowOpened?: boolean;
  devToolsMode?: 'previous' | 'undocked' | 'right' | 'bottom' | 'detach';
  extensionInstalls?: ExtensionInstallItem[];
  unpackedExtensionInstalls?: UnpackedExtensionItem[];
}
