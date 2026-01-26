import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Статус заказа', enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Номер отслеживания' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Оплачен ли заказ' })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Дата оплаты' })
  @IsDateString()
  @IsOptional()
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Дата отправки' })
  @IsDateString()
  @IsOptional()
  shippedAt?: Date;

  @ApiPropertyOptional({ description: 'Дата доставки' })
  @IsDateString()
  @IsOptional()
  deliveredAt?: Date;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsString()
  @IsOptional()
  notes?: string;
}


