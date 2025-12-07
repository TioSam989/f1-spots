import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { PrivacyLevel } from '@prisma/client';

export class CreateSpotDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(PrivacyLevel)
  privacyLevel: PrivacyLevel;
}
