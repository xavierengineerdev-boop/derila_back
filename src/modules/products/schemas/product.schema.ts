import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

/**
 * Цена товара
 */
@Schema({ _id: false })
export class ProductPrice {
  @Prop({ type: Number, required: true })
  current: number; // Текущая цена

  @Prop({ type: Number, default: null })
  old?: number; // Старая цена (для скидок)

  @Prop({ type: String, default: 'UAH' })
  currency: string; // Валюта (UAH, USD, EUR и т.д.)
}

export const ProductPriceSchema = SchemaFactory.createForClass(ProductPrice);

/**
 * Атрибут/характеристика товара
 */
@Schema({ _id: false })
export class ProductAttribute {
  @Prop({ type: String, required: true })
  name: string; // Название атрибута (например: "Цвет", "Размер", "Материал")

  @Prop({ type: String, required: true })
  value: string; // Значение атрибута (например: "Красный", "XL", "Хлопок")

  @Prop({ type: String, default: null })
  unit?: string; // Единица измерения (например: "кг", "см", "л")
}

export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttribute);

/**
 * Изображение товара
 */
@Schema({ _id: false })
export class ProductImage {
  @Prop({ type: String, required: true })
  url: string; // URL изображения

  @Prop({ type: String, default: null })
  alt?: string; // Альтернативный текст

  @Prop({ type: Number, default: 0 })
  order: number; // Порядок отображения

  @Prop({ type: Boolean, default: false })
  isMain: boolean; // Главное изображение
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

/**
 * Вариант товара (например: размер, цвет)
 */
@Schema({ _id: false })
export class ProductVariant {
  @Prop({ type: String, required: true })
  name: string; // Название варианта (например: "Размер: XL, Цвет: Красный")

  @Prop({ type: ProductPriceSchema, required: true })
  price: ProductPrice; // Цена варианта

  @Prop({ type: String, default: null })
  sku?: string; // Артикул варианта

  @Prop({ type: Number, default: 0 })
  stock: number; // Количество на складе

  @Prop({ type: Boolean, default: true })
  isActive: boolean; // Активен ли вариант
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

/**
 * Схема товара
 */
@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, index: true })
  name: string; // Название товара

  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string; // URL-дружественный идентификатор

  @Prop({ type: String, default: null })
  description?: string; // Описание товара

  @Prop({ type: String, default: null })
  shortDescription?: string; // Краткое описание

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  category?: Types.ObjectId; // Категория товара (опционально)

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categories: Types.ObjectId[]; // Дополнительные категории

  @Prop({ type: ProductPriceSchema, required: true })
  price: ProductPrice; // Цена товара

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[]; // Варианты товара

  @Prop({ type: [ProductAttributeSchema], default: [] })
  attributes: ProductAttribute[]; // Атрибуты/характеристики товара

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[]; // Изображения товара

  @Prop({ type: String, default: null })
  sku?: string; // Артикул товара

  @Prop({ type: Number, default: 0 })
  stock: number; // Количество на складе

  @Prop({ type: Number, default: 0 })
  order: number; // Порядок сортировки

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean; // Активен ли товар

  @Prop({ type: Boolean, default: false })
  isNew: boolean; // Новый товар

  @Prop({ type: Boolean, default: false })
  isFeatured: boolean; // Рекомендуемый товар

  @Prop({ type: Boolean, default: false })
  isOnSale: boolean; // Товар со скидкой

  @Prop({ type: Number, default: 0 })
  views: number; // Количество просмотров

  @Prop({ type: Number, default: 0 })
  sales: number; // Количество продаж

  @Prop({ type: Number, default: 0 })
  rating: number; // Рейтинг товара (0-5)

  @Prop({ type: Number, default: 0 })
  reviewsCount: number; // Количество отзывов

  // SEO мета-данные
  @Prop({ type: String, default: null })
  metaTitle?: string;

  @Prop({ type: String, default: null })
  metaDescription?: string;

  @Prop({ type: String, default: null })
  metaKeywords?: string;

  // Дополнительные поля (для гибкости)
  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>; // Произвольные дополнительные поля
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Индексы для быстрого поиска
ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ 'price.current': 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isOnSale: 1, isActive: 1 });


