import { inject, injectable } from 'tsyringe';
import { WindowManager } from './window-manager';
import { dialog } from 'electron';

@injectable()
export class DialogService {
  constructor(@inject(WindowManager) private windowManager: WindowManager) {}

  /**
   * Mở hộp thoại chọn file/thư mục (Open Dialog) cho một cửa sổ cụ thể
   * @param windowId ID của cửa sổ
   * @param options Tuỳ chọn cho dialog.showOpenDialog
   */
  async openDialogOpen(
    windowId: string,
    options: Electron.OpenDialogOptions
  ): Promise<Electron.OpenDialogReturnValue> {
    const win = this.windowManager.getMainWindows().find(w => w.id === windowId)?.browserWindow;
    if (!win) throw new Error('Window not found');
    return await dialog.showOpenDialog(win, options);
  }

  /**
   * Mở hộp thoại lưu file (Save Dialog) cho một cửa sổ cụ thể
   * @param windowId ID của cửa sổ
   * @param options Tuỳ chọn cho dialog.showSaveDialog
   */
  async openDialogSave(
    windowId: string,
    options: Electron.SaveDialogOptions
  ): Promise<Electron.SaveDialogReturnValue> {
    const win = this.windowManager.getMainWindows().find(w => w.id === windowId)?.browserWindow;
    if (!win) throw new Error('Window not found');
    return await dialog.showSaveDialog(win, options);
  }
}
