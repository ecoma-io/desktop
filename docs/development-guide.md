# 🛠️ Hướng dẫn phát triển

## 1. Quy tắc code & coding convention
- **Đặt tên biến, hàm, class rõ ràng, nhất quán (camelCase, PascalCase)**
- **Comment/JSDoc bằng tiếng Việt** (giải thích ý nghĩa, chức năng, input/output)
- **Không sử dụng console.log, luôn dùng logging service**
- **Tách logic phức tạp thành hàm nhỏ, dễ kiểm thử**
- **Tuân thủ style guide của Angular, Electron, TypeScript**

## 2. Quy trình thêm mới module/feature
1. **Tạo thư mục/module mới** trong đúng vị trí (apps/tiktok/main, apps/tiktok/renderer, packages/...)
2. **Định nghĩa rõ interface/type** cho dữ liệu trao đổi
3. **Cập nhật dependency nếu cần** (package.json, tsconfig)
4. **Viết test cho logic chính** (unit test, e2e nếu liên quan UI)
5. **Thêm tài liệu cho module mới** (nếu là module lớn)
6. **Tạo pull request, mô tả rõ thay đổi**

## 3. Hướng dẫn viết test
- **Unit test:**
  - Đặt trong cùng thư mục với file code, tên file dạng *.spec.ts
  - Sử dụng Jest, đặt tên test case bằng tiếng Việt
  - Mock các API/phụ thuộc phức tạp, import mock từ __mocks__
- **E2E test:**
  - Đặt trong thư mục apps/tiktok/e2e/src
  - Sử dụng Playwright, mô phỏng hành vi người dùng
- **Chạy test:**
  ```bash
  # Test toàn bộ workspace
  npx nx run-many -t test
  
  # Test riêng từng project
  npx nx test tiktok-main
  npx nx test tiktok-renderer
  npx nx test electron-devkit
  npx nx test electron-kit
  npx nx test nx-electron
  
  # E2E test
  npx nx automate tiktok-e2e
  ```

## 4. Debug & phát hiện lỗi
- **Debug main process:**
  - Sử dụng DevTools của Electron (menu View > Toggle Developer Tools)
  - Có thể debug bằng VSCode (attach vào process Electron)
- **Debug renderer (Angular):**
  - Sử dụng DevTools của Chrome/Electron
  - Có thể đặt breakpoint trực tiếp trong VSCode
- **Theo dõi log:**
  - Tất cả log phải qua logging service, không dùng console.log
  - Log được ghi ra file và hiển thị trong UI (nếu cần)

## 5. Logging chuẩn
- **Sử dụng logging.service.ts (renderer) hoặc create-log.ts (main)**
- **Các mức log:**
  - `logger.info`: sự kiện quan trọng
  - `logger.debug`: chi tiết vận hành
  - `logger.warn`: cảnh báo (tình huống bất thường nhưng chưa phải lỗi nghiêm trọng, ví dụ: dữ liệu thiếu, thao tác không hợp lệ)
  - `logger.error`: lỗi, ngoại lệ
- **Tất cả log message phải viết bằng tiếng Anh**
- **Không log thông tin nhạy cảm**

## 6. Nx Commands hữu ích
```bash
# Xem tất cả projects
npx nx show projects

# Xem chi tiết project
npx nx show project tiktok

# Xem dependency graph
npx nx graph

# Chạy lint
npx nx run-many -t lint

# Build specific project
npx nx build tiktok-main
npx nx build tiktok-renderer

# Serve specific project
npx nx serve tiktok-main
npx nx serve tiktok-renderer
```

## 7. Một số lưu ý khác
- **Luôn cập nhật tài liệu khi thêm/chỉnh sửa module lớn**
- **Kiểm tra lại test, build trước khi tạo pull request**
- **Tuân thủ quy trình review, commit message chuẩn**
- **Sử dụng Nx affected commands để chỉ build/test những gì thay đổi**

