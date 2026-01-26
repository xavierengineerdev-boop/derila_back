import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

/**
 * Товар в корзине
 */
@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; // ID товара

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number; // Количество

  @Prop({ type: String, default: null })
  variant?: string; // Вариант товара (если есть)

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>; // Атрибуты товара
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

/**
 * Схема корзины
 */
@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: String, unique: true, index: true })
  sessionId?: string; // ID сессии (для неавторизованных пользователей)

  @Prop({ type: Types.ObjectId, ref: 'Admin', default: null, index: true })
  userId?: Types.ObjectId; // ID пользователя (если авторизован)

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[]; // Товары в корзине

  @Prop({ type: String, default: null })
  promoCode?: string; // Промокод

  @Prop({ type: Date, default: Date.now, expires: 2592000 }) // 30 дней
  expiresAt: Date; // Срок действия корзины
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Индексы
CartSchema.index({ sessionId: 1 });
CartSchema.index({ userId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


