import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateSensorDto {
  @IsOptional()
  @IsString()
  sensor_id?: string;

  @IsString()
  farm_id: string;

  @IsString()
  type: string;

  @IsString()
  unit: string;

  @IsString() // Changed from @IsUUID() since device_id is varchar(100), not UUID
  device_id: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  crop_id?: string;

  @IsOptional()
  @IsNumber()
  min_critical?: number;

  @IsOptional()
  @IsNumber()
  min_warning?: number;

  @IsOptional()
  @IsNumber()
  max_warning?: number;

  @IsOptional()
  @IsNumber()
  max_critical?: number;

  @IsOptional()
  @IsString()
  action_low?: string;

  @IsOptional()
  @IsString()
  action_high?: string;
}