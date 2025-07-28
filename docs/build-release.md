# 🚀 Build, Release & CI/CD

Tài liệu này hướng dẫn quy trình build, đóng gói, phát hành và tự động hóa kiểm thử/triển khai cho dự án Ecoma Desktop.

## 1. Build production
- Đảm bảo đã cài đặt đầy đủ dependencies:
  ```bash
  npm install
  ```
- Build toàn bộ các project:
  ```bash
  npx nx run-many -t build
  ```
- Hoặc build riêng từng project:
  ```bash
  npx nx build tiktok-main
  npx nx build tiktok-renderer
  npx nx build electron-devkit
  npx nx build electron-kit
  npx nx build nx-electron
  ```
- Kết quả build sẽ nằm trong thư mục `dist/` của từng project.

## 2. Đóng gói ứng dụng desktop (Electron)
- Sử dụng lệnh package để đóng gói:
  ```bash
  npx nx package tiktok
  ```
- Hoặc sử dụng lệnh make để đóng gói và phát hành:
  ```bash
  npx nx make tiktok --publish=always
  ```
- Ứng dụng sẽ được đóng gói cho các nền tảng (Windows, Mac, ...), file cài đặt nằm trong thư mục `dist/` hoặc `mock-update/`.
- Có thể cấu hình thêm trong file `packages/nx-electron/src/utils/electron.config.ts` hoặc các file cấu hình liên quan.

## 3. Quy trình release
1. Đảm bảo code đã được review, test, build thành công
2. Tăng version (nếu cần), cập nhật changelog
3. Chạy lệnh đóng gói và publish như trên
4. Kiểm tra lại file cài đặt, thử nghiệm trên các nền tảng chính
5. Đẩy release lên GitHub Releases (tự động qua lệnh make)

## 4. CI/CD pipeline (tự động hóa)
- Dự án sử dụng GitHub Actions để tự động hóa:
  - Kiểm tra lint, test, build khi có pull request hoặc push lên nhánh chính
  - Tự động đóng gói và publish release khi merge vào nhánh chính
- File cấu hình workflow nằm trong `.github/workflows/`
- Có thể mở rộng thêm các bước kiểm thử, deploy theo nhu cầu

## 5. Nx Build Commands
```bash
# Build affected projects only
npx nx affected:build

# Build with specific configuration
npx nx build tiktok --configuration=production

# Package with specific target
npx nx package tiktok --target=win32
npx nx package tiktok --target=darwin

# Make with specific options
npx nx make tiktok --publish=always --target=win32
```

## 6. Một số lưu ý
- Luôn kiểm tra lại file cài đặt trên các nền tảng trước khi phát hành chính thức
- Đảm bảo không để lộ thông tin nhạy cảm trong file build/release
- Có thể sử dụng các badge build status, release version trong README.md để minh bạch trạng thái dự án
- Sử dụng Nx affected commands để chỉ build những gì thay đổi, tiết kiệm thời gian

> **Nếu gặp lỗi build/release, hãy kiểm tra lại log chi tiết hoặc liên hệ team để được hỗ trợ!** 
