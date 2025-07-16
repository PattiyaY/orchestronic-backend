import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateRepositoryDto } from './create-repository.dto';
import { CreateResourceDto } from '../../resource/dto/create-resource.dto';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'owner-id',
    description: 'The ID of the user making the request',
  })
  ownerId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Request description',
    description: 'A description of the request',
    required: false,
  })
  description: string;

  @ApiProperty({ type: CreateRepositoryDto })
  repository: CreateRepositoryDto;

  @ApiProperty({ type: CreateResourceDto })
  resources: CreateResourceDto;
}
