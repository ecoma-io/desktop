import { ElectronApplication } from 'playwright-core';

export type DialogMethodStub<T extends keyof Electron.Dialog> = {
  method: T;
  value: Awaited<ReturnType<Electron.Dialog[T]>>;
};

export type DialogMethodStubPartial<T extends keyof Electron.Dialog> = {
  method: T;
  value: Partial<Awaited<ReturnType<Electron.Dialog[T]>>>;
};

type DialogDefaults = {
  [K in keyof Electron.Dialog]: Awaited<ReturnType<Electron.Dialog[K]>>;
};

const dialogDefaults: DialogDefaults = {
  showCertificateTrustDialog: undefined, // kiểu void nên để undefined
  showErrorBox: undefined,
  showMessageBox: {
    response: 0,
    checkboxChecked: false,
  },
  showMessageBoxSync: 0,
  showOpenDialog: {
    filePaths: [],
    canceled: false,
  },
  showOpenDialogSync: [],
  showSaveDialog: {
    filePath: '', // trả về chuỗi rỗng thay vì undefined
    canceled: false,
  },
  showSaveDialogSync: '', // trả về chuỗi rỗng thay vì undefined
};

/**
 * Stub một phương thức dialog đơn lẻ. Đây là hàm tiện ích gọi `stubMultipleDialogs`
 * cho một phương thức duy nhất.
 *
 * Playwright không có cách để tương tác với cửa sổ dialog của Electron,
 * vì vậy hàm này cho phép bạn thay thế các phương thức của module dialog trong quá trình test.
 * Bằng cách stub module dialog, ứng dụng Electron của bạn sẽ không hiển thị bất kỳ cửa sổ dialog nào,
 * và bạn có thể kiểm soát giá trị trả về của các phương thức dialog. Về cơ bản bạn đang nói
 * "khi ứng dụng của tôi gọi dialog.showOpenDialog, hãy trả về giá trị này thay thế". Điều này cho phép bạn
 * test hành vi của ứng dụng khi người dùng chọn file, hoặc hủy dialog, v.v.
 *
 * Lưu ý: Mỗi phương thức dialog chỉ có thể được stub với một giá trị tại một thời điểm, vì vậy bạn sẽ muốn gọi
 * `stubDialog` trước mỗi lần bạn mong đợi ứng dụng của mình gọi phương thức dialog.
 *
 * @example
 * ```ts
 * await stubDialog(app, 'showOpenDialog', {
 *  filePaths: ['/path/to/file'],
 *  canceled: false,
 * })
 * await clickMenuItemById(app, 'open-file')
 * // khi ứng dụng của bạn gọi dialog.showOpenDialog,
 * // nó sẽ trả về giá trị bạn đã chỉ định
 * ```
 *
 * @see stubMultipleDialogs
 *
 * @category Dialog
 *
 * @param app {ElectronApplication} Instance ElectronApplication của Playwright.
 * @param method {String} [Phương thức dialog](https://www.electronjs.org/docs/latest/api/dialog#methods) để mock.
 * @param value {ReturnType<Electron.Dialog>} Giá trị mà ứng dụng của bạn sẽ nhận được khi gọi phương thức dialog này.
 *   Xem [tài liệu Electron](https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogbrowserwindow-options) để biết
 *   giá trị trả về của mỗi phương thức.
 * @returns {Promise<void>} Promise được resolve khi mock được áp dụng.
 * @fullfil {void} - Promise được resolve khi mock được áp dụng.
 */
export function stubDialog<T extends keyof Electron.Dialog>(
  app: ElectronApplication,
  method: T,
  value?: Partial<Awaited<ReturnType<Electron.Dialog[T]>>>
) {
  if (!value) value = dialogDefaults[method];
  return stubMultipleDialogs(app, [{ method, value }]);
}

