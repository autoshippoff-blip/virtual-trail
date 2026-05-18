import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import basicAuth from 'express-basic-auth';
import { config as appConfig } from '@trail/config';
import { QUEUE_NAMES } from '@trail/queue';
import { AppModule } from './app.module';
import { RequestSanitizationPipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  app.useLogger(app.get(Logger));
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  
  // Hardened Dynamic CORS Policy for production safety
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      const allowedOrigins = [
        'localhost',
        '127.0.0.1',
        'onrender.com',
        'virtual-trail',
        'shopify.com',
      ];
      
      const isAllowed = allowedOrigins.some((domain) => origin.includes(domain)) || origin.endsWith('.myshopify.com');
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS production guidelines'));
      }
    },
    credentials: true,
  });
  
  app.useGlobalPipes(
    new RequestSanitizationPipe(),
    new ValidationPipe({ whitelist: true, transform: true })
  );

  // Mount Secure Bull Board Dashboard
  const server = app.getHttpAdapter().getInstance();
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const connection = new Redis(appConfig.redis.url, { maxRetriesPerRequest: null });
  const tryonQueue = new Queue(QUEUE_NAMES.TRYON, { connection });
  const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, { connection });
  const dlqQueue = new Queue('tryon-dlq', { connection });

  createBullBoard({
    queues: [
      new BullMQAdapter(tryonQueue) as any,
      new BullMQAdapter(cleanupQueue) as any,
      new BullMQAdapter(dlqQueue) as any,
    ],
    serverAdapter: serverAdapter,
  });

  // Secure both Bull Board and Visual Dashboard with browser Basic Auth
  const authMiddleware = basicAuth({
    users: { admin: appConfig.admin.apiKey },
    challenge: true,
  });

  server.use('/admin/queues', authMiddleware, serverAdapter.getRouter());
  server.use('/admin/dashboard', authMiddleware);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
