# 🧩 Tài liệu các module chính

Tài liệu này trình bày chi tiết về các module quan trọng trong dự án Ecoma Desktop, giúp lập trình viên dễ dàng phát triển, mở rộng và bảo trì hệ thống.

---

## 1. Main process (`apps/tiktok/main`)
- **Mục đích & vai trò:**
  - Quản lý lifecycle ứng dụng, cửa sổ, cập nhật, giao tiếp hệ điều hành.
  - Là cầu nối IPC với renderer thông qua tRPC.
- **Vị trí/thư mục:** `apps/tiktok/main/`
- **Cấu trúc thư mục con:**
  - `src/app/routers/`: Định nghĩa các route IPC/tRPC
  - `src/app/services/`: Các service chính (database, system-configs, ...)
  - `src/app/workers/`: Worker được spawn từ main
- **Luồng hoạt động chính:**
  - Khởi tạo Electron, tạo cửa sổ, lắng nghe sự kiện hệ điều hành
  - Nhận/gửi message IPC từ renderer qua tRPC
  - Quản lý worker, cập nhật ứng dụng
- **API/public interface:**
  - Các route tRPC (xem trong `routers/`)
  - Các service export ra cho renderer
- **Lưu ý:**
  - Không nên xử lý logic UI tại main
  - Tất cả log phải qua logging service

---

## 2. Renderer process (`apps/tiktok/renderer`)
- **Mục đích & vai trò:**
  - Xây dựng giao diện người dùng bằng Angular
  - Giao tiếp với main qua tRPC (IPC)
- **Vị trí/thư mục:** `apps/tiktok/renderer/`
- **Cấu trúc thư mục con:**
  - `src/app/main-window/`: UI chính với các features (profiles, settings, support)
  - `src/app/modal-windows/`: Các modal, dialog (feedback, message-box, profile-form)
  - `src/app/shared/services/`: Service dùng chung (api, logging, ui-setting)
- **Luồng hoạt động chính:**
  - Render UI, nhận input từ người dùng
  - Gọi API qua tRPC tới main
  - Hiển thị log, thông báo, trạng thái
- **API/public interface:**
  - Các service Angular (api.service.ts, logging.service.ts, ui-setting.service.ts)
- **Lưu ý:**
  - Không gọi trực tiếp Node API, luôn qua tRPC
  - Đặt tên component, service rõ ràng, có comment tiếng Việt

---

## 3. E2E Testing (`apps/tiktok/e2e`)
- **Mục đích & vai trò:**
  - Kiểm thử hành vi người dùng, tự động hóa kiểm thử end-to-end
- **Vị trí/thư mục:** `apps/tiktok/e2e/`
- **Cấu trúc thư mục con:**
  - `src/common/`: Test utilities và helpers
  - `src/profiles/`: Tests cho profile management
  - `src/settings/`: Tests cho system configuration
- **Luồng hoạt động chính:**
  - Sử dụng Playwright để mô phỏng thao tác người dùng
  - Có thể dùng các helper trong `src/utils/`
- **API/public interface:**
  - Các hàm helper, util cho test
- **Lưu ý:**
  - Test case nên đặt tên tiếng Việt, rõ ràng
  - Không phụ thuộc vào dữ liệu thật, nên mock nếu cần

---

## 4. Electron Devkit (`packages/electron-devkit`)
- **Mục đích & vai trò:**
  - Devtools và Chrome extensions management
  - Extension downloader, loader, installer
- **Vị trí/thư mục:** `packages/electron-devkit/`
- **Cấu trúc thư mục con:**
  - `src/lib/`: Core functionality
    - `crx-utils.ts`: Chrome extension utilities
    - `devtools-auto-open.ts`: Auto-open devtools
    - `extension-downloader.ts`: Download extensions
    - `extension-loader.ts`: Load extensions
    - `extension-installer.ts`: Install extensions
- **Luồng hoạt động chính:**
  - Quản lý lifecycle của Chrome extensions
  - Tự động mở devtools khi cần
  - Download và install extensions từ Chrome Web Store
- **API/public interface:**
  - Export các utility functions cho extension management
- **Lưu ý:**
  - Chỉ xử lý extension-related functionality
  - Không phụ thuộc vào UI hoặc main process logic

---

## 5. Electron Kit (`packages/electron-kit`)
- **Mục đích & vai trò:**
  - Core Electron services (window manager, dialog, updater)
  - tRPC routers và services
  - Base configuration và utilities
- **Vị trí/thư mục:** `packages/electron-kit/`
- **Cấu trúc thư mục con:**
  - `src/routers/`: tRPC routers (reporter, ui-config, window)
  - `src/services/`: Core services (base-config, dialog, renderer-serve, reporter, ui-configs, updater, window-manager)
  - `src/utils/`: Utilities (create-log, deep-merge)
- **Luồng hoạt động chính:**
  - Cung cấp base services cho Electron apps
  - Quản lý window, dialog, updater
  - Xử lý tRPC communication
- **API/public interface:**
  - Export services và utilities cho main process
- **Lưu ý:**
  - Core package, được sử dụng bởi main process
  - Không chứa UI logic

---

## 6. Nx Electron (`packages/nx-electron`)
- **Mục đích & vai trò:**
  - Nx plugin cho Electron development
  - Executors cho build, serve, package
- **Vị trí/thư mục:** `packages/nx-electron/`
- **Cấu trúc thư mục con:**
  - `src/executors/`: Nx executors (package, serve)
  - `src/utils/`: Build utilities (config, electron.config, generate-package-json, normalize, run-webpack, workspace)
  - `src/validation/`: Schema validation
- **Luồng hoạt động chính:**
  - Cung cấp Nx executors cho Electron development
  - Build và package Electron apps
  - Serve development environment
- **API/public interface:**
  - Nx executors và utilities
- **Lưu ý:**
  - Private package, chỉ dùng trong workspace
  - Tích hợp với Nx build system

---

> **Nếu bạn thêm module mới, hãy bổ sung vào tài liệu này để mọi người cùng nắm được cấu trúc và vai trò của hệ thống!** 
