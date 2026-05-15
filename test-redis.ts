import Redis from 'ioredis';
import { config } from './libs/config/src/index';

async function main() {
  console.log('Connecting to:', config.redis.url);
  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
  });

  redis.on('error', (err) => console.error('Redis Error:', err));
  redis.on('connect', () => console.log('Redis Connected!'));

  try {
    await redis.set('test-key', 'hello');
    const val = await redis.get('test-key');
    console.log('Redis Value:', val);
  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    await redis.quit();
  }
}

main();
