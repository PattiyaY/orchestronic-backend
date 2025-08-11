import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DBPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 50,
    description: 'The maximum storage (in GB) allocated for the database',
  })
  maxStorage: number;
}
