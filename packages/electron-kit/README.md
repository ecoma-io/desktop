# @ecoma-io/electron-kit

Bộ công cụ phát triển Electron toàn diện để xây dựng các ứng dụng desktop mạnh mẽ với TypeScript, tRPC và các phương pháp phát triển hiện đại.

## 🚀 Tính năng

- **Quản lý ứng dụng**: Quản lý vòng đời ứng dụng Electron hoàn chỉnh với dependency injection
- **Quản lý cửa sổ**: Tạo, quản lý cửa sổ nâng cao và giao tiếp IPC
- **Tích hợp tRPC**: Giao tiếp API an toàn kiểu dữ liệu giữa main và renderer processes
- **Tự động cập nhật**: Chức năng cập nhật ứng dụng tích hợp sẵn
- **Báo cáo lỗi**: Hệ thống xử lý và báo cáo lỗi toàn diện
- **Cấu hình UI**: Quản lý theme UI động và cấu hình
- **Phục vụ Renderer**: Phục vụ renderer process trong phát triển và sản xuất
- **Quản lý Dialog**: Xử lý dialog và message box đa nền tảng

## 📦 Cài đặt

```bash
npm install @ecoma-io/electron-kit
```

### Dependencies cần thiết

Gói này yêu cầu các dependencies cần thiết sau:

```json
{
  "electron": "^36.7.1",
  "typescript": ">=5.0.0"
}
```

## 🏗️ Bắt đầu nhanh

### Thiết lập ứng dụng cơ bản

```typescript
import { Application } from '@ecoma-io/electron-kit';
import { router } from 'your-app-router';

const app = new Application({
  renderer: {
    port: 4200,
    devServer: true,
    distPath: 'dist/renderer'
  },
  reporter: {
    githubToken: process.env.GITHUB_TOKEN,
    repository: 'your-org/your-repo'
  },
  updater: {
    autoUpdater: true,
    updateServerUrl: 'https://your-update-server.com'
  },
  routers: {
    // Các tRPC routers tùy chỉnh của bạn
    api: router
  },
  services: [
    // Các services tùy chỉnh của bạn
  ]
});
```

### Quản lý cửa sổ

```typescript
import { WindowManager } from '@ecoma-io/electron-kit';

// Tạo cửa sổ chính
const windowManager = container.resolve(WindowManager);
windowManager.createMainWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});

// Tạo cửa sổ modal
windowManager.createModalWindow({
  parent: mainWindow,
  width: 600,
  height: 400,
  modal: true
});
```

## 📚 Tham khảo API

### Các lớp cốt lõi

#### `Application`

Lớp ứng dụng chính điều phối tất cả services và quản lý vòng đời ứng dụng.

```typescript
interface ApplicationOptions {
  renderer: RendererServeOptions;
  reporter: ReporterOptions;
  updater: UpdaterOptions;
  routers: Record<string, AnyTRPCRouter>;
  services: Array<constructor<unknown>>;
  windowManager?: WindowManagerOptions;
}
```

#### `WindowManager`

Quản lý việc tạo cửa sổ, vòng đời và giao tiếp IPC.

**Các phương thức:**
- `createMainWindow(options?)`: Tạo cửa sổ ứng dụng chính
- `createModalWindow(options)`: Tạo cửa sổ modal
- `getMainWindows()`: Trả về tất cả cửa sổ chính
- `registerIPCHandler(router)`: Đăng ký tRPC router cho giao tiếp IPC

### Services

#### `RendererServeService`

Xử lý việc phục vụ renderer process trong phát triển và sản xuất.

```typescript
interface RendererServeOptions {
  port: number;
  devServer: boolean;
  distPath: string;
}
```

#### `UpdaterService`

Quản lý cập nhật ứng dụng sử dụng electron-updater.

```typescript
interface UpdaterOptions {
  autoUpdater: boolean;
  updateServerUrl: string;
  allowPrerelease?: boolean;
}
```

#### `ReporterService`

Xử lý báo cáo lỗi và gửi phản hồi đến GitHub.

```typescript
interface ReporterOptions {
  githubToken: string;
  repository: string;
}
```

#### `UIConfigsService`

Quản lý cấu hình UI bao gồm themes, chế độ màu và mức độ zoom.

```typescript
interface UIConfig {
  colorMode: ColorMode;
  themeFavour: ThemeFavour;
  zoomFactor: number;
}
```

### Routers

#### Các tRPC Routers tích hợp sẵn

- **`reporterRouter`**: Báo cáo lỗi và gửi phản hồi
- **`uiConfigsRouter`**: Quản lý cấu hình UI
- **`windowRouter`**: Các thao tác quản lý cửa sổ

### Types

#### Các kiểu cốt lõi

```typescript
type ColorMode = 'light' | 'dark' | 'system';
type ThemeFavour = 'win32' | 'darwin' | 'system';
type Platform = 'win32' | 'darwin';
type MessageBoxType = 'info' | 'warn' | 'error' | 'success' | 'update-available';
```

#### Cấu hình Message Box

```typescript
interface MessageBoxData {
  closeable?: boolean;
  type?: MessageBoxType;
  title?: string;
  message?: string;
  buttons?: Array<MessageButton>;
  targetResultWindowId?: string;
  styles?: Record<Platform, MessageBoxStyleConfig>;
}
```

## 🔧 Cấu hình

### Cấu hình phát triển

```typescript
const devConfig = {
  renderer: {
    port: 4200,
    devServer: true,
    distPath: 'dist/renderer'
  },
  reporter: {
    githubToken: process.env.GITHUB_TOKEN,
    repository: 'your-org/your-repo'
  },
  updater: {
    autoUpdater: false, // Tắt trong phát triển
    updateServerUrl: ''
  }
};
```

### Cấu hình sản xuất

```typescript
const prodConfig = {
  renderer: {
    port: 0, // Port ngẫu nhiên
    devServer: false,
    distPath: 'dist/renderer'
  },
  reporter: {
    githubToken: process.env.GITHUB_TOKEN,
    repository: 'your-org/your-repo'
  },
  updater: {
    autoUpdater: true,
    updateServerUrl: 'https://your-update-server.com'
  }
};
```

## 🧪 Kiểm thử

Chạy các bài kiểm thử đơn vị:

```bash
nx test electron-kit
```

## 📝 Ví dụ

### Tích hợp Service tùy chỉnh

```typescript
import { Injectable } from 'tsyringe';

@Injectable()
class CustomService {
  async doSomething() {
    // Logic service của bạn
  }
}

const app = new Application({
  // ... các tùy chọn khác
  services: [CustomService]
});
```

### tRPC Router tùy chỉnh

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const customRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}!`;
    }),
});

const app = new Application({
  // ... các tùy chọn khác
  routers: {
    custom: customRouter
  }
});
```

### Xử lý lỗi

```typescript
import { ReportType } from '@ecoma-io/electron-kit';

// Toolkit tự động xử lý:
// - Các exception chưa được bắt
// - Các promise rejection chưa được xử lý
// - Sự cố process
// - Sự cố renderer process

// Báo cáo lỗi tùy chỉnh
const reporter = container.resolve(ReporterService);
await reporter.report({
  title: 'Báo cáo lỗi tùy chỉnh',
  body: 'Chi tiết lỗi...',
  type: 'feedback:bug' as ReportType
});
```

