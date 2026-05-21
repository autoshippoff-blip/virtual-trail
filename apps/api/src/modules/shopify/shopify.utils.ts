import * as crypto from 'crypto';

/**
 * Validates whether the shop parameter matches Shopify's domain format.
 */
export function isValidShopDomain(shop: string): boolean {
  if (!shop) return false;
  // Regex to match a subdomain of .myshopify.com
  // Starts with an alphanumeric character, allowed characters are alphanumeric and dashes, and ends with .myshopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/i;
  return shopRegex.test(shop);
}

/**
 * Generates a cryptographically secure random string for the OAuth state.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Verifies the OAuth callback query signature (HMAC-SHA256 in hex format).
 * The query object keys are sorted alphabetically, excluding 'hmac', and joined with '&'.
 */
export function verifyOAuthHmac(
  query: Record<string, any>,
  secret: string
): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  // Sort query parameters alphabetically
  const sortedKeys = Object.keys(rest).sort();
  const queryString = sortedKeys
    .map((key) => {
      // Shopify requires values to be mapped to query format
      const val = rest[key];
      // Array values are formatted as e.g. ["val1", "val2"] -> key=["val1", "val2"]
      const formattedVal = Array.isArray(val)
        ? `["${val.join('", "')}"]`
        : String(val);
      return `${key}=${formattedVal}`;
    })
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  } catch (err) {
    return false;
  }
}

/**
 * Verifies a Shopify webhook payload signature (HMAC-SHA256 in base64 format).
 */
export function verifyWebhookHmac(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !rawBody) return false;

  const content = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const computedHmac = crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHmac, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    return false;
  }
}
