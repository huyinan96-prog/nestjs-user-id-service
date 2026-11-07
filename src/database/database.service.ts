import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = createPool({
      host: config.get<string>('MYSQL_HOST') ?? '127.0.0.1',
      port: Number(config.get<string>('MYSQL_PORT') ?? '3306'),
      user: config.get<string>('MYSQL_USER') ?? 'appuser',
      password: config.get<string>('MYSQL_PASSWORD') ?? '',
      database: config.get<string>('MYSQL_DATABASE') ?? 'id_service',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async onModuleInit(): Promise<void> {
    // Fail startup if the permanent store cannot be reached.
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
