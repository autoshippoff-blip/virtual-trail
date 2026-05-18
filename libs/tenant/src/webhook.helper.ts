import * as crypto from 'crypto';

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 */
export function generateHmacSignature(payload: string | Buffer, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Timing-safe HMAC-SHA256 signature verification helper.
 * Eliminates side-channel timing attacks by checking strings in constant time.
 */
export function verifyHmacSignature(payload: string | Buffer, signature: string, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = generateHmacSignature(payload, secret);

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Timing-safe Shopify webhook signature verification helper.
 * Shopify signatures come encoded in base64.
 */
export function verifyShopifyWebhook(rawBody: string | Buffer, headerSignature: string, secret: string): boolean {
  if (!headerSignature || !secret) {
    return false;
  }

  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const signatureBuffer = Buffer.from(headerSignature, 'base64');
  const expectedBuffer = Buffer.from(expectedHmac, 'base64');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
