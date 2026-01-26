import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ProductPriceDto {
  @ApiProperty({ description: 'Текущая цена товара', example: 999.99 })
  @IsNumber()
  @Min(0)
  current: number;

  @ApiPropertyOptional({ description: 'Старая цена (для скидок)', example: 1299.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  old?: number;

  @ApiPropertyOptional({ description: 'Валюта', example: 'UAH', default: 'UAH' })
  @IsString()
  @IsOptional()
  currency?: string;
}


