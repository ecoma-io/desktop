import { initTRPC } from '@trpc/server';

// Tạo một instance tRPC
const t = initTRPC.create({});

// Khai báo Router và Procedure
/**
 * Khởi tạo router cho tRPC
 */
export const router = t.router;
/**
 * Khởi tạo public procedure cho tRPC
 */
export const publicProcedure = t.procedure;
