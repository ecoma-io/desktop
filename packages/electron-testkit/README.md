# @ecoma-io/electron-testkit

Bộ công cụ kiểm thử toàn diện cho ứng dụng Electron được xây dựng với Playwright. Gói này cung cấp các tiện ích để kiểm thử ứng dụng Electron, bao gồm giả lập dialog, phân tích build, tiện ích màu sắc, tích hợp GitHub issue và quản lý ngữ cảnh kiểm thử.

## Tính năng

- **Giả lập Dialog**: Giả lập các phương thức dialog của Electron để kiểm thử tự động
- **Phân tích Build**: Tự động tìm và phân tích các build ứng dụng Electron
- **Tiện ích Màu sắc**: Trích xuất giá trị độ sáng từ các định dạng màu CSS khác nhau
- **Tích hợp GitHub**: Tìm kiếm GitHub issues theo tiêu đề
- **Ngữ cảnh Kiểm thử**: Thiết lập và dọn dẹp đơn giản cho môi trường kiểm thử Electron

## Cài đặt

```bash
npm install @ecoma-io/electron-testkit
```

## Sử dụng

### Giả lập Dialog

Giả lập các phương thức dialog của Electron để ngăn các dialog thực tế xuất hiện trong quá trình kiểm thử:

```typescript
import { stubDialog, stubMultipleDialogs, stubAllDialogs } from '@ecoma-io/electron-testkit';

// Giả lập một phương thức dialog
await stubDialog(app, 'showOpenDialog', {
  filePaths: ['/path/to/file'],
  canceled: false,
});

// Giả lập nhiều phương thức dialog
await stubMultipleDialogs(app, [
  {
    method: 'showOpenDialog',
    value: {
      filePaths: ['/path/to/file1', '/path/to/file2'],
      canceled: false,
    },
  },
  {
    method: 'showSaveDialog',
    value: {
      filePath: '/path/to/save/file',
      canceled: false,
    },
  },
]);

// Giả lập tất cả các phương thức dialog
await stubAllDialogs(app);
```

### Phân tích Build

Tự động tìm và phân tích build ứng dụng Electron của bạn:

```typescript
import { findLatestBuild, parseElectronApp } from '@ecoma-io/electron-testkit';

// Tìm build mới nhất trong thư mục 'out'
const buildPath = findLatestBuild('out');

// Phân tích build để lấy metadata của ứng dụng
const appInfo = parseElectronApp(buildPath);
console.log(appInfo.executable); // Đường dẫn đến file thực thi
console.log(appInfo.main); // Đường dẫn đến file chính
console.log(appInfo.name); // Tên ứng dụng
console.log(appInfo.platform); // 'darwin', 'win32', hoặc 'linux'
```

### Quản lý Ngữ cảnh Kiểm thử

Sử dụng lớp `TestContext` để kiểm thử ứng dụng Electron một cách đơn giản:

```typescript
import { TestContext } from '@ecoma-io/electron-testkit';

describe('Ứng dụng Electron của tôi', () => {
  let testContext: TestContext;

  beforeEach(async () => {
    testContext = new TestContext({
      headless: false,
      timeout: 30000,
    });
    await testContext.setup('my-app');
  });

  afterEach(async () => {
    await testContext.teardown();
  });

  it('nên mở một modal', async () => {
    // Nhấp vào nút mở modal
    await testContext.firstWindow.click('#open-modal');
    
    // Chờ modal xuất hiện
    await testContext.waitForModal('feedback');
    
    // Lấy trang modal
    const modal = await testContext.getModal('feedback');
    expect(modal).not.toBeNull();
  });
});
```

### Tiện ích Màu sắc

Trích xuất giá trị độ sáng từ các định dạng màu CSS khác nhau:

```typescript
import { getColorLightness, detectColorType } from '@ecoma-io/electron-testkit';

// Lấy độ sáng từ các định dạng màu khác nhau
getColorLightness('#ff0000'); // 50 (đỏ)
getColorLightness('rgb(0, 255, 0)'); // 50 (xanh lá)
getColorLightness('oklch(0.5 0.2 240)'); // 0.5
getColorLightness('white'); // 100

// Phát hiện loại màu
detectColorType('#ff0000'); // 'hex'
detectColorType('rgb(255, 0, 0)'); // 'rgb'
detectColorType('oklch(0.5 0.2 240)'); // 'oklch'
```

