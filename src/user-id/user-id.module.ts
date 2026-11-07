import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { UserIdController } from './user-id.controller';
import { UserIdService } from './user-id.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [UserIdService],
  controllers: [UserIdController],
})
export class UserIdModule {}
