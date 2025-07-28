import path from 'path';
import fs from 'fs';
import * as ASAR from '@electron/asar';

/**
 * Phân tích thư mục `out` để tìm build mới nhất của dự án Electron.
 * Sử dụng `npm run package` (hoặc tương tự) để build ứng dụng trước khi test.
 *
 * Giả định: Chúng ta giả định rằng build sẽ nằm trong thư mục `out`, và thư mục build
 * sẽ được đặt tên với tên platform được phân tách bằng dấu gạch ngang, ví dụ:
 * `out/my-app-win-x64`. Nếu thư mục build của bạn không phải là `out`, bạn có thể
 * truyền tên thư mục như tham số `buildDirectory`. Nếu thư mục build của bạn không được
 * đặt tên với tên platform được phân tách bằng dấu gạch ngang, hàm này sẽ không hoạt động.
 * Tuy nhiên, bạn có thể truyền đường dẫn build trực tiếp vào `parseElectronApp()`.
 *
 * @see parseElectronApp
 *
 * @param buildDirectory {string} - tùy chọn - thư mục để tìm kiếm build mới nhất
 * (đường dẫn/tên tương đối với package root hoặc đường dẫn đầy đủ bắt đầu với /). Mặc định là `out`.
 * @returns {string} - đường dẫn đến thư mục build được sửa đổi gần đây nhất
 */
export function findLatestBuild(buildDirectory = 'out'): string {
  // thư mục gốc của dự án
  const rootDir = path.resolve('./');
  // thư mục nơi các build được lưu trữ
  const outDir = path.resolve(rootDir, buildDirectory);
  // danh sách các file trong thư mục out
  const builds = fs.readdirSync(outDir);
  const platforms = [
    'win32',
    'win',
    'windows',
    'darwin',
    'mac',
    'macos',
    'osx',
    'linux',
    'ubuntu',
    'debian',
  ];
  const latestBuild = builds
    .map(fileName => {
      // đảm bảo đó là thư mục với platform được phân tách bằng "-" trong tên
      const stats = fs.statSync(path.join(outDir, fileName));
      const isBuild = fileName
        .toLocaleLowerCase()
        .split('-')
        .some(part => platforms.includes(part));
      if (stats.isDirectory() && isBuild) {
        return {
          name: fileName,
          time: fs.statSync(path.join(outDir, fileName)).mtimeMs,
        };
      }
      return undefined;
    })
    .sort((a, b) => {
      const aTime = a ? a.time : 0;
      const bTime = b ? b.time : 0;
      return bTime - aTime;
    })
    .map(file => {
      if (file) {
        return file.name;
      }
      return undefined;
    })[0];
  if (!latestBuild) {
    throw new Error('No build found in the out directory');
  }
  return path.join(outDir, latestBuild);
}

type Architecture = 'x64' | 'x32' | 'arm64' | 'universal' | undefined;

export interface PackageJson {
  [key: string]: unknown;
  name: string;
  productName?: string;
  main: string;
  version: string;
  description?: string;
  author?: string | { name: string; email: string };
  license?: string;
  repository?: string;
  homepage?: string;
  bugs?: string | { url: string };
}

/**
 * Định dạng dữ liệu trả về từ `parseElectronApp()`
 * @typedef ElectronAppInfo
 * @prop {string} executable - đường dẫn đến file thực thi Electron
 * @prop {string} main - đường dẫn đến file chính (JS)
 * @prop {string} name - tên của ứng dụng
 * @prop {string} resourcesDir - đường dẫn đến thư mục resources
 * @prop {boolean} asar - liệu ứng dụng có được đóng gói dưới dạng archive asar không
 * @prop {string} platform - 'darwin', 'linux', hoặc 'win32'
 * @prop {string} arch - 'x64', 'x32', hoặc 'arm64'
 * @prop {PackageJson} packageJson - nội dung của file package.json đã được `JSON.parse()`.
 */
export interface ElectronAppInfo {
  /** Đường dẫn đến file thực thi của ứng dụng */
  executable: string;
  /** Đường dẫn đến file chính (JS) của ứng dụng */
  main: string;
  /** Tên của ứng dụng */
  name: string;
  /** Thư mục resources */
  resourcesDir: string;
  /** True nếu ứng dụng sử dụng asar */
  asar: boolean;
  /** Nền tảng hệ điều hành */
  platform: 'darwin' | 'win32' | 'linux';
  /** Kiến trúc */
  arch: Architecture;
  /** Nội dung của file package.json đã được JSON.parse(). */
  packageJson: PackageJson;
}

