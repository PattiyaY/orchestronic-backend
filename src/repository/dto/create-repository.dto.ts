import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRepositoryDto {
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
}