### Tích hợp GitHub Issue

Tìm kiếm GitHub issues theo tiêu đề:

```typescript
import { findGithubIssueByTitle } from '@ecoma-io/electron-testkit';

// Tìm issue theo tiêu đề (hỗ trợ khớp một phần)
const issue = await findGithubIssueByTitle(
  'Unhandled rejection error',
  'your-username',
  'your-repo',
  'your-github-token' // Tùy chọn
);

if (issue) {
  console.log('Tìm thấy issue:', issue.title);
}
```

## Tham chiếu API

### Giả lập Dialog

#### `stubDialog(app, method, value?)`
Giả lập một phương thức dialog.

- `app`: Instance ElectronApplication
- `method`: Tên phương thức dialog (ví dụ: 'showOpenDialog', 'showSaveDialog')
- `value`: Giá trị trả về tùy chọn (sử dụng mặc định nếu không được cung cấp)

#### `stubMultipleDialogs(app, mocks)`
Giả lập nhiều phương thức dialog cùng lúc.

- `app`: Instance ElectronApplication
- `mocks`: Mảng các stub phương thức dialog

#### `stubAllDialogs(app)`
Giả lập tất cả các phương thức dialog với giá trị mặc định.

### Phân tích Build

#### `findLatestBuild(buildDirectory?)`
Tìm build được sửa đổi gần đây nhất trong thư mục được chỉ định.

- `buildDirectory`: Đường dẫn thư mục tùy chọn (mặc định là 'out')

#### `parseElectronApp(buildDir)`
Phân tích build ứng dụng Electron và trả về metadata.

Trả về đối tượng `ElectronAppInfo` với:
- `executable`: Đường dẫn đến file thực thi
- `main`: Đường dẫn đến file chính
- `name`: Tên ứng dụng
- `resourcesDir`: Đường dẫn thư mục resources
- `asar`: Liệu ứng dụng có sử dụng ASAR hay không
- `platform`: Nền tảng hệ điều hành
- `arch`: Kiến trúc
- `packageJson`: package.json đã được phân tích

### Ngữ cảnh Kiểm thử

#### Lớp `TestContext`

**Constructor:**
```typescript
new TestContext(options?: ElectronLaunchOptions)
```

**Các phương thức:**
- `setup(appDir)`: Khởi tạo ứng dụng Electron
- `teardown()`: Dọn dẹp và đóng ứng dụng
- `waitForModal(name, timeout?)`: Chờ modal xuất hiện
- `getModal(name)`: Lấy trang modal theo tên
- `getAppVersion()`: Lấy phiên bản ứng dụng

**Các thuộc tính:**
- `app`: Instance ElectronApplication
- `BrowserContext`: Ngữ cảnh trình duyệt
- `firstWindow`: Trang cửa sổ đầu tiên

### Tiện ích Màu sắc

#### `getColorLightness(colorString)`
Trích xuất giá trị độ sáng từ chuỗi màu CSS.

#### `detectColorType(colorString)`
Phát hiện loại định dạng màu CSS.

#### `rgbToLightness(r, g, b)`
Chuyển đổi giá trị RGB thành độ sáng.

### Tích hợp GitHub

#### `findGithubIssueByTitle(title, owner, repo, token?)`
Tìm GitHub issue theo tiêu đề (hỗ trợ khớp một phần).

## Nền tảng được Hỗ trợ

- **macOS**: Gói `.app`
- **Windows**: File thực thi `.exe`
- **Linux**: File thực thi

## Định dạng Màu được Hỗ trợ

- Màu hex (`#ff0000`, `#f00`)
- RGB/RGBA (`rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`)
- OKLCH (`oklch(0.5 0.2 240)`)
- OKLAB (`oklab(0.5 0.2 0.3)`)
- Từ khóa màu CSS (`red`, `blue`, `white`, v.v.)

## Build

```bash
nx build electron-testkit
```

## Kiểm thử

```bash
nx test electron-testkit
```
