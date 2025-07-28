/**
 * Hàm deepMerge dùng để hợp nhất đệ quy nhiều object lại với nhau.
 * Nếu các thuộc tính là object thì sẽ merge sâu, còn lại sẽ ghi đè giá trị.
 * Nếu object là null hoặc undefined thì bỏ qua.
 * @param objects Các object cần merge (ít nhất 2 object, có thể null/undefined)
 * @returns Object đã được merge sâu
 */
// Hàm deepMerge hỗ trợ merge sâu cho object, array, primitive, bỏ qua null/undefined
export function deepMerge<T extends object>(...objects: (T | Partial<T> | null | undefined)[]): T {
  // Lọc bỏ object null hoặc undefined
  const validObjects = objects.filter(obj => obj != null) as T[];
  // Nếu không có object nào thì trả về object rỗng
  if (validObjects.length === 0) return {} as T;
  // Nếu chỉ có 1 object thì trả về chính nó
  if (validObjects.length === 1) return validObjects[0];

  // Hàm kiểm tra giá trị là object thuần (không phải array, null)
  const isPlainObject = (obj: unknown): obj is object =>
    obj !== null && typeof obj === 'object' && !Array.isArray(obj);

  // Hàm merge hai object
  const mergeTwo = (target: object, source: object): object => {
    // Nếu một trong hai không phải object thì trả về source (ghi đè)
    if (!isPlainObject(target) || !isPlainObject(source)) {
      // Nếu là array thì ghi đè hoàn toàn
      if (Array.isArray(source)) return source.slice();
      return source;
    }
    // Merge từng thuộc tính
    const result: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = mergeTwo(
          (target as Record<string, unknown>)[key] as object,
          (source as Record<string, unknown>)[key] as object
        );
      } else {
        result[key] = (source as Record<string, unknown>)[key];
      }
    }
    return result;
  };

  // Merge lần lượt từng object vào kết quả
  return validObjects.reduce((prev, curr) => mergeTwo(prev, curr) as T) as T;
}
