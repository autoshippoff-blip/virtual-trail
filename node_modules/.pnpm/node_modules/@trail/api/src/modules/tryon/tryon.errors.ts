export class ImageValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ImageValidationError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}
