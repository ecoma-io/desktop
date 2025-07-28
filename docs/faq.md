# ❓ FAQ & Troubleshooting

Tài liệu này tổng hợp các câu hỏi thường gặp và hướng dẫn xử lý lỗi khi làm việc với dự án Ecoma Desktop.

---

## 1. Cài đặt & khởi động

**Q: Cài đặt xong chạy `npx nx serve tiktok` báo lỗi thiếu module?**
- Đảm bảo đã chạy `npm install` ở thư mục gốc dự án.
- Nếu vẫn lỗi, thử xóa `node_modules` và `package-lock.json`, sau đó cài lại:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Q: Node.js version not supported?**
- Dự án yêu cầu Node.js >= 22.x. Kiểm tra version bằng `node -v`.
- Nếu version thấp, hãy nâng cấp Node.js.

---

## 2. Build & release

**Q: Build production bị lỗi?**
- Kiểm tra log chi tiết, thường do thiếu dependency hoặc lỗi cấu hình.
- Đảm bảo đã chạy `npm install` và `npx nx run-many -t build`.
- Nếu lỗi liên quan đến Electron, kiểm tra lại file cấu hình `packages/nx-electron/src/utils/electron.config.ts`.

**Q: Đóng gói app không ra file cài đặt?**
- Kiểm tra lại lệnh `npx nx package tiktok` hoặc `npx nx make tiktok --publish=always`.
- Xem log trong terminal, kiểm tra thư mục `dist/` hoặc `mock-update/`.

---

## 3. Test & kiểm thử

**Q: Chạy test báo lỗi không tìm thấy module mock?**
- Đảm bảo đã import mock đúng từ thư mục `__mocks__`.
- Kiểm tra lại đường dẫn import trong file test.

**Q: E2E test không chạy được?**
- Đảm bảo đã cài Playwright: `npx playwright install`
- Kiểm tra lại cấu hình trong `apps/tiktok/e2e/`

---

## 4. Phát triển & debug

**Q: Không thấy log trong UI hoặc file log?**
- Đảm bảo sử dụng đúng logging service (`logging.service.ts` hoặc `create-log.ts`).
- Không dùng `console.log` trực tiếp.

**Q: Giao tiếp giữa main và renderer không hoạt động?**
- Kiểm tra lại contract tRPC, validate dữ liệu truyền qua IPC.
- Xem log ở cả main và renderer để xác định điểm lỗi.

**Q: Làm sao để chạy riêng main hoặc renderer?**
```bash
# Chạy chỉ main process
npx nx serve tiktok-main

# Chạy chỉ renderer process
npx nx serve tiktok-renderer

# Chạy cả hai
npx nx serve tiktok
```

---

## 5. Nx Workspace

**Q: Làm sao để xem dependency graph?**
```bash
npx nx graph
```

**Q: Làm sao để chỉ build những gì thay đổi?**
```bash
npx nx affected:build
npx nx affected:test
npx nx affected:lint
```

**Q: Làm sao để xem chi tiết project?**
```bash
npx nx show project tiktok
npx nx show project tiktok-main
npx nx show project tiktok-renderer
```

---

## 6. Khác

**Q: Làm sao để thêm tài liệu mới vào sidebar?**
- Thêm file markdown vào thư mục `docs/`, sau đó cập nhật `_sidebar.md`.

**Q: Gặp lỗi lạ không tìm thấy trong FAQ?**
- Tìm kiếm trên GitHub Issues của dự án.
- Nếu chưa có, hãy tạo issue mới, mô tả chi tiết lỗi và log liên quan.

---

> **Nếu bạn có câu hỏi mới hoặc gặp lỗi chưa có trong FAQ, hãy đóng góp bổ sung hoặc liên hệ team phát triển để được hỗ trợ!** 
