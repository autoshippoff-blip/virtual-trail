export interface ShopifyAccessTokenResponse {
  access_token: string;
  scope: string;
}

export interface ShopifyProductImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  width: number;
  height: number;
  alt: string | null;
}

export interface ShopifyProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string | null;
  position: number;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  images: ShopifyProductImage[];
  variants: ShopifyProductVariant[];
  image: ShopifyProductImage | null;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export interface ShopifyOAuthState {
  nonce: string;
  timestamp: number;
  signature?: string;
}
