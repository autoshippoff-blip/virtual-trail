import { ImageValidationError } from './tryon.errors';

export function validateUserImage(base64: string): Buffer {
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new ImageValidationError('Image must be under 5MB');
  }

  const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isWebp = buffer.slice(8, 12).toString() === 'WEBP';

  if (!isJpg && !isPng && !isWebp) {
    throw new ImageValidationError('Image must be JPG, PNG, or WebP');
  }

  return buffer;
}
