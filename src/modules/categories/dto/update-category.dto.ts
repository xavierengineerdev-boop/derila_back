import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Название категории',
    example: 'Электроника',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug',
    example: 'elektronika',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID родительской категории',
    example: null,
  })
  @IsString()
  @IsOptional()
  parent?: string | null;

  @ApiPropertyOptional({
    description: 'Массив ID дополнительных родительских категорий',
    example: [],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  parentCategories?: string[];

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'Описание категории',
    example: 'Категория электронных товаров',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'URL изображения категории',
    example: '/images/categories/electronics.jpg',
  })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiPropertyOptional({
    description: 'Иконка категории',
    example: 'electronics-icon',
  })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiPropertyOptional({
    description: 'SEO заголовок',
    example: 'Электроника - купить в интернет-магазине',
  })
  @IsString()
  @IsOptional()
  metaTitle?: string | null;

  @ApiPropertyOptional({
    description: 'SEO описание',
    example: 'Широкий выбор электроники по выгодным ценам',
  })
  @IsString()
  @IsOptional()
  metaDescription?: string | null;

  @ApiPropertyOptional({
    description: 'SEO ключевые слова',
    example: 'электроника, техника, гаджеты',
  })
  @IsString()
  @IsOptional()
  metaKeywords?: string | null;

  @ApiPropertyOptional({
    description: 'Активность категории',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


