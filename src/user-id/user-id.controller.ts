import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserIdDto } from './dto/create-user-id.dto';
import { UserIdService } from './user-id.service';

@Controller('user-id')
export class UserIdController {
  constructor(private readonly service: UserIdService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getUserId(@Body() dto: CreateUserIdDto): Promise<{ userID: string }> {
    return this.service.findOrCreate(dto.id1, dto.id2);
  }
}
