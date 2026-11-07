import { randomUUID } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { CacheService } from '../cache/cache.service';
import { DatabaseService } from '../database/database.service';

type UserIdRow = RowDataPacket & { user_id: string };

@Injectable()
export class UserIdService {
  private readonly logger = new Logger(UserIdService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  async findOrCreate(id1: string, id2: string): Promise<{ userID: string }> {
    const cacheKey = CacheService.keyFor(id1, id2);
    const cachedUserId = await this.cache.get(cacheKey);
    if (cachedUserId !== null) {
      return { userID: cachedUserId };
    }

    try {
      // The UNIQUE(id1,id2) constraint makes this atomic even for concurrent requests.
      // An existing user_id is NEVER overwritten by a new generated UUID.
      await this.database.pool.execute(
        `INSERT INTO user_mappings (id1, id2, user_id)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [id1, id2, randomUUID()],
      );

      const [rows] = await this.database.pool.execute<UserIdRow[]>(
        `SELECT user_id FROM user_mappings WHERE id1 = ? AND id2 = ? LIMIT 1`,
        [id1, id2],
      );
      if (rows.length === 0) {
        throw new Error('User ID mapping missing after database write');
      }

      const userID = rows[0].user_id;
      await this.cache.set(cacheKey, userID);
      return { userID };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database operation failed: ${message}`);
      throw new ServiceUnavailableException('Database temporarily unavailable');
    }
  }
}
