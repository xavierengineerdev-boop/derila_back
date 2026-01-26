import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderItem, OrderItemSchema } from './order-item.schema';

export type OrderDocument = Order & Document;

/**
 * Статус заказа
 */
export enum OrderStatus {
  PENDING = 'pending', // Ожидает обработки
  CONFIRMED = 'confirmed', // Подтвержден
  PROCESSING = 'processing', // В обработке
  SHIPPED = 'shipped', // Отправлен
  DELIVERED = 'delivered', // Доставлен
  CANCELLED = 'cancelled', // Отменен
  REFUNDED = 'refunded', // Возвращен
}

/**
 * Способ оплаты
 */
export enum PaymentMethod {
  CASH = 'cash', // Наличные
  CARD = 'card', // Карта
  ONLINE = 'online', // Онлайн оплата
  BANK_TRANSFER = 'bank_transfer', // Банковский перевод
}

/**
 * Способ доставки
 */
export enum DeliveryMethod {
  PICKUP = 'pickup', // Самовывоз
  COURIER = 'courier', // Курьер
  POST = 'post', // Почта
  EXPRESS = 'express', // Экспресс доставка
}

/**
 * Данные клиента
 */
@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, default: null })
  company?: string;
}

export const CustomerInfoSchema = SchemaFactory.createForClass(CustomerInfo);

/**
 * Адрес доставки
 */
@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, default: null })
  building?: string;

  @Prop({ type: String, default: null })
  apartment?: string;

  @Prop({ type: String, default: null })
  postalCode?: string;

  @Prop({ type: String, default: null })
  notes?: string; // Дополнительные заметки
}

export const DeliveryAddressSchema = SchemaFactory.createForClass(DeliveryAddress);

/**
 * Схема заказа
 */
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: String, required: true, unique: true, index: true })
  orderNumber: string; // Номер заказа (уникальный)

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[]; // Товары в заказе

  @Prop({ type: CustomerInfoSchema, required: true })
  customer: CustomerInfo; // Данные клиента

  @Prop({ type: DeliveryAddressSchema, default: null })
  deliveryAddress?: DeliveryAddress; // Адрес доставки

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus; // Статус заказа

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod; // Способ оплаты

  @Prop({ type: String, enum: DeliveryMethod, required: true })
  deliveryMethod: DeliveryMethod; // Способ доставки

  // Цены
  @Prop({ type: Number, required: true })
  subtotal: number; // Сумма без скидок и доставки

  @Prop({ type: Number, default: 0 })
  discount: number; // Общая скидка

  @Prop({ type: Number, default: 0 })
  deliveryCost: number; // Стоимость доставки

  @Prop({ type: String, default: 'UAH' })
  currency: string; // Валюта

  @Prop({ type: Number, required: true })
  total: number; // Итоговая сумма

  // Дополнительная информация
  @Prop({ type: String, default: null })
  notes?: string; // Комментарий к заказу

  @Prop({ type: String, default: null })
  promoCode?: string; // Промокод

  @Prop({ type: Boolean, default: false })
  isPaid: boolean; // Оплачен ли заказ

  @Prop({ type: Date, default: null })
  paidAt?: Date; // Дата оплаты

  @Prop({ type: Boolean, default: false })
  isSentToTelegram: boolean; // Отправлен ли в Telegram

  @Prop({ type: Date, default: null })
  sentToTelegramAt?: Date; // Дата отправки в Telegram

  @Prop({ type: String, default: null })
  trackingNumber?: string; // Номер отслеживания

  @Prop({ type: Date, default: null })
  shippedAt?: Date; // Дата отправки

  @Prop({ type: Date, default: null })
  deliveredAt?: Date; // Дата доставки

  // Метаданные
  @Prop({ type: String, default: null })
  ipAddress?: string; // IP адрес клиента

  @Prop({ type: String, default: null })
  userAgent?: string; // User Agent

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; // Дополнительные метаданные
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Индексы
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ createdAt: -1 });


