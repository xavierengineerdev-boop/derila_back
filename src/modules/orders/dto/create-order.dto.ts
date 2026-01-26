import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsEmail,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod, DeliveryMethod } from '../schemas/order.schema';

export class OrderItemDto {
  @ApiProperty({ description: 'ID товара' })
  @IsString()
  product: string;

  @ApiProperty({ description: 'Количество', example: 2 })
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

export class CustomerInfoDto {
  @ApiProperty({ description: 'Имя', example: 'Иван' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ description: 'Фамилия', example: 'Иванов' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ description: 'Email', example: 'ivan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Телефон', example: '+380501234567' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiPropertyOptional({ description: 'Компания' })
  @IsString()
  @IsOptional()
  company?: string;
}

export class DeliveryAddressDto {
  @ApiProperty({ description: 'Страна', example: 'Украина' })
  @IsString()
  @MinLength(1)
  country: string;

  @ApiProperty({ description: 'Город', example: 'Киев' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiProperty({ description: 'Улица', example: 'ул. Крещатик' })
  @IsString()
  @MinLength(1)
  street: string;

  @ApiPropertyOptional({ description: 'Дом', example: '1' })
  @IsString()
  @IsOptional()
  building?: string;

  @ApiPropertyOptional({ description: 'Квартира', example: '10' })
  @IsString()
  @IsOptional()
  apartment?: string;

  @ApiPropertyOptional({ description: 'Почтовый индекс', example: '01001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Дополнительные заметки' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Товары в заказе', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Данные клиента', type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiPropertyOptional({ description: 'Адрес доставки', type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  deliveryAddress?: DeliveryAddressDto;

  @ApiProperty({ description: 'Способ оплаты', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Способ доставки', enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Комментарий к заказу' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Промокод' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'Стоимость доставки', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryCost?: number;

  @ApiPropertyOptional({ description: 'Скидка', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Валюта', default: 'zł' })
  @IsString()
  @IsOptional()
  currency?: string;
}


