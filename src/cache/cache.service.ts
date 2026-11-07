import { createHash } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    if (config.get<string>('REDIS_ENABLED') === 'false') {
      this.client = null;
      return;
    }

    this.client = new Redis({
      host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
      port: Number(config.get<string>('REDIS_PORT') ?? '6379'),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      connectTimeout: 1000,
    });
    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis error (continuing with MySQL): ${error.message}`);
    });
  }

  static keyFor(id1: string, id2: string): string {
    const digest = createHash('sha256')
      .update(JSON.stringify([id1, id2]))
      .digest('hex');
    return `user-id:${digest}`;
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.connect();
    } catch {
      this.logger.warn('Redis unavailable; serving requests using MySQL only.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || this.client.status !== 'ready') return null;
    try {
      return await this.client.get(key);
    } catch {
      this.logger.warn('Redis lookup failed; using MySQL.');
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client || this.client.status !== 'ready') return;
    try {
      await this.client.set(key, value, 'EX', 3600);
    } catch {
      this.logger.warn('Redis write failed; MySQL remains the source of truth.');
    }
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
