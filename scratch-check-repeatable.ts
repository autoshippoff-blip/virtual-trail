import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from './libs/config/src/index';
import { QUEUE_NAMES } from '@trail/queue';

async function main() {
  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
  });
  const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, { connection });
  
  const repeatableJobs = await cleanupQueue.getRepeatableJobs();
  console.log('Repeatable Jobs:', JSON.stringify(repeatableJobs, null, 2));
  
  await connection.quit();
}

main();