/**
 * Cho một thư mục chứa build ứng dụng Electron,
 * hoặc đường dẫn đến ứng dụng (thư mục trên Mac, file thực thi trên Windows),
 * trả về một loạt metadata, bao gồm đường dẫn đến file thực thi của ứng dụng
 * và đường dẫn đến file chính của ứng dụng.
 *
 * Định dạng dữ liệu trả về là một object với các thuộc tính sau:
 * - executable: đường dẫn đến file thực thi của ứng dụng
 * - main: đường dẫn đến file chính (JS) của ứng dụng
 * - name: tên của ứng dụng
 * - resourcesDir: đường dẫn đến thư mục resources của ứng dụng
 * - asar: true nếu ứng dụng sử dụng asar
 * - platform: nền tảng hệ điều hành
 * - arch: kiến trúc
 * - packageJson: nội dung của file package.json đã được JSON.parse().
 *
 * @param buildDir {string} - đường dẫn tuyệt đối đến thư mục build hoặc ứng dụng
 * @returns {ElectronAppInfo} metadata về ứng dụng
 */
export function parseElectronApp(buildDir: string): ElectronAppInfo {
  // Nền tảng của ứng dụng
  let platform: 'darwin' | 'win32' | 'linux' | undefined;

  // trong trường hợp buildDir là đường dẫn đến ứng dụng
  if (buildDir.endsWith('.app')) {
    buildDir = path.dirname(buildDir);
    platform = 'darwin';
  } else if (buildDir.endsWith('.exe')) {
    buildDir = path.dirname(buildDir);
    platform = 'win32';
  } else {
    // tương đương cho Linux?
  }

  // Tên của thư mục build ĐƯỢC CHUYỂN THÀNH CHỮ THƯỜNG
  const baseNameLc = path.basename(buildDir).toLowerCase();
  if (!platform) {
    // phân tích tên thư mục để xác định nền tảng
    if (baseNameLc.includes('win')) {
      platform = 'win32';
    }
    if (
      baseNameLc.includes('linux') ||
      baseNameLc.includes('ubuntu') ||
      baseNameLc.includes('debian')
    ) {
      platform = 'linux';
    }
    if (baseNameLc.includes('darwin') || baseNameLc.includes('mac') || baseNameLc.includes('osx')) {
      platform = 'darwin';
    }
  }

  if (!platform) {
    throw new Error(`No platform found in the directory name: ${baseNameLc}`);
  }

  let arch: Architecture;
  if (baseNameLc.includes('x32') || baseNameLc.includes('i386')) {
    arch = 'x32';
  }
  if (baseNameLc.includes('x64')) {
    arch = 'x64';
  }
  if (baseNameLc.includes('arm64')) {
    arch = 'arm64';
  }
  if (baseNameLc.includes('universal')) {
    arch = 'universal';
  }

  if (!arch) {
    // chúng ta vẫn chưa xác định được kiến trúc
    // hãy thử một cách khác
    if (baseNameLc.includes('x86')) {
      arch = 'x32';
    } else if (baseNameLc.includes('arm')) {
      arch = 'arm64';
    } else if (baseNameLc.includes('univ')) {
      arch = 'universal';
    }
  }

  let executable: string;
  let main: string;
  let name: string;
  let asar: boolean;
  let resourcesDir: string;
  let packageJson: PackageJson;

  if (platform === 'darwin') {
    // Cấu trúc MacOS
    // <buildDir>/
    //   <appName>.app/
    //     Contents/
    //       MacOS/
    //        <appName> (file thực thi)
    //       Info.plist
    //       PkgInfo
    //       Resources/
    //         electron.icns
    //         file.icns
    //         app.asar (bundle asar) - hoặc -
    //         app
    //           package.json
    //           (cấu trúc ứng dụng của bạn)
    const list = fs.readdirSync(buildDir);
    const appBundle = list.find(fileName => {
      return fileName.endsWith('.app');
    });
    if (!appBundle) {
      throw new Error(`Không thể tìm thấy app bundle trong ${buildDir}`);
    }
    const appDir = path.join(buildDir, appBundle, 'Contents', 'MacOS');
    const appName = fs.readdirSync(appDir)[0];
    executable = path.join(appDir, appName);

    resourcesDir = path.join(buildDir, appBundle, 'Contents', 'Resources');
    const resourcesList = fs.readdirSync(resourcesDir);
    asar = resourcesList.includes('app.asar');

    if (asar) {
      const asarPath = path.join(resourcesDir, 'app.asar');
      packageJson = JSON.parse(ASAR.extractFile(asarPath, 'package.json').toString('utf8'));
      main = path.join(asarPath, packageJson.main);
    } else {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(resourcesDir, 'app', 'package.json'), 'utf8')
      );
      main = path.join(resourcesDir, 'app', packageJson.main);
    }
    name = packageJson.name;
  } else if (platform === 'win32') {
    // Cấu trúc Windows
    // <buildDir>/
    //   <appName>.exe (file thực thi)
    //   resources/
    //     app.asar (bundle asar) - hoặc -
    //     app
    //       package.json
    //       (cấu trúc ứng dụng của bạn)
    const list = fs.readdirSync(buildDir);

    // !! giả định file thực thi là file .exe duy nhất trong thư mục
    const exe = list.find(fileName => {
      return fileName.endsWith('.exe');
    });
    if (!exe) {
      throw new Error(`Cannot find executable file in ${buildDir}`);
    }
    executable = path.join(buildDir, exe);

    resourcesDir = path.join(buildDir, 'resources');
    const resourcesList = fs.readdirSync(resourcesDir);
    asar = resourcesList.includes('app.asar');

    if (asar) {
      const asarPath = path.join(resourcesDir, 'app.asar');
      packageJson = JSON.parse(ASAR.extractFile(asarPath, 'package.json').toString('utf8'));
      main = path.join(asarPath, packageJson.main);
    } else {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(resourcesDir, 'app', 'package.json'), 'utf8')
      );
      main = path.join(resourcesDir, 'app', packageJson.main ?? 'index.js');
    }
    name = packageJson.name;
  } else if (platform === 'linux') {
    // Cấu trúc Linux
    // <buildDir>/
    //   <appName> (file thực thi)
    //   resources/
    //     app.asar (bundle asar) - hoặc -
    //     app --- (chưa test - chúng ta đang đưa ra giả định ở đây)
    //       package.json
    //       (cấu trúc ứng dụng của bạn)

    const list = fs.readdirSync(buildDir);
    const exeCandidates = list.filter(fileName => {
      // Giả định file thực thi là file duy nhất trong thư mục mà...
      // ...không có một trong những hậu tố này
      const ignoreSuffixes = ['.so', '.so.1', '.so.2', '.bin', '.pak', '.dat', '.json'];
      // ...không có một trong những tên này
      const ignoreNames = ['resources', 'locales', 'version', 'LICENSE'];
      // ...không bắt đầu với một trong những tên này
      const ignoreStartsWith = ['chrome-', 'chrome_', 'lib', 'LICENSE'];

      if (ignoreSuffixes.some(suffix => fileName.endsWith(suffix))) {
        return false;
      }
      if (ignoreNames.some(name => fileName === name)) {
        return false;
      }
      if (ignoreStartsWith.some(name => fileName.startsWith(name))) {
        return false;
      }
      const filePath = path.join(buildDir, fileName);
      const stats = fs.statSync(filePath);

      // ...không phải là thư mục
      if (stats.isDirectory()) {
        return false;
      }

      // ...không phải là symlink
      if (stats.isSymbolicLink()) {
        return false;
      }

      // ...có thể thực thi
      try {
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
    if (exeCandidates.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        `Found ${exeCandidates.length} executable files in ${buildDir}. Using the first one: ${exeCandidates[0]}. If this is not the correct executable file, please create an issue at https://github.com/spaceagetv/electron-playwright-helpers/issues`
      );
    }
    if (exeCandidates.length < 1) {
      throw new Error(
        `Cannot find executable file in ${buildDir}. Please check your build directory. If the file exists, please make sure it is executable. If the file is executable, please create an issue at https://github.com/spaceagetv/electron-playwright-helpers/issues`
      );
    }
    executable = path.join(buildDir, exeCandidates[0]);

    resourcesDir = path.join(buildDir, 'resources');
    const resourcesList = fs.readdirSync(resourcesDir);
    asar = resourcesList.includes('app.asar');
    if (asar) {
      const asarPath = path.join(resourcesDir, 'app.asar');
      packageJson = JSON.parse(ASAR.extractFile(asarPath, 'package.json').toString('utf8'));
      main = path.join(asarPath, packageJson.main);
    } else {
      try {
        packageJson = JSON.parse(
          fs.readFileSync(path.join(resourcesDir, 'app', 'package.json'), 'utf8')
        );
        main = path.join(resourcesDir, 'app', packageJson.main);
      } catch {
        throw new Error(
          `Cannot find package.json in ${resourcesDir}. It seems we don't understand how Electron works on Linux. Please report an issue or pull request!`
        );
      }
    }
    // lấy trường name từ package.json
    name = packageJson.name;
  } else {
    throw new Error(`Platform not supported: ${platform}`);
  }
  return {
    executable,
    main,
    asar,
    name,
    platform,
    resourcesDir,
    arch,
    packageJson,
  };
}
