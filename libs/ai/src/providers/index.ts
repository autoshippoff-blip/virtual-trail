import { config } from '@trail/config';
import { FitRoomProvider } from './fitroom.provider.js';
import { SegmindProvider } from './segmind.provider.js';
import { VirtualTryOnProvider } from './types.js';

export * from './types.js';
export * from './fitroom.provider.js';
export * from './segmind.provider.js';

export function getProvider(providerName?: string): VirtualTryOnProvider {
  const activeProvider = providerName || config.aiProvider || 'fitroom';

  switch (activeProvider.toLowerCase()) {
    case 'fitroom':
      return new FitRoomProvider();
    case 'segmind':
      return new SegmindProvider();
    default:
      throw new Error(`Unknown AI Provider: ${activeProvider}`);
  }
}
