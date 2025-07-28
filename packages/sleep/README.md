# @ecoma-io/sleep

Một tiện ích sleep đơn giản và nhẹ cho các ứng dụng JavaScript/TypeScript. Package này cung cấp các hàm sleep dựa trên promise có thể sử dụng với cú pháp async/await.

## Tính năng

- **Dựa trên Promise**: Tất cả các hàm đều trả về promise để dễ dàng sử dụng với async/await
- **Nhiều đơn vị thời gian**: Hỗ trợ millisecond, giây và phút
- **Hỗ trợ TypeScript**: Bao gồm đầy đủ định nghĩa TypeScript
- **Nhẹ**: Ít phụ thuộc
- **Không phụ thuộc**: Chỉ phụ thuộc vào tslib cho các helper TypeScript

## Cài đặt

```bash
npm install @ecoma-io/sleep
```

## Sử dụng

### Sleep Cơ bản

```typescript
import { sleep } from '@ecoma-io/sleep';

// Sleep trong 1000 millisecond (1 giây)
await sleep(1000);
console.log('Điều này sẽ được ghi log sau 1 giây');
```

### Sử dụng với async/await

```typescript
import { sleep } from '@ecoma-io/sleep';

async function example() {
  console.log('Đang bắt đầu...');
  await sleep(2000); // Đợi 2 giây
  console.log('Đã qua 2 giây!');
}

example();
```

### Các Đơn vị Thời gian Khác nhau

```typescript
import { sleep, sleepSeconds, sleepMinutes } from '@ecoma-io/sleep';

// Sleep trong 500 millisecond
await sleep(500);

// Sleep trong 2 giây
await sleepSeconds(2);

// Sleep trong 1 phút
await sleepMinutes(1);

// Sleep trong 30 giây sử dụng phút
await sleepMinutes(0.5);
```

### Tên Hàm Thay thế

```typescript
import { delay } from '@ecoma-io/sleep';

// delay là bí danh của sleep
await delay(1000); // Giống như sleep(1000)
```

### Ví dụ Thực tế

```typescript
import { sleep } from '@ecoma-io/sleep';

async function retryWithDelay(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Đợi trước khi thử lại (exponential backoff)
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

// Sử dụng
await retryWithDelay(async () => {
  // Thao tác async của bạn ở đây
  return await fetch('/api/data');
});
```

## Tham khảo API

### `sleep(ms: number): Promise<void>`

Sleep trong số millisecond được chỉ định.

- **Tham số:**
  - `ms` (number): Số millisecond để sleep
- **Trả về:** Promise được resolve sau thời gian được chỉ định

### `delay(milliseconds: number): Promise<void>`

Bí danh của hàm `sleep()` để dễ đọc hơn.

- **Tham số:**
  - `milliseconds` (number): Số millisecond để sleep
- **Trả về:** Promise được resolve sau thời gian được chỉ định

### `sleepSeconds(seconds: number): Promise<void>`

Sleep trong số giây được chỉ định.

- **Tham số:**
  - `seconds` (number): Số giây để sleep
- **Trả về:** Promise được resolve sau thời gian được chỉ định

### `sleepMinutes(minutes: number): Promise<void>`

Sleep trong số phút được chỉ định.

- **Tham số:**
  - `minutes` (number): Số phút để sleep
- **Trả về:** Promise được resolve sau thời gian được chỉ định

## Ví dụ

### Giới hạn Tốc độ

```typescript
import { sleep } from '@ecoma-io/sleep';

async function processWithRateLimit(items: any[], rateLimitMs = 1000) {
  for (const item of items) {
    await processItem(item);
    await sleep(rateLimitMs); // Đợi giữa các request
  }
}
```

### Thời gian Hoạt ảnh

```typescript
import { sleep } from '@ecoma-io/sleep';

async function animateElement(element: HTMLElement) {
  element.style.opacity = '0';
  await sleep(100);
  element.style.opacity = '0.5';
  await sleep(100);
  element.style.opacity = '1';
}
```

### Kiểm thử

```typescript
import { sleep } from '@ecoma-io/sleep';

describe('Các thao tác async', () => {
  it('nên xử lý các thao tác bị trì hoãn', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    
    expect(end - start).toBeGreaterThanOrEqual(95);
  });
});
```

## Hỗ trợ Trình duyệt

Package này hoạt động trong tất cả các trình duyệt hiện đại và môi trường Node.js hỗ trợ:
- Promises
- async/await
- setTimeout

## Hỗ trợ Node.js

- Node.js 12+
- Tất cả các phiên bản LTS

## TypeScript

Package này bao gồm đầy đủ định nghĩa TypeScript. Không cần package `@types` bổ sung.

```typescript
import { sleep, sleepSeconds, sleepMinutes } from '@ecoma-io/sleep';

// Tất cả các hàm đều được gõ đúng kiểu
const promise: Promise<void> = sleep(1000);
```

## Build

```bash
nx build sleep
```

## Kiểm thử

```bash
nx test sleep
```
