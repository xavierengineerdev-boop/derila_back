import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({
  timestamps: true,
})
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Индекс для автоматического удаления истекших токенов
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


