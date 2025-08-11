import { ApiProperty } from '@nestjs/swagger';
import { CloudProvider } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class STPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 500,
    description: 'The maximum storage (in GB) allocated for the database',
  })
  maxStorage: number;

  @IsNotEmpty()
  @IsEnum(CloudProvider)
  @ApiProperty({
    example: CloudProvider.AZURE,
    description: 'The cloud provider for the virtual machine',
  })
  cloudProvider: CloudProvider;
}
