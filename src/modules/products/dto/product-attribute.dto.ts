import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ProductAttributeDto {
  @ApiProperty({ description: 'Название атрибута', example: 'Цвет' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Значение атрибута', example: 'Красный' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Единица измерения', example: 'кг' })
  @IsString()
  @IsOptional()
  unit?: string;
}


