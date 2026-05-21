import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { prisma } from '@trail/db';
import { config as appConfig } from '@trail/config';
import { ShopifyService } from './shopify.service';

@Injectable()
export class ShopifyWebhooks {
  private readonly logger = new Logger(ShopifyWebhooks.name);
  private readonly redis: Redis;

  constructor(
    @Inject(forwardRef(() => ShopifyService))
    private readonly shopifyService: ShopifyService
  ) {
    this.redis = new Redis(appConfig.redis.url, { maxRetriesPerRequest: null });
  }

  /**
   * Routes the webhook to the correct handler based on the topic.
   */
  async handleWebhook(topic: string, shop: string, payload: any): Promise<void> {
    try {
      switch (topic.toLowerCase()) {
        case 'app/uninstalled':
          await this.handleAppUninstalled(shop);
          break;

        case 'products/create':
        case 'products/update':
          await this.handleProductUpsert(shop, payload);
          break;

        case 'products/delete':
          await this.handleProductDelete(shop, payload);
          break;

        default:
          this.logger.warn(`Unhandled Shopify webhook topic: ${topic}`);
      }
    } catch (err: any) {
      this.logger.error(`Error processing webhook ${topic} for ${shop}: ${err.message}`);
    }
  }

  /**
   * Handles app/uninstalled webhook.
   * Disables features for the tenant, deletes stored tokens, and performs cleanups.
   */
  private async handleAppUninstalled(shop: string): Promise<void> {
    this.logger.log(`Uninstalling app for shop: ${shop}`);

    // Resolve tenant
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shop },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for shop: ${shop} during uninstall`);
      return;
    }

    // 1. Deactivate tenant by clearing active features
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        features: [],
      },
    });

    // 2. Remove access token cache from Redis
    const redisKey = `shopify:${shop}:token`;
    await this.redis.del(redisKey);

    // 3. Remove ScriptTags from Shopify storefront if token was active (best-effort)
    const token = await this.shopifyService.getAccessToken(shop);
    if (token) {
      await this.shopifyService.removeScriptTag(shop, token).catch((err) => {
        this.logger.error(`Best effort ScriptTag removal failed on uninstall: ${err.message}`);
      });
    }

    this.logger.log(`App successfully uninstalled and tenant ${tenant.id} deactivated.`);
  }

  /**
   * Handles products/create and products/update webhooks.
   * Syncs product details and runs smart garment image heuristics.
   */
  private async handleProductUpsert(shop: string, payload: any): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shop },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for shop: ${shop} during product upsert`);
      return;
    }

    this.logger.log(`Syncing product ${payload.id} via webhook for tenant: ${tenant.id}`);
    await this.shopifyService.syncSingleProduct(tenant.id, payload);
  }

  /**
   * Handles products/delete webhook.
   * Removes the product from the local database (idempotent).
   */
  private async handleProductDelete(shop: string, payload: any): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shop },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for shop: ${shop} during product deletion`);
      return;
    }

    const shopifyProductId = String(payload.id);
    this.logger.log(`Deleting product ${shopifyProductId} for tenant: ${tenant.id}`);

    try {
      // Delete product (Prisma automatically handles referential constraints if configured,
      // or we handle silently with catch)
      await prisma.product.delete({
        where: {
          tenantId_shopifyProductId: {
            tenantId: tenant.id,
            shopifyProductId,
          },
        },
      });
      this.logger.log(`Product ${shopifyProductId} successfully deleted.`);
    } catch (err: any) {
      // If product doesn't exist, we ignore to maintain idempotency
      this.logger.debug(`Product delete webhook ignored (already deleted or non-existent): ${err.message}`);
    }
  }
}
