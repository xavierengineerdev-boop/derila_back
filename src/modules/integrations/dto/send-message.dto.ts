import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID интеграции', example: '507f1f77bcf86cd799439011' })
  @IsString()
  integrationId: string;

  @ApiProperty({ description: 'Текст сообщения', example: 'Привет! Это тестовое сообщение' })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({ description: 'ID чата (если отличается от настроенного)', example: '-1001234567890' })
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiPropertyOptional({ description: 'Дополнительные параметры', type: Object })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}


