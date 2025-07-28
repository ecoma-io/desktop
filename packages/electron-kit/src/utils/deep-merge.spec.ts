import { deepMerge } from './deep-merge';

/**
 * Unit test cho hàm deepMerge
 * Tên test case và comment đều bằng tiếng Việt
 */
describe('deepMerge - Hợp nhất đệ quy object', () => {
  it('Nên merge hai object đơn giản', () => {
    const obj1: any = { a: 1, b: 2 };
    const obj2: any = { b: 3, c: 4 };
    expect(deepMerge(obj1, obj2)).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('Nên merge sâu với object lồng nhau', () => {
    const obj1: any = { a: { x: 1 }, b: 2 };
    const obj2: any = { a: { y: 2 }, b: 3 };
    expect(deepMerge(obj1, obj2)).toEqual({ a: { x: 1, y: 2 }, b: 3 });
  });

  it('Nên ghi đè array thay vì merge', () => {
    const obj1: any = { a: [1, 2], b: 2 };
    const obj2: any = { a: [3, 4] };
    expect(deepMerge(obj1, obj2)).toEqual({ a: [3, 4], b: 2 });
  });

  it('Nên ghi đè primitive khi trùng key', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { a: 2 };
    expect(deepMerge(obj1, obj2)).toEqual({ a: 2 });
  });

  it('Nên merge nhiều object liên tiếp', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { b: 2 };
    const obj3: any = { c: 3 };
    expect(deepMerge(obj1, obj2, obj3)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('Nên trả về object rỗng nếu không có object nào', () => {
    expect(deepMerge()).toEqual({});
  });

  it('Nên trả về chính nó nếu chỉ có một object', () => {
    const obj: any = { a: 1 };
    expect(deepMerge(obj)).toBe(obj);
  });

  it('Nên merge với giá trị null và undefined', () => {
    const obj1: any = { a: 1, b: null };
    const obj2: any = { b: 2, c: undefined };
    expect(deepMerge(obj1, obj2)).toEqual({ a: 1, b: 2, c: undefined });
  });

  it('Nên merge với object lồng array', () => {
    const obj1: any = { a: [{ x: 1 }] };
    const obj2: any = { a: [{ y: 2 }] };
    expect(deepMerge(obj1, obj2)).toEqual({ a: [{ y: 2 }] });
  });

  // --- Test cho null/undefined object ---
  it('Nên bỏ qua object null hoặc undefined ở đầu', () => {
    const obj: any = { a: 1 };
    expect(deepMerge(null, obj)).toEqual({ a: 1 });
    expect(deepMerge(undefined, obj)).toEqual({ a: 1 });
  });

  it('Nên bỏ qua object null hoặc undefined ở giữa', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { b: 2 };
    expect(deepMerge(obj1, null, obj2)).toEqual({ a: 1, b: 2 });
    expect(deepMerge(obj1, undefined, obj2)).toEqual({ a: 1, b: 2 });
  });

  it('Nên bỏ qua object null hoặc undefined ở cuối', () => {
    const obj1: any = { a: 1 };
    expect(deepMerge(obj1, null)).toEqual({ a: 1 });
    expect(deepMerge(obj1, undefined)).toEqual({ a: 1 });
  });

  it('Nên trả về object rỗng nếu tất cả đều null hoặc undefined', () => {
    expect(deepMerge(null, undefined)).toEqual({});
    expect(deepMerge(undefined, null, undefined)).toEqual({});
  });

  it('Nên merge đúng khi kết hợp object, null và undefined', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { b: 2 };
    expect(deepMerge(null, obj1, undefined, obj2)).toEqual({ a: 1, b: 2 });
  });
});
