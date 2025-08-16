import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGitlabDto {
  @ApiProperty({
    example: 'nestjs-repo',
    description: 'The name of the GitLab project',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'private',
    description: 'Visibility level of the project',
    enum: ['private', 'internal', 'public'],
  })
  @IsString()
  @IsIn(['private', 'internal', 'public'])
  visibility: 'private' | 'internal' | 'public';
}
