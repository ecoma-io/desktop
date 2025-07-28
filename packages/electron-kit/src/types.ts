import { reporterRoute } from './routers/reporter.router';
import { uiConfigsRouter } from './routers/ui-config.router';
import { windowRouter } from './routers/window.router';
import { router } from './trpc';
import { AnyTRPCRouter } from '@trpc/server';

export type SystemColorMode = 'light' | 'dark';
export type ColorMode = SystemColorMode | 'system';
export type Platform = 'win32' | 'darwin';
export type ThemeFavour = Platform | 'system';
export type MessageBoxType = 'info' | 'warn' | 'error' | 'success' | 'update-avaiable';

export type MessageButton = {
  label: string;
  style?:
    | 'primary'
    | 'accent'
    | 'secondary'
    | 'success'
    | 'info'
    | 'error'
    | 'warning'
    | 'neutral'
    | 'ghost'
    | 'outline';
};

export type PaddingConfig =
  | number
  | string
  | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };

export type MessageBoxStyleConfig = {
  // Kích thước modal (bắt buộc)
  width: number;
  height: number;

  // Padding cho từng phần (có thể là number hoặc object)
  headerPadding?: PaddingConfig;
  contentPadding?: PaddingConfig;
  footerPadding?: PaddingConfig;

  // Font size
  titleFontSize?: number;
  messageFontSize?: number;

  // Icon size
  iconSize?: number;

  // Button styling
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg';
  buttonGap?: number;

  // Spacing giữa các phần
  headerContentGap?: number;
  contentFooterGap?: number;
};

export type MessageBoxData = {
  closeable?: boolean;
  type?: MessageBoxType;
  title?: string;
  message?: string;
  buttons?: Array<MessageButton>;
  targetResultWindowId?: string;
  styles?: Record<Platform, MessageBoxStyleConfig>;
};

export type UIConfig = {
  colorMode: ColorMode;
  themeFavour: ThemeFavour;
  zoomFactor: number;
};

export type ReportType =
  | 'uncaught'
  | 'unhandled-rejection'
  | 'feedback:bug'
  | 'feedback:feature'
  | 'feedback:other';

/**
 * Tuỳ chọn để tạo issue trên GitHub
 * @property title Tiêu đề issue
 * @property body Nội dung issue
 * @property type Danh sách loại báo cáo (dùng làm label)
 */
export interface ReportOptions {
  title: string;
  body: string;
  type: ReportType;
}

export type DatabaseEvent<T> = {
  type: 'add' | 'update' | 'delete';
  id: string;
  data?: T;
};

// Type helper để kết hợp các router
export type WithAppRouters<T extends Record<string, AnyTRPCRouter>> = ReturnType<
  typeof router<
    T & {
      reporter: typeof reporterRoute;
      uiConfigs: typeof uiConfigsRouter;
      window: typeof windowRouter;
    }
  >
>;
