import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsObject } from 'class-validator';

export class GenerateLinkDto {
  @ApiProperty({ description: 'ID интеграции', example: '507f1f77bcf86cd799439011' })
  @IsString()
  integrationId: string;

  @ApiProperty({ description: 'Базовый URL для ссылки', example: 'https://example.com/product' })
  @IsUrl()
  baseUrl: string;

  @ApiPropertyOptional({ description: 'Дополнительные параметры', type: Object })
  @IsObject()
  @IsOptional()
  params?: Record<string, string>;
}

export class GenerateButtonLinkDto {
  @ApiProperty({ description: 'ID интеграции', example: '507f1f77bcf86cd799439011' })
  @IsString()
  integrationId: string;

  @ApiProperty({ description: 'Базовый URL для ссылки', example: 'https://example.com/product' })
  @IsUrl()
  baseUrl: string;

  @ApiPropertyOptional({ description: 'Название кампании' })
  @IsString()
  @IsOptional()
  campaignName?: string;

  @ApiPropertyOptional({ description: 'Источник сайта' })
  @IsString()
  @IsOptional()
  siteSourceName?: string;

  @ApiPropertyOptional({ description: 'Размещение' })
  @IsString()
  @IsOptional()
  placement?: string;

  @ApiPropertyOptional({ description: 'ID кампании' })
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'ID группы объявлений' })
  @IsString()
  @IsOptional()
  adsetId?: string;

  @ApiPropertyOptional({ description: 'ID объявления' })
  @IsString()
  @IsOptional()
  adId?: string;

  @ApiPropertyOptional({ description: 'Название группы объявлений' })
  @IsString()
  @IsOptional()
  adsetName?: string;

  @ApiPropertyOptional({ description: 'Название объявления' })
  @IsString()
  @IsOptional()
  adName?: string;
}


