import * as Sentry from '@sentry/nestjs';
import { config } from '@trail/config';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'production',
  });
}
