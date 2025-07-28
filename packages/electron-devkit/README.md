# @ecoma-io/electron-devkit

Bộ công cụ phát triển cho ứng dụng Electron với hỗ trợ tiện ích mở rộng Chrome và devtools.

## 🎯 Mục đích

`electron-devkit` là một thư viện hỗ trợ phát triển ứng dụng Electron, cung cấp các tính năng:

- **Tự động mở DevTools**: Tự động mở DevTools khi ứng dụng khởi động
- **Quản lý Tiện ích Chrome**: Tải xuống và cài đặt tiện ích từ Chrome Web Store
- **Hỗ trợ Tiện ích Chưa Đóng gói**: Tải tiện ích từ thư mục cục bộ
- **Quy trình Phát triển**: Tối ưu hóa quy trình phát triển Electron

## 📦 Cài đặt

```bash
npm install @ecoma-io/electron-devkit
```

## 🚀 Sử dụng

### Cơ bản

```typescript
import { setupDevkit } from '@tikertok/electron-devkit';

// Trong quá trình chính của Electron
app.whenReady().then(async () => {
  await setupDevkit({
    // Cấu hình DevTools
    showDevToolsWindowOpened: true,
    devToolsMode: 'detach',
    
    // Cài đặt tiện ích từ Chrome Web Store
    extensionInstalls: [
      {
        id: 'extension-id-from-chrome-store',
        name: 'Tên Tiện ích'
      }
    ],
    
    // Tải tiện ích chưa đóng gói từ thư mục cục bộ
    unpackedExtensionInstalls: [
      {
        path: '/đường/dẫn/đến/tiện/ích/chưa/đóng/gói',
        name: 'Tiện ích Cục bộ'
      }
    ]
  });
  
  // Tạo cửa sổ của bạn
  createWindow();
});
```

### Cấu hình Nâng cao

```typescript
import { setupDevkit } from '@tikertok/electron-devkit';

await setupDevkit({
  // Logger tùy chỉnh
  logger: {
    info: (message: string) => console.log(`[INFO] ${message}`),
    error: (message: string) => console.error(`[ERROR] ${message}`),
    warn: (message: string) => console.warn(`[WARN] ${message}`)
  },
  
  // Cấu hình DevTools
  showDevToolsWindowOpened: process.env.NODE_ENV === 'development',
  devToolsMode: 'right', // 'detach', 'right', 'bottom', 'undocked'
  
  // Quản lý tiện ích
  extensionInstalls: [
    {
      id: 'fmkadmapgofadopljbjfkapdkoienihi', // React DevTools
      name: 'React Developer Tools'
    },
    {
      id: 'nhdogjmejiglipccpnnnanhbledajbpd', // Vue DevTools
      name: 'Vue.js devtools'
    }
  ],
  
  unpackedExtensionInstalls: [
    {
      path: path.join(__dirname, 'extensions', 'my-extension'),
      name: 'Tiện ích Tùy chỉnh Của Tôi'
    }
  ]
});
```

## 📚 Tham khảo API

### `setupDevkit(options?: DevkitOptions): Promise<void>`

Hàm chính để khởi tạo electron-devkit.

#### `DevkitOptions`

```typescript
interface DevkitOptions {
  // Cấu hình Logger
  logger?: {
    info: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
  
  // Cấu hình DevTools
  showDevToolsWindowOpened?: boolean;
  devToolsMode?: 'detach' | 'right' | 'bottom' | 'undocked';
  
  // Tiện ích từ Chrome Web Store
  extensionInstalls?: ExtensionInstall[];
  
  // Tiện ích chưa đóng gói cục bộ
  unpackedExtensionInstalls?: UnpackedExtensionInstall[];
}
```

#### `ExtensionInstall`

```typescript
interface ExtensionInstall {
  id: string;        // ID tiện ích từ Chrome Web Store
  name: string;      // Tên tiện ích (để ghi log)
}
```

#### `UnpackedExtensionInstall`

```typescript
interface UnpackedExtensionInstall {
  path: string;      // Đường dẫn đến thư mục tiện ích
  name: string;      // Tên tiện ích (để ghi log)
}
```

## 🔧 Tính năng

### 1. Tự động mở DevTools

Tự động mở DevTools khi ứng dụng khởi động:

```typescript
await setupDevkit({
  showDevToolsWindowOpened: true,
  devToolsMode: 'detach' // Mở trong cửa sổ riêng biệt
});
```

### 2. Quản lý Tiện ích Chrome

Tự động tải xuống và cài đặt tiện ích từ Chrome Web Store:

```typescript
await setupDevkit({
  extensionInstalls: [
    {
      id: 'fmkadmapgofadopljbjfkapdkoienihi', // React DevTools
      name: 'React Developer Tools'
    }
  ]
});
```

### 3. Hỗ trợ Tiện ích Chưa Đóng gói

Tải tiện ích từ thư mục cục bộ:

```typescript
await setupDevkit({
  unpackedExtensionInstalls: [
    {
      path: path.join(__dirname, 'extensions', 'my-extension'),
      name: 'Tiện ích Tùy chỉnh Của Tôi'
    }
  ]
});
```

### 4. Ghi Log Tùy chỉnh

Tùy chỉnh hành vi ghi log:

```typescript
await setupDevkit({
  logger: {
    info: (message) => console.log(`[DEVKIT] ${message}`),
    error: (message) => console.error(`[DEVKIT ERROR] ${message}`),
    warn: (message) => console.warn(`[DEVKIT WARN] ${message}`)
  }
});
```

## 🛠️ Phát triển

### Build

```bash
nx build electron-devkit
```

### Test

```bash
nx test electron-devkit
```

### Lint

```bash
nx lint electron-devkit
```
