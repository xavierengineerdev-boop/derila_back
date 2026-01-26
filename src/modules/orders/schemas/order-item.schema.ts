import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;

/**
 * Товар в заказе
 */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; // ID товара

  @Prop({ type: String, required: true })
  productName: string; // Название товара (на момент заказа)

  @Prop({ type: String, default: null })
  productSlug?: string; // Slug товара

  @Prop({ type: String, default: null })
  productImage?: string; // Изображение товара

  @Prop({ type: Number, required: true })
  quantity: number; // Количество

  @Prop({ type: Number, required: true })
  price: number; // Цена за единицу (на момент заказа)

  @Prop({ type: Number, default: 0 })
  discount: number; // Скидка

  @Prop({ type: Number, required: true })
  total: number; // Итого за позицию (price * quantity - discount)

  @Prop({ type: String, default: null })
  variant?: string; // Вариант товара (если есть)

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>; // Атрибуты товара
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);


