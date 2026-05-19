import * as Sentry from '@sentry/nestjs';
import { config } from '@trail/config';

if (config.sentry.dsnApi) {
  Sentry.init({
    dsn: config.sentry.dsnApi,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'production',
  });
}
