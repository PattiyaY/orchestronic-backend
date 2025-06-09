import { IsString, IsEnum, IsObject } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  team: string;

  @IsString()
  repository: string;

  @IsString()
  resourceGroup: string;

  @IsObject()
  resources: {
    VM: number;
    DB: number;
    ST: number;
  };

  @IsString()
  region: string;

  @IsString()
  cloudProvider: string;

  @IsEnum(['Pending', 'Approved', 'Rejected'])
  status: 'Pending' | 'Approved' | 'Rejected';

  @IsString()
  userId: string;

  @IsString()
  description: string;
}
