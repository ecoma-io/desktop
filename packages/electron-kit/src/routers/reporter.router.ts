import { container } from 'tsyringe';
import { router, publicProcedure } from '../trpc';
import z from 'zod';
import { createLogScope } from '../utils/create-log';
import { ReporterService } from '../services/reporter-service';

// Khởi tạo logger cho router này
const logger = createLogScope('reporter.route');

// Schema validate input cho feedback
const feedbackInputSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.enum([
    'uncaught',
    'unhandled-rejection',
    'feedback:bug',
    'feedback:feature',
    'feedback:other',
  ]),
});

/**
 * Router cho gửi feedback (báo cáo lỗi, góp ý, ...)
 */
export const reporterRoute = router({
  /**
   * Gửi feedback lên server (tạo issue GitHub)
   * @param { title, body, type }
   * @returns {boolean} Thành công/thất bại
   */
  sendReport: publicProcedure.input(feedbackInputSchema).mutation(async ({ input }) => {
    const reporterService = container.resolve(ReporterService);
    try {
      logger.info('Sending feedback', input);
      const ok = await reporterService.send(input);
      return ok;
    } catch (err) {
      logger.error('Error while sending feedback', err);
      return false;
    }
  }),
});
