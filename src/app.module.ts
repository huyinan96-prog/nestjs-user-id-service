import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserIdModule } from './user-id/user-id.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UserIdModule],
})
export class AppModule {}
