import { BrowserWindow, shell } from 'electron';
import z from 'zod';
import { observable } from '@trpc/server/observable';
import { container } from 'tsyringe';
import { createLogScope } from '../utils/create-log';
import { WindowManager } from '../services/window-manager';
import { router, publicProcedure } from '../trpc';
import { DialogService } from '../services/dialog.service';

const logger = createLogScope('window.router');

// Input schemas
const openExternalSchema = z.object({
  url: z.string().url(),
});

const openModalSchema = z.object({
  parentWindowId: z.uuidv7(),
  name: z.string(),
  data: z.any().optional(),
});

const closeModalSchema = z.object({
  modalId: z.uuidv7(),
  result: z.any().optional(),
});

const showModalSchema = z.object({
  modalId: z.uuidv7(),
  width: z.number(),
  height: z.number(),
});

const modalCountChangedSchema = z.object({
  parentWindowId: z.uuidv7(),
});

const modalResultChangedSchema = z.object({
  modalId: z.uuidv7(),
});

const dialogSchema = z.object({
  windowId: z.string(),
  options: z.any(),
});

export const windowRouter = router({
  minimizeWindow: publicProcedure.mutation<void>(() => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      logger.info('Minimize window');
      focusedWindow.minimize();
    } else {
      logger.warn('No focused window to minimize');
    }
  }),

  toggleMaximizeWindow: publicProcedure.mutation<void>(() => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      if (focusedWindow.isMaximized()) {
        logger.info('Unmaximize window');
        focusedWindow.unmaximize();
      } else {
        logger.info('Maximize window');
        focusedWindow.maximize();
      }
    } else {
      logger.warn('No focused window to maximize/unmaximize');
    }
  }),

  closeWindow: publicProcedure.mutation<void>(() => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      logger.info('Close window');
      focusedWindow.close();
    } else {
      logger.warn('No focused window to close');
    }
  }),

  openExternal: publicProcedure.input(openExternalSchema).mutation(async ({ input }) => {
    try {
      logger.info('Opening external link', { url: input.url });
      await shell.openExternal(input.url);
      return true;
    } catch (err) {
      logger.error('Error opening external link', { url: input.url, err });
      return false;
    }
  }),

  openModal: publicProcedure.input(openModalSchema).mutation(async ({ input }) => {
    logger.info('Opening modal', {
      name: input.name,
      parentWindowId: input.parentWindowId,
    });

    const windowManager = container.resolve(WindowManager);
    const { id } = await windowManager.createModalWindow(input.parentWindowId, input.name, {
      data: input.data,
    });

    return id;
  }),

  closeModal: publicProcedure.input(closeModalSchema).mutation(async ({ input }) => {
    logger.info('Closing modal', { modalId: input.modalId });

    const windowManager = container.resolve(WindowManager);
    const modalWindow = windowManager.getWindow(input.modalId);

    if (!modalWindow) {
      throw new Error('Modal window not found');
    }

    if (typeof input.result !== 'undefined') {
      windowManager.emitModalResult(input.modalId, input.result);
    }

    modalWindow.browserWindow.close();
  }),

  showModal: publicProcedure.input(showModalSchema).mutation(async ({ input }) => {
    logger.info('Showing modal', {
      modalId: input.modalId,
      width: input.width,
      height: input.height,
    });

    const windowManager = container.resolve(WindowManager);
    const modalWindow = windowManager.getWindow(input.modalId);

    if (!modalWindow) {
      throw new Error('Modal window not found');
    }

    modalWindow.browserWindow.setSize(input.width, input.height);
    modalWindow.browserWindow.center();
  }),

  modalCountChanged: publicProcedure.input(modalCountChangedSchema).subscription(({ input }) => {
    return observable<{ parentWindowId: string; modals: number }>(observer => {
      logger.info('Client subscribed to modalCountChanged', {
        parentWindowId: input.parentWindowId,
      });

      const windowManager = container.resolve(WindowManager);
      const sub = windowManager.onModalParentChanged.subscribe(
        ({ id, modals }: { id: string; modals: number }) => {
          if (id === input.parentWindowId) {
            observer.next({ parentWindowId: id, modals });
          }
        }
      );

      return () => {
        logger.info('Client unsubscribed from modalCountChanged', {
          parentWindowId: input.parentWindowId,
        });
        sub.unsubscribe();
      };
    });
  }),

  modalResultChanged: publicProcedure.input(modalResultChangedSchema).subscription(({ input }) => {
    return observable<{ modalId: string; result: unknown }>(observer => {
      logger.info('Client subscribed to modalResultChanged', { modalId: input.modalId });

      const windowManager = container.resolve(WindowManager);
      const sub = windowManager.onModalResultChanged.subscribe(({ modalId, result }) => {
        if (modalId === input.modalId) {
          observer.next({ modalId, result });
        }
      });

      return () => {
        logger.info('Client unsubscribed from modalResultChanged', { modalId: input.modalId });
        sub.unsubscribe();
      };
    });
  }),

  openDialogOpen: publicProcedure.input(dialogSchema).mutation(async ({ input }) => {
    logger.info('Opening dialog (open)', { windowId: input.windowId });
    const windowManager = container.resolve(DialogService);
    return await windowManager.openDialogOpen(input.windowId, input.options);
  }),

  openDialogSave: publicProcedure.input(dialogSchema).mutation(async ({ input }) => {
    logger.info('Opening dialog (save)', { windowId: input.windowId });
    const windowManager = container.resolve(DialogService);
    return await windowManager.openDialogSave(input.windowId, input.options);
  }),
});
