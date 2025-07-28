# 🤝 Hướng dẫn đóng góp cho dự án

Cảm ơn bạn đã quan tâm và muốn đóng góp cho Ecoma Desktop! Dưới đây là quy trình và tiêu chuẩn để đảm bảo mọi đóng góp đều nhất quán, chất lượng.

## 1. Quy trình đóng góp
1. **Clone project**
2. **Tạo branch mới** từ nhánh dev (ví dụ: `feature/feature-a`, `fix/bug-a`)
3. **Thực hiện thay đổi, commit rõ ràng**
4. **Kiểm tra lại test, build, tài liệu**
5. **Tạo pull request (PR)**, mô tả rõ thay đổi, liên kết issue (nếu có)
6. **Chờ review, chỉnh sửa theo góp ý (nếu cần)**
7. **PR được merge khi đạt đủ điều kiện review**

## 2. Tiêu chuẩn commit message (Angular style)
- **Cấu trúc:**
  ```
  <type>(<scope>): <short description>
  [BLANK LINE]
  <body>
  [BLANK LINE]
  <footer>
  ```
- **Ví dụ:**
  ```
  feat(renderer): thêm chức năng đăng nhập bằng Google

  Thêm component đăng nhập, tích hợp OAuth2, cập nhật UI.

  Closes #123
  ```
- **Các type phổ biến:**
  - `feat`: Thêm mới tính năng
  - `fix`: Sửa lỗi
  - `docs`: Thay đổi tài liệu
  - `style`: Thay đổi style, format, không ảnh hưởng logic
  - `refactor`: Refactor code, không thêm tính năng hay sửa lỗi
  - `test`: Thêm/sửa test
  - `chore`: Công việc khác (build, tool, deps...)
- **Lưu ý:**
  - Mô tả ngắn gọn, rõ ràng, **bắt buộc dùng tiếng Anh** cho toàn bộ commit message
  - Scope là module hoặc phần ảnh hưởng (tiktok-main, tiktok-renderer, electron-devkit, electron-kit, nx-electron, ...)
  - Body và footer có thể bỏ qua nếu thay đổi nhỏ

## 3. Checklist review pull request
- [ ] Đã chạy test (unit, e2e) và build thành công
- [ ] Đã cập nhật/chỉnh sửa tài liệu liên quan (nếu có)
- [ ] Đặt tên branch, commit, PR rõ ràng, đúng chuẩn
- [ ] Đã tự review code, xóa code thừa, comment debug
- [ ] Đảm bảo không log thông tin nhạy cảm
- [ ] Đã gắn link issue (nếu có)

## 4. Hướng dẫn bổ sung tài liệu
- Thêm/chỉnh sửa tài liệu trong thư mục `docs/`
- Nếu thêm module lớn, nên tạo file riêng và cập nhật sidebar
- Viết tài liệu bằng tiếng Việt, rõ ràng, dễ hiểu
- Có thể dùng sơ đồ, ví dụ minh họa nếu cần

## 5. Nx Workspace Guidelines
- Sử dụng Nx affected commands để chỉ build/test những gì thay đổi
- Tuân thủ cấu trúc monorepo với apps/ và packages/
- Khi thêm project mới, cập nhật nx.json và project.json phù hợp

> **Mọi đóng góp đều được trân trọng! Nếu có thắc mắc, hãy tạo issue hoặc liên hệ team phát triển.** 
