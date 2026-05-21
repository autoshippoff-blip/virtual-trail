import { Module } from '@nestjs/common';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { ShopifyWebhooks } from './shopify.webhooks';

@Module({
  controllers: [ShopifyController],
  providers: [ShopifyService, ShopifyWebhooks],
  exports: [ShopifyService, ShopifyWebhooks],
})
export class ShopifyModule {}
