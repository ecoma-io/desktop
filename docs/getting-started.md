# 🚀 Bắt đầu với Ecoma Desktop

Hướng dẫn nhanh để cài đặt, phát triển và kiểm thử dự án Ecoma Desktop.

## 1. Yêu cầu hệ thống

- **Node.js >= 22.x**
- **npm >= 10.x**
- **Git**

## 2. Clone mã nguồn

```bash
git clone https://github.com/ecoma-io/tikertok-source.git
cd tikertok-source
```

## 3. Cài đặt dependencies

```bash
npm install
```

## 4. Chạy ứng dụng ở chế độ phát triển

```bash
# Chạy toàn bộ ứng dụng (main + renderer)
npx nx serve tiktok

# Hoặc chạy riêng từng phần
npx nx serve tiktok-main    # Chỉ main process
npx nx serve tiktok-renderer # Chỉ renderer process
```

> Khởi động ứng dụng với hot-reload.

## 5. Build production

```bash
# Build toàn bộ ứng dụng
npx nx run-many -t build

# Hoặc build riêng từng project
npx nx build tiktok-main
npx nx build tiktok-renderer
npx nx build electron-devkit
npx nx build electron-kit
npx nx build nx-electron
```

> Đóng gói ứng dụng cho môi trường production.

## 6. Chạy test đơn vị (unit test)

```bash
# Test toàn bộ workspace
npx nx run-many -t test

# Hoặc test riêng từng project
npx nx test tiktok-main
npx nx test tiktok-renderer
npx nx test electron-devkit
npx nx test electron-kit
npx nx test nx-electron
```

## 7. Chạy kiểm thử end-to-end (E2E)

```bash
npx nx automate tiktok-e2e
```

## 8. Package ứng dụng

```bash
# Package cho distribution
npx nx package tiktok

# Hoặc make installer
npx nx make tiktok
```

## 9. Một số lệnh hữu ích khác

- Xem sơ đồ phụ thuộc dự án:
  ```bash
  npx nx graph
  ```
- Liệt kê tất cả project và target:
  ```bash
  npx nx show projects
  ```
- Xem chi tiết project:
  ```bash
  npx nx show project tiktok
  ```
- Chạy lint:
  ```bash
  npx nx run-many -t lint
  ```

## 10. Cấu trúc dự án

```
apps/
  └─ tiktok/
      ├─ main/         # Electron main process
      ├─ renderer/     # Angular UI
      └─ e2e/          # End-to-end tests

packages/
  ├─ electron-devkit/  # Chrome extensions & devtools
  ├─ electron-kit/     # Core Electron services
  └─ nx-electron/      # Nx plugin for Electron
```
