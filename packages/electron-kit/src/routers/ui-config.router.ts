import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import { container } from 'tsyringe';
import { UIConfig } from '../types';
import { createLogScope } from '../utils/create-log';
import { router, publicProcedure } from '../trpc';
import { WindowManager } from '../services/window-manager';
import { UIConfigsService } from '../services/ui-configs.service';

const logger = createLogScope('ui-config.route');

const setConfigInputSchema = z.object({
  key: z.enum(['colorMode', 'themeFavour', 'zoomFactor']),
  value: z.union([
    z.enum(['light', 'dark', 'system']),
    z.enum(['win32', 'darwin', 'system']),
    z.number().min(0.8).max(1.2),
  ]),
});

export const uiConfigsRouter = router({
  setConfig: publicProcedure.input(setConfigInputSchema).mutation(({ input }) => {
    const windowManager = container.resolve(WindowManager);
    const uiConfigsService = container.resolve(UIConfigsService);

    try {
      logger.info('Updating UI config', input);
      const ok = uiConfigsService.setConfig(input.key, input.value);

      if (input.key === 'zoomFactor') {
        windowManager.setZoomFactor(input.value as number);
      }

      return ok;
    } catch (err) {
      logger.error('Error updating UI config', err);
      return false;
    }
  }),

  onConfigChanged: publicProcedure.subscription(() => {
    const uiConfigsService = container.resolve(UIConfigsService);

    return observable<UIConfig>(observer => {
      logger.debug('Client subscribed to onConfigChanged');

      const unsubscribe = uiConfigsService.subscribeConfigChanged(config => {
        logger.debug('UI config changed, sending to client', config);
        observer.next(config);
      });

      return () => {
        logger.debug('Client unsubscribed from onConfigChanged');
        unsubscribe();
      };
    });
  }),
});
