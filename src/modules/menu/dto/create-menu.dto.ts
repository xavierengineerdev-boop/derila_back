import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, IsUrl, Min, Max } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Название меню',
    example: 'Главная',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Slug (автоматически генерируется из названия, если не указан)',
    example: 'glavnaya',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID родительского меню (для создания подменю)',
    example: null,
  })
  @IsString()
  @IsOptional()
  parent?: string | null;

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'URL ссылки',
    example: '/home',
  })
  @IsString()
  @IsOptional()
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Иконка (класс или путь к иконке)',
    example: 'home-icon',
  })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiPropertyOptional({
    description: 'Описание меню',
    example: 'Главная страница сайта',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Тип меню',
    enum: ['internal', 'external', 'divider', 'header'],
    example: 'internal',
    default: 'internal',
  })
  @IsEnum(['internal', 'external', 'divider', 'header'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Открывать ссылку в новой вкладке',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isNewTab?: boolean;

  @ApiPropertyOptional({
    description: 'Активность меню',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


