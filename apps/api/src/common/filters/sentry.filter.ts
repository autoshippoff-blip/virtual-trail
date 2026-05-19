import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    Sentry.withScope((scope) => {
      // Safely attach request id
      const requestId = request.id || request.headers['x-request-id'];
      if (requestId) {
        scope.setTag('requestId', requestId as string);
      }

      // Safely attach tenant id (without logging full body payload which contains images)
      const tenantId = request.tenant?.id || request.body?.tenantId || request.query?.tenantId;
      if (tenantId) {
        scope.setTag('tenantId', tenantId as string);
      }

      // Ensure we explicitly do NOT attach the raw request body to the scope
      // because it may contain base64 image strings which bloat Sentry and leak PII.
      
      Sentry.captureException(exception);
    });

    super.catch(exception, host);
  }
}
