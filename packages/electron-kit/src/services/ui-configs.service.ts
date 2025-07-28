import { BehaviorSubject, Subscription } from 'rxjs';
import { UIConfig, ThemeFavour } from '../types';
import { app } from 'electron/main';
import { join } from 'path';
import { injectable } from 'tsyringe';
import { BaseConfigService } from './base-config.service';
import { createLogScope } from '../utils/create-log';

/**
 * Service quản lý truy xuất và cập nhật cấu hình UI
 */
@injectable()
export class UIConfigsService extends BaseConfigService<Omit<UIConfig, 'themeFavour'>> {
  protected logger = createLogScope(UIConfigsService.name);
  public themeFavour$ = new BehaviorSubject<ThemeFavour>('system');

  constructor() {
    super({
      schema: {
        colorMode: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
          default: 'system',
        },
        zoomFactor: {
          type: 'number',
          minimum: 0.8,
          maximum: 1.2,
          default: 1.0,
        },
      },
      watch: true,
      clearInvalidConfig: true,
      cwd: join(app.getPath('userData'), 'Configs'),
      name: 'ui-configs',
    });
  }

  override getAllConfig(): UIConfig {
    const config = super.getAllConfig();
    return {
      ...config,
      themeFavour: this.themeFavour$.getValue(),
    };
  }

  override getConfig<K extends keyof UIConfig>(key: K): UIConfig[K] {
    if (key === 'themeFavour') {
      const value = this.themeFavour$.getValue() as UIConfig[K];
      this.logger.info('Get UI config value', { key, value });
      return value;
    } else {
      return super.getConfig(key as keyof Omit<UIConfig, 'themeFavour'>) as UIConfig[K];
    }
  }

  override setConfig<K extends keyof UIConfig>(key: K, value: UIConfig[K]): boolean {
    if (key === 'themeFavour') {
      this.logger.info('Update UI config', { key, value });
      this.themeFavour$.next(value as ThemeFavour);
      return true;
    } else {
      return super.setConfig(key as keyof Omit<UIConfig, 'themeFavour'>, value as K extends keyof Omit<UIConfig, 'themeFavour'> ? UIConfig[K] : never);
    }
  }

  override subscribeConfigChanged(callback: (config: UIConfig) => void): () => void {
    const baseUnsub = super.subscribeConfigChanged(config => {
      callback({ ...config, themeFavour: this.themeFavour$.getValue() });
    });
    const themeFavourSub: Subscription = this.themeFavour$.subscribe(() => {
      callback(this.getAllConfig());
    });
    return () => {
      baseUnsub();
      themeFavourSub.unsubscribe();
      this.logger.info('Unsubscribed from UI config changes');
    };
  }
}
