import { prisma } from './libs/db/src/index';
import { upload } from './libs/storage/src/index';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '@trail/config';
import { QUEUE_NAMES } from '@trail/queue';
import fs from 'fs';
import path from 'path';

async function main() {
  const tenantId = '393c3474-7c52-4625-9d4b-6e187c11142a';
  const productId = '7e0fad65-e031-4f7d-90de-025fbed7c609';
  const sampleImagePath = 'C:/Users/vishnusundar/.gemini/antigravity/brain/d0a55ef3-fdb2-4f69-9b05-c92dfd70132e/sample_user_image_1778859198080.png';

  console.log('Starting manual job enqueue...');

  try {
    // 1. Create TryonRequest
    const request = await prisma.tryonRequest.create({
      data: {
        tenantId,
        productId,
        status: 'queued',
      },
    });
    console.log('Created TryonRequest:', request.id);

    // 2. Upload image to R2
    const imageBuffer = fs.readFileSync(sampleImagePath);
    const userImageKey = `${tenantId}/uploads/${request.id}`;
    await upload(userImageKey, imageBuffer, 'image/png');
    console.log('Uploaded image to R2:', userImageKey);

    await prisma.tryonRequest.update({
      where: { id: request.id },
      data: { userImageKey },
    });

    // 3. Enqueue job
    const connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
    });
    const tryonQueue = new Queue(QUEUE_NAMES.TRYON, { connection });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { config: true } });

    if (!product || !tenant || !tenant.config) {
      throw new Error('Tenant or product not found');
    }

    await tryonQueue.add('tryon-job', {
      requestId: request.id,
      tenantId,
      productId,
      productImageUrl: product.imageUrl,
      userImageKey,
      config: {
        segmindModel: tenant.config.segmindModel,
        complimentTone: tenant.config.complimentTone as any,
      },
    });

    console.log('Job enqueued successfully!');
    await connection.quit();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
