import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ProductPriceDto } from './product-price.dto';

export class ProductVariantDto {
  @ApiProperty({ description: 'Название варианта', example: 'Размер: XL, Цвет: Красный' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Цена варианта', type: ProductPriceDto })
  price: ProductPriceDto;

  @ApiPropertyOptional({ description: 'Артикул варианта', example: 'PROD-XL-RED-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Количество на складе', example: 10, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Активен ли вариант', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


