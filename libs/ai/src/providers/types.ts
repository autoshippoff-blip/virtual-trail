export interface TryOnInput {
  modelImage: string;
  garmentImage: string;
  tenantId: string;
  productId: string;
  requestId?: string;
  category?: string;
  model?: string;
}

export interface TryOnResult {
  success: boolean;
  outputImageUrl?: string;
  processingMs?: number;
  provider: string;
  raw?: unknown;
  imageBuffer?: Buffer;
}

export interface VirtualTryOnProvider {
  generate(input: TryOnInput): Promise<TryOnResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly processingMs?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message: string, provider: string, tenantId: string, productId: string, processingMs?: number) {
    super(message, provider, tenantId, productId, processingMs);
    this.name = 'ProviderTimeoutError';
  }
}

export class InvalidProviderResponseError extends ProviderError {
  constructor(message: string, provider: string, tenantId: string, productId: string, processingMs?: number) {
    super(message, provider, tenantId, productId, processingMs);
    this.name = 'InvalidProviderResponseError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(message: string, provider: string, tenantId: string, productId: string, processingMs?: number) {
    super(message, provider, tenantId, productId, processingMs);
    this.name = 'ProviderRateLimitError';
  }
}