/**
 * Stub các phương thức của module dialog Electron.
 *
 * Playwright không có cách để tương tác với cửa sổ dialog của Electron,
 * vì vậy hàm này cho phép bạn mock các phương thức của module dialog trong quá trình test.
 * Bằng cách mock module dialog, ứng dụng Electron của bạn sẽ không hiển thị bất kỳ cửa sổ dialog nào,
 * và bạn có thể kiểm soát giá trị trả về của các phương thức dialog. Về cơ bản bạn đang nói
 * "khi ứng dụng của tôi gọi dialog.showOpenDialog, hãy trả về giá trị này thay thế". Điều này cho phép bạn
 * test hành vi của ứng dụng khi người dùng chọn file, hoặc hủy dialog, v.v.
 *
 * @example
 * ```ts
 * await stubMultipleDialogs(app, [
 *  {
 *    method: 'showOpenDialog',
 *    value: {
 *      filePaths: ['/path/to/file1', '/path/to/file2'],
 *      canceled: false,
 *    },
 *  },
 *  {
 *     method: 'showSaveDialog',
 *     value: {
 *       filePath: '/path/to/file',
 *       canceled: false,
 *     },
 *   },
 * ])
 * await clickMenuItemById(app, 'save-file')
 * // khi ứng dụng của bạn gọi dialog.showSaveDialog,
 * // nó sẽ trả về giá trị bạn đã chỉ định
 * ```
 *
 * @category Dialog
 *
 * @param app {ElectronApplication} Instance ElectronApplication của Playwright.
 * @param mocks {DialogMethodStubPartial[]} Mảng các mock phương thức dialog để áp dụng.
 * @returns {Promise<void>} Promise được resolve khi các mock được áp dụng.
 * @fullfil {void} - Promise được resolve khi các mock được áp dụng.
 */
export function stubMultipleDialogs<T extends keyof Electron.Dialog>(
  app: ElectronApplication,
  mocks: DialogMethodStubPartial<T>[]
) {
  const mocksRequired = mocks.map(mock => {
    const methodDefault = dialogDefaults[mock.method];
    if (!methodDefault) return mock as DialogMethodStub<T>;
    if (typeof mock.value === 'object') {
      mock.value = Object.assign({}, methodDefault, mock.value);
    } else {
      mock.value = mock.value ?? methodDefault;
    }
    return mock as DialogMethodStub<T>;
  });

  // ý tưởng từ https://github.com/microsoft/playwright/issues/8278#issuecomment-1009957411 bởi @MikeJerred
  return app.evaluate(({ dialog }, mocks) => {
    mocks.forEach((mock: DialogMethodStub<keyof Electron.Dialog>) => {
      const thisDialog = dialog[mock.method];
      if (!thisDialog) {
        throw new Error(`không thể tìm thấy ${mock.method} trên module dialog.`);
      }
      if (mock.method.endsWith('Sync')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        dialog[mock.method] = () => {
          // console.log(`Dialog.${v.method}(${args.join(', ')})`)
          return mock.value;
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        dialog[mock.method] = async () => {
          // console.log(`Dialog.${v.method}(${args.join(', ')})`)
          return mock.value;
        };
      }
    });
  }, mocksRequired);
}

/**
 * Stub tất cả các phương thức dialog. Đây là hàm tiện ích gọi `stubMultipleDialogs`
 * cho tất cả các phương thức dialog. Điều này hữu ích nếu bạn muốn đảm bảo rằng các dialog không được hiển thị
 * trong quá trình test. Tuy nhiên, bạn có thể muốn sử dụng `stubDialog` hoặc `stubMultipleDialogs` để
 * kiểm soát giá trị trả về của các phương thức dialog cụ thể (ví dụ: `showOpenDialog`) trong quá trình test.
 *
 * @see stubDialog
 *
 * @category Dialog
 *
 * @param app {ElectronApplication} Instance ElectronApplication của Playwright.
 * @returns {Promise<void>} Promise được resolve khi các mock được áp dụng.
 * @fullfil {void} - Promise được resolve khi các mock được áp dụng.
 */
export function stubAllDialogs(app: ElectronApplication) {
  // định dạng lại object dialogDefaults thành định dạng mà stubMultipleDialogs mong đợi
  const stubMultipleDialogsArgs = [];
  for (const [method, value] of Object.entries(dialogDefaults)) {
    stubMultipleDialogsArgs.push({ method, value });
  }
  return stubMultipleDialogs(
    app,
    stubMultipleDialogsArgs as DialogMethodStubPartial<keyof Electron.Dialog>[]
  );
}
