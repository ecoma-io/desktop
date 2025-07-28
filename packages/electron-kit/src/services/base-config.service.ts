import ElectronStore, { Options } from 'electron-store';
import { createLogScope } from '../utils/create-log';

export abstract class BaseConfigService<TData extends Record<string, unknown>> {
  protected store: ElectronStore<TData>;
  private _logger = createLogScope(BaseConfigService.name);

  constructor(storeOptions: Options<TData>) {
    this.store = new ElectronStore<TData>(storeOptions);
  }

  getAllConfig(): TData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (this.store as any).store;
    this._logger.debug('Get all configs', config);
    return config;
  }

  getConfig<K extends keyof TData>(key: K): TData[K] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (this.store as any).get(key as string) as TData[K];
    this._logger.debug('Get config value', { key, value });
    return value;
  }

  setConfig<K extends keyof TData>(key: K, value: TData[K]): boolean {
    try {
      this._logger.debug('Update config', { key, value });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.store as any).set(key as string, value);
      return true;
    } catch (err) {
      this._logger.error('Error updating config', err);
      return false;
    }
  }

  subscribeConfigChanged(callback: (config: TData) => void): () => void {
    const handle = () => {
      const config = this.getAllConfig();
      this._logger.debug('Config changed, sending to callback', config);
      callback(config);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (this.store as any).onDidAnyChange(handle);
    return () => {
      this._logger.debug('Unsubscribed from config changes');
      unsubscribe();
    };
  }
}
