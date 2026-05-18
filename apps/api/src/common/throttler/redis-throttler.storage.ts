import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { config } from '@trail/config';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  async increment(key: string, ttl: number): Promise<{ totalHits: number; timeToExpire: number }> {
    const multi = this.redis.multi();
    
    // Atomically increment the hit counter in Upstash Redis
    multi.incr(key);
    
    // Retrieve the remaining TTL (in seconds)
    multi.ttl(key);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis multi execution failed');
    }

    const count = results[0][1] as number;
    let currentTtl = results[1][1] as number;

    // If the key was just initialized (TTL <= 0), set expire time (converting ms to seconds)
    if (currentTtl < 0) {
      const ttlInSeconds = Math.ceil(ttl / 1000);
      await this.redis.expire(key, ttlInSeconds);
      currentTtl = ttlInSeconds;
    }

    return {
      totalHits: count,
      timeToExpire: currentTtl,
    };
  }
}
