import * as fs from 'fs';
import * as path from 'path';
import { upload } from '@trail/storage';
import { prisma } from '@trail/db';
import { config } from '@trail/config';

async function seed() {
  const tenantId = 'demo-tenant';
  const productId = 'premium-jacket';
  const garmentPath = path.resolve('test-assets/inputs/garment.png');
  const buffer = fs.readFileSync(garmentPath);
  
  const key = `${tenantId}/garments/${productId}.png`;
  console.log('Uploading garment image to R2...');
  await upload(key, buffer, 'image/png');
  const publicUrl = `${config.r2.publicUrl}/${key}`;
  console.log('Uploaded to:', publicUrl);

  console.log('Seeding tenant and product in DB...');
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Demo Tenant',
      shopifyDomain: 'demo-tenant.myshopify.com',
      apiKey: 'demo-api-key',
    },
  });

  await prisma.product.upsert({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId: productId,
      },
    },
    update: { imageUrl: publicUrl },
    create: {
      tenantId,
      shopifyProductId: productId,
      imageUrl: publicUrl,
    },
  });

  console.log('Done!');
}

seed().catch(console.error);
