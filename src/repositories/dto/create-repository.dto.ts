import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateResourceDto } from '../../resource/dto/create-resource.dto';

export class CreateRepositoriesDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'repo-name',
    description: 'The name of the repository',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'This is a sample repository description',
    description: 'A brief description of the repository',
  })
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({
    type: [String],
    description:
      'List of collaborator Email to be associated with the repository',
    example: ['u6512345@au.edu, u6512190@au.edu'],
  })
  collaborators: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '123',
    description: 'The ID of the request associated with the repository',
  })
  requestId: string;

  @ApiProperty({
    type: CreateResourceDto,
    description: 'The resources associated with the repository',
  })
  resources: CreateResourceDto;
}
