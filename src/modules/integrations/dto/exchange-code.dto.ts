import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class ExchangeCodeDto {
  @ApiProperty({ description: 'ID интеграции', example: '507f1f77bcf86cd799439011' })
  @IsString()
  integrationId: string;

  @ApiProperty({ description: 'OAuth код для обмена на токен', example: 'AQDx...' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Redirect URI (если требуется)', example: 'https://example.com/callback' })
  @IsUrl()
  @IsOptional()
  redirectUri?: string;
}


