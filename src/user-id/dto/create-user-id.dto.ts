import { IsDefined, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUserIdDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^\S+$/, { message: 'id1 must not contain whitespace' })
  id1!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^\S+$/, { message: 'id2 must not contain whitespace' })
  id2!: string;
}
