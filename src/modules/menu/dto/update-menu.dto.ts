import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';

export class UpdateMenuDto {
  @ApiPropertyOptional({
    description: 'Название меню',
    example: 'Главная',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug',
    example: 'glavnaya',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID родительского меню',
    example: null,
  })
  @IsString()
  @IsOptional()
  parent?: string | null;

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    example: 0,
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
    description: 'Иконка',
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
  })
  @IsEnum(['internal', 'external', 'divider', 'header'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Открывать ссылку в новой вкладке',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isNewTab?: boolean;

  @ApiPropertyOptional({
    description: 'Активность меню',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


