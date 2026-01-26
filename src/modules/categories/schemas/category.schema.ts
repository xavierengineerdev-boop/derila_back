import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  parentCategories: Types.ObjectId[];

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  description: string | null;

  @Prop({ default: null })
  image: string | null;

  @Prop({ default: null })
  icon: string | null;

  @Prop({ default: null })
  metaTitle: string | null;

  @Prop({ default: null })
  metaDescription: string | null;

  @Prop({ default: null })
  metaKeywords: string | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Индексы для оптимизации запросов
CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ parentCategories: 1 });


