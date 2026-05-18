import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class RequestSanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Skip internal/custom nest parameter injections
    if (metadata.type === 'custom') {
      return value;
    }

    if (value && typeof value === 'object') {
      return this.sanitizeObject(value);
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    return value;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return this.sanitizeObject(item);
        }
        if (typeof item === 'string') {
          return this.sanitizeString(item);
        }
        return item;
      });
    }

    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === 'object') {
        sanitized[key] = this.sanitizeObject(val);
      } else if (typeof val === 'string') {
        // Base64 images are checked separately, we skip deep sanitization of very long base64 strings to save CPU
        if (key === 'userImage' && val.length > 50000) {
          sanitized[key] = val.trim();
        } else {
          sanitized[key] = this.sanitizeString(val);
        }
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    let sanitized = str.trim();

    // 1. Remove dangerous script blocks completely
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 2. Strip HTML elements to eliminate markdown and HTML script injections
    sanitized = sanitized.replace(/<[^>]*>?/gm, '');

    // 3. Remove inline javascript event triggers (e.g. onload, onerror, onclick)
    sanitized = sanitized.replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

    // 4. Clean out javascript protocol references
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }
}
