import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'ID товара' })
  @IsString()
  product: string;

  @ApiProperty({ description: 'Количество', example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Вариант товара' })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiPropertyOptional({ description: 'Атрибуты товара', type: Object })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}


