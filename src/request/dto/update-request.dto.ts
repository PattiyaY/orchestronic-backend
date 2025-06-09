import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  repository?: string;

  @IsOptional()
  @IsString()
  resourceGroup?: string;

  @IsOptional()
  @IsObject()
  resources?: {
    VM: number;
    DB: number;
    ST: number;
  };

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  cloudProvider?: string;

  @IsOptional()
  @IsEnum(['Pending', 'Approved', 'Rejected'])
  status?: 'Pending' | 'Approved' | 'Rejected';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
