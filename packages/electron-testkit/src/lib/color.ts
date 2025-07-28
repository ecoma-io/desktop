/**
 * Lấy giá trị lightness (độ sáng) từ chuỗi màu CSS (hỗ trợ hex, rgb, rgba, oklch, oklab, tên màu CSS)
 * @param colorString Chuỗi màu CSS
 * @returns Giá trị lightness (0-100 hoặc 0-1 tuỳ không gian màu)
 * @throws Nếu chuỗi màu không hợp lệ
 */
export function getColorLightness(colorString: string): number {
  const type = detectColorType(colorString);
  switch (type) {
    case 'oklch':
      return getOklchLightness(colorString);
    case 'oklab':
      return getOklabLightness(colorString);
    case 'hex':
      return getHexLightness(colorString);
    case 'rgb':
      return getRgbLightness(colorString);
    case 'keyword':
      return getKeywordLightness(colorString);
    default:
      throw new Error(`Định dạng chuỗi màu không hợp lệ "${colorString}"`);
  }
}

/**
 * Nhận diện loại chuỗi màu CSS
 * @param colorString Chuỗi màu CSS
 * @returns Loại màu: 'oklch' | 'oklab' | 'hex' | 'rgb' | 'keyword' | 'unknown'
 */
export function detectColorType(
  colorString: string
): 'oklch' | 'oklab' | 'hex' | 'rgb' | 'keyword' | 'unknown' {
  if (/^oklch\(/i.test(colorString)) return 'oklch';
  if (/^oklab\(/i.test(colorString)) return 'oklab';
  if (/^#([A-Fa-f0-9]{3,8})$/.test(colorString)) return 'hex';
  if (/^rgba?\(/i.test(colorString)) return 'rgb';
  if (isCssColorKeyword(colorString)) return 'keyword';
  return 'unknown';
}

/**
 * Kiểm tra xem chuỗi có phải là tên màu CSS không
 */
export function isCssColorKeyword(colorString: string): boolean {
  return colorString.toLowerCase() in cssColorKeywords;
}

/**
 * Lấy lightness từ tên màu CSS
 */
export function getKeywordLightness(colorString: string): number {
  const name = colorString.toLowerCase();
  if (name === 'transparent') {
    // Xử lý đặc biệt cho transparent: lightness = 100 (trắng trong suốt)
    return 100;
  }
  const rgb = cssColorKeywords[name];
  if (!rgb) {
    throw new Error(`Tên màu CSS không hợp lệ "${colorString}"`);
  }
  return rgbToLightness(rgb[0], rgb[1], rgb[2]);
}

/**
 * Bảng ánh xạ tên màu CSS sang RGB
 * (Chỉ liệt kê các màu phổ biến, có thể mở rộng thêm nếu cần)
 */
export const cssColorKeywords: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  pink: [255, 192, 203],
  brown: [165, 42, 42],
  transparent: [255, 255, 255], // Đã xử lý riêng ở trên
  // ... có thể bổ sung thêm các màu khác nếu cần
};

/**
 * Lấy lightness từ chuỗi oklch
 */
export function getOklchLightness(colorString: string): number {
  const match = colorString.match(/oklch\(\s*(-?\d*\.?\d+)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  throw new Error(`Định dạng chuỗi oklch không hợp lệ "${colorString}"`);
}

/**
 * Lấy lightness từ chuỗi oklab
 */
export function getOklabLightness(colorString: string): number {
  const match = colorString.match(/oklab\(\s*(-?\d*\.?\d+)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  throw new Error(`Định dạng chuỗi oklab không hợp lệ "${colorString}"`);
}

/**
 * Lấy lightness từ chuỗi hex
 */
export function getHexLightness(colorString: string): number {
  const match = colorString.match(/^#([A-Fa-f0-9]{3,8})$/);
  if (!match || !match[1]) {
    throw new Error(`Định dạng chuỗi hex không hợp lệ "${colorString}"`);
  }
  const hex = match[1];
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error(`Định dạng chuỗi hex không hợp lệ "${colorString}"`);
  }
  return rgbToLightness(r, g, b);
}

/**
 * Lấy lightness từ chuỗi rgb/rgba
 */
export function getRgbLightness(colorString: string): number {
  const match = colorString.match(/rgba?\(([^)]+)\)/);
  if (!match || !match[1]) {
    throw new Error(`Định dạng chuỗi rgb/rgba không hợp lệ "${colorString}"`);
  }
  const parts = match[1].split(',').map(x => parseFloat(x.trim()));
  if (parts.length < 3) {
    throw new Error(`Định dạng chuỗi rgb/rgba không hợp lệ "${colorString}"`);
  }
  const [r, g, b] = parts;
  return rgbToLightness(r, g, b);
}

/**
 * Chuyển đổi RGB sang lightness (theo HSL)
 * @param r Giá trị đỏ (0-255)
 * @param g Giá trị xanh lá (0-255)
 * @param b Giá trị xanh dương (0-255)
 * @returns Lightness (0-100)
 */
export function rgbToLightness(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return ((max + min) / 2) * 100;
}
