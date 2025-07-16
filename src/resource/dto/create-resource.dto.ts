import { ApiProperty } from '@nestjs/swagger';
import { CreateResourceConfigDto } from '../../request/dto/create-resource-config.dto';

export class CreateResourceDto {
  @ApiProperty({
    example: 'rg-repository-name',
    description: 'The name of the resource group',
  })
  name: string;

  @ApiProperty({
    example: 'azure',
    description: 'The cloud provider for the resources',
    required: false,
  })
  cloudProvider: string;

  @ApiProperty({
    example: 'us-west-2',
    description: 'The region where the resources are located',
    required: false,
  })
  region: string;

  @ApiProperty({
    type: CreateResourceConfigDto,
    description: 'Configuration details for the resources',
  })
  resourceConfig: CreateResourceConfigDto;
}
