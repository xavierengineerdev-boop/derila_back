import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IntegrationDocument = Integration & Document;

export enum IntegrationType {
  FACEBOOK = 'facebook',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
  VIBER = 'viber',
  EMAIL = 'email',
  SMS = 'sms',
  CUSTOM = 'custom',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

@Schema({ timestamps: true })
export class Integration {
  @Prop({ type: String, enum: IntegrationType, required: true, index: true })
  type: IntegrationType;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: String, enum: IntegrationStatus, default: IntegrationStatus.INACTIVE, index: true })
  status: IntegrationStatus;

  @Prop({ type: String, default: null })
  token?: string;

  @Prop({ type: String, default: null })
  apiKey?: string;

  @Prop({ type: String, default: null })
  apiSecret?: string;

  @Prop({ type: String, default: null })
  accessToken?: string;

  @Prop({ type: String, default: null })
  refreshToken?: string;

  @Prop({ type: String, default: null })
  code?: string;

  @Prop({ type: String, default: null })
  botToken?: string;

  @Prop({ type: String, default: null })
  chatId?: string;

  @Prop({ type: String, default: null })
  groupCode?: string;

  @Prop({ type: String, default: null })
  pageId?: string;

  @Prop({ type: String, default: null })
  appId?: string;

  @Prop({ type: String, default: null })
  trackingScript?: string;
  @Prop({ type: String, default: null })
  trackingUrl?: string;
  @Prop({ type: String, default: null })
  postbackUrl?: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ type: Object, default: {} })
  credentials: Record<string, any>;

  @Prop({ type: Date, default: null })
  tokenExpiresAt?: Date;

  @Prop({ type: String, default: null })
  lastError?: string;

  @Prop({ type: Date, default: null })
  lastErrorAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: Date, default: null })
  lastUsedAt?: Date;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);

IntegrationSchema.index({ type: 1, isActive: 1 });
IntegrationSchema.index({ status: 1 });

