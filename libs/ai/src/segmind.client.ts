import { SegmindProvider } from './providers/segmind.provider.js';

export class SegmindError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SegmindError';
  }
}

export async function generateTryOn(payload: {
  userImageUrl: string;
  garmentImageUrl: string;
  model: string;
}): Promise<{ imageBuffer: Buffer }> {
  try {
    const provider = new SegmindProvider();
    const result = await provider.generate({
      modelImage: payload.userImageUrl,
      garmentImage: payload.garmentImageUrl,
      tenantId: 'legacy',
      productId: 'legacy',
      model: payload.model,
    });
    if (!result.imageBuffer) {
      throw new SegmindError('Segmind generation failed - no image buffer returned');
    }
    return { imageBuffer: result.imageBuffer };
  } catch (error: any) {
    throw new SegmindError(error.message || 'Segmind generation failed');
  }
}
