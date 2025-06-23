import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class FindUserByEmailDto {
  @ApiProperty({
    required: true,
    description: 'User email address to search for users',
    example: 'u6512345@au.edu',
  })
  @IsNotEmpty()
  email: string;
}
