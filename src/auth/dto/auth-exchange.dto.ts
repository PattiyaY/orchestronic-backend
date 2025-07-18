import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthExchangeDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  azureToken: string;
}
