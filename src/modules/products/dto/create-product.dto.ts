import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductPriceDto } from './product-price.dto';
import { ProductAttributeDto } from './product-attribute.dto';
import { ProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ description: 'Название товара', example: 'Смартфон Samsung Galaxy S21' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'URL-дружественный идентификатор (автогенерация если не указан)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Описание товара' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Краткое описание товара' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'ID основной категории' })
  @IsMongoId()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'ID дополнительных категорий', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ description: 'Цена товара', type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  price: ProductPriceDto;

  @ApiPropertyOptional({ description: 'Варианты товара', type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'Атрибуты/характеристики товара', type: [ProductAttributeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @IsOptional()
  attributes?: ProductAttributeDto[];

  @ApiPropertyOptional({ description: 'Артикул товара' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Количество на складе', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Порядок сортировки', default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Активен ли товар', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Новый товар', default: false })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Рекомендуемый товар', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Товар со скидкой', default: false })
  @IsBoolean()
  @IsOptional()
  isOnSale?: boolean;

  // SEO мета-данные
  @ApiPropertyOptional({ description: 'SEO заголовок' })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO описание' })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'SEO ключевые слова' })
  @IsString()
  @IsOptional()
  metaKeywords?: string;

  // Дополнительные поля
  @ApiPropertyOptional({ description: 'Произвольные дополнительные поля', type: Object })
  @IsOptional()
  customFields?: Record<string, any>;
}


