import { ImageValidationError } from './tryon.errors';

export function validateUserImage(base64Input: string): Buffer {
  if (!base64Input || typeof base64Input !== 'string') {
    throw new ImageValidationError('Image payload must be a string');
  }

  // 1. Detect and strip standard base64 data URI headers (e.g. data:image/png;base64,...)
  let base64Data = base64Input.trim();
  const match = base64Data.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
  
  if (match) {
    base64Data = base64Data.substring(match[0].length);
  }

  // 2. Decode the base64 string to a binary buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (err) {
    throw new ImageValidationError('Malformed base64 image data');
  }

  // 3. Enforce maximum file size boundary (5MB limit)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new ImageValidationError('Image size must be under 5MB');
  }

  // 4. Verify binary magic headers for JPEG, PNG, or WebP to reject hidden executable payloads
  const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isWebp = buffer.length > 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!isJpg && !isPng && !isWebp) {
    throw new ImageValidationError('Unsupported file format. Image must be a valid JPG, PNG, or WebP file.');
  }

  return buffer;
}
