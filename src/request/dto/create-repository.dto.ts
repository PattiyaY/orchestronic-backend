import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateRepositoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'repository-name',
    description: 'The name of the repository associated with the request',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'repository-description',
    description: 'A description of the repository associated with the request',
    required: false,
  })
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['user-id-1', 'user-id-2'],
    description: 'List of user IDs to be added as collaborators',
    required: false,
  })
  collaborators?: string[];
}
