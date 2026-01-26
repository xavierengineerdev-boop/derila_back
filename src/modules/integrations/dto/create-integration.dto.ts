import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
} from 'class-validator';
import { IntegrationType, IntegrationStatus } from '../schemas/integration.schema';

export class CreateIntegrationDto {
  @ApiProperty({
    description: 'Тип интеграции',
    enum: IntegrationType,
    example: IntegrationType.TELEGRAM,
  })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'Название интеграции', example: 'Основной Telegram бот' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: 'Описание интеграции' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Статус интеграции',
    enum: IntegrationStatus,
    default: IntegrationStatus.INACTIVE,
  })
  @IsEnum(IntegrationStatus)
  @IsOptional()
  status?: IntegrationStatus;

  // Токены и ключи
  @ApiPropertyOptional({ description: 'Основной токен/ключ' })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({ description: 'API ключ' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'API секрет' })
  @IsString()
  @IsOptional()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'Access токен' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Refresh токен' })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'OAuth код (для обмена на токен)' })
  @IsString()
  @IsOptional()
  code?: string;

  // Для Telegram
  @ApiPropertyOptional({ description: 'Токен Telegram бота' })
  @IsString()
  @IsOptional()
  botToken?: string;

  @ApiPropertyOptional({ description: 'ID чата/группы Telegram' })
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiPropertyOptional({ description: 'Код группы Telegram' })
  @IsString()
  @IsOptional()
  groupCode?: string;

  // Для Facebook
  @ApiPropertyOptional({ description: 'ID страницы Facebook' })
  @IsString()
  @IsOptional()
  pageId?: string;

  @ApiPropertyOptional({ description: 'ID приложения Facebook' })
  @IsString()
  @IsOptional()
  appId?: string;

  // Для Keitaro
  @ApiPropertyOptional({ description: 'Keitaro tracking script' })
  @IsString()
  @IsOptional()
  trackingScript?: string;

  @ApiPropertyOptional({ description: 'Keitaro tracking URL (R_PATH)' })
  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @ApiPropertyOptional({ description: 'Keitaro postback URL (P_PATH)' })
  @IsString()
  @IsOptional()
  postbackUrl?: string;

  // Дополнительные настройки
  @ApiPropertyOptional({ description: 'Дополнительные настройки', type: Object })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Дополнительные учетные данные', type: Object })
  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Срок действия токена' })
  @IsOptional()
  tokenExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Активна ли интеграция', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

