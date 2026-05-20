import * as fs from 'fs';
import * as path from 'path';
import { upload } from '@trail/storage';
import { prisma } from '@trail/db';
import { config } from '@trail/config';

async function seedDenim() {
  const tenantId = 'demo-tenant';
  const productId = 'denim-jacket';
  const garmentPath = path.resolve('test-assets/inputs/garment2.png');
  const buffer = fs.readFileSync(garmentPath);
  const key = `${tenantId}/garments/${productId}.png`;
  console.log('Uploading denim garment to R2...');
  await upload(key, buffer, 'image/png');
  const publicUrl = `${config.r2.publicUrl}/${key}`;
  console.log('Denim garment uploaded to:', publicUrl);

  console.log('Seeding denim product in DB...');
  await prisma.product.upsert({
    where: {
      tenantId_shopifyProductId: { tenantId, shopifyProductId: productId },
    },
    update: { imageUrl: publicUrl },
    create: {
      tenantId,
      shopifyProductId: productId,
      imageUrl: publicUrl,
    },
  });
  console.log('Denim product seeded.');
}

seedDenim().catch(console.error);
