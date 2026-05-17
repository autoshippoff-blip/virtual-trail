import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';
import * as Sentry from '@sentry/node';
import { config } from '@trail/config';
import { QUEUE_NAMES } from '@trail/queue';
import { processTryOn } from './processors/tryon.processor.js';
import { processCleanup } from './processors/cleanup.processor.js';

const logger = pino({
  transport: { target: 'pino-pretty' },
});

async function bootstrap() {
  logger.info('Worker starting...');

  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV || 'production',
    });
  }

  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
  });

  // Exported for Bull Board or other monitoring if needed
  const tryonWorker = new Worker(
    QUEUE_NAMES.TRYON,
    processTryOn,
    {
      connection,
    }
  );

  const cleanupWorker = new Worker(
    QUEUE_NAMES.CLEANUP,
    processCleanup,
    {
      connection,
    }
  );

  // Setup daily cleanup job if not already present
  const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, { connection });
  await cleanupQueue.add(
    'daily-cleanup',
    {},
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 02:00
      },
    }
  );

  tryonWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: QUEUE_NAMES.TRYON }, 'Job completed');
  });

  tryonWorker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, queue: QUEUE_NAMES.TRYON, err: err.message }, 'Job failed');
    
    const isPermanent = job && job.attemptsMade >= (job.opts.attempts || 1);

    if (isPermanent) {
      logger.error({ jobId: job.id, attemptsMade: job.attemptsMade }, 'Job PERMANENTLY failed. Moving to DLQ.');
      try {
        const dlqQueue = new Queue('tryon-dlq', { connection });
        await dlqQueue.add('failed-job', {
          originalJobId: job.id,
          data: job.data,
          failedAt: new Date().toISOString(),
          reason: err.message,
          stack: err.stack,
        });
        logger.info({ jobId: job.id }, 'Successfully routed job to tryon-dlq');
      } catch (dlqErr: any) {
        logger.error({ dlqErr: dlqErr.message }, 'Failed to route job to DLQ');
      }
    }

    if (config.sentry.dsn) {
      Sentry.captureException(err, {
        tags: { 
          queue: QUEUE_NAMES.TRYON, 
          jobId: job?.id,
          permanent: isPermanent ? 'true' : 'false',
        },
        extra: { jobData: job?.data }
      });
    }
  });

  cleanupWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: QUEUE_NAMES.CLEANUP }, 'Cleanup job completed');
  });

  cleanupWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: QUEUE_NAMES.CLEANUP, err: err.message }, 'Cleanup job failed');
    if (config.sentry.dsn) {
      Sentry.captureException(err, {
        tags: { queue: QUEUE_NAMES.CLEANUP, jobId: job?.id }
      });
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    if (config.sentry.dsn) {
      await Sentry.close(2000);
    }
    await tryonWorker.close();
    await cleanupWorker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Worker instances ready');
}

bootstrap().catch((err) => {
  logger.error(err, 'Worker bootstrap failed');
  process.exit(1);
});
