import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({
  timestamps: true,
})
export class Menu {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Menu', default: null })
  parent: Types.ObjectId | null;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  url: string | null;

  @Prop({ default: null })
  icon: string | null;

  @Prop({ default: null })
  description: string | null;

  @Prop({ 
    type: String, 
    enum: ['internal', 'external', 'divider', 'header'],
    default: 'internal'
  })
  type: string;

  @Prop({ default: false })
  isNewTab: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// Индексы для оптимизации запросов
MenuSchema.index({ parent: 1, order: 1 });
MenuSchema.index({ slug: 1 }, { unique: true });
MenuSchema.index({ isActive: 1 });


