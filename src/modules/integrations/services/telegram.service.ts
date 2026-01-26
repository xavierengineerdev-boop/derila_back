import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import { Integration, IntegrationDocument } from '../schemas/integration.schema';

@Injectable()
export class TelegramService {
  private readonly baseUrl = 'https://api.telegram.org/bot';

  constructor(private configService: ConfigService) {}

  async sendMessage(
    integration: IntegrationDocument,
    message: string,
    chatId?: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const targetChatId = chatId || integration.chatId;
    
    if (!targetChatId) {
      throw new BadRequestException('Chat ID is not configured');
    }

    try {
      const url = `${this.baseUrl}${botToken}/sendMessage`;
      const payload = {
        chat_id: targetChatId,
        text: message,
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview || false,
        ...options,
      };

      const response = await axios.post(url, payload);
      
      await this.updateUsageStats(integration);

      return {
        success: true,
        messageId: response.data.result?.message_id,
        data: response.data,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to send Telegram message: ${error.message}`);
    }
  }

  async sendMessageToGroup(
    integration: IntegrationDocument,
    message: string,
    groupId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    return this.sendMessage(integration, message, groupId, options);
  }

  async sendPhoto(
    integration: IntegrationDocument,
    photo: string | Buffer,
    caption?: string,
    chatId?: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const targetChatId = chatId || integration.chatId;
    
    if (!targetChatId) {
      throw new BadRequestException('Chat ID is not configured');
    }

    try {
      const url = `${this.baseUrl}${botToken}/sendPhoto`;
      const formData = new FormData();
      
      if (typeof photo === 'string') {
        formData.append('photo', photo);
      } else {
        formData.append('photo', photo, { filename: 'photo.jpg' });
      }
      
      formData.append('chat_id', targetChatId);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      await this.updateUsageStats(integration);

      return {
        success: true,
        messageId: response.data.result?.message_id,
        data: response.data,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to send Telegram photo: ${error.message}`);
    }
  }

  async getBotInfo(integration: IntegrationDocument): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    try {
      const url = `${this.baseUrl}${botToken}/getMe`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new BadRequestException(`Failed to get bot info: ${error.message}`);
    }
  }

  private async updateUsageStats(integration: IntegrationDocument): Promise<void> {
    integration.usageCount = (integration.usageCount || 0) + 1;
    integration.lastUsedAt = new Date();
    await integration.save();
  }

  private async updateErrorStats(integration: IntegrationDocument, error: string): Promise<void> {
    integration.lastError = error;
    integration.lastErrorAt = new Date();
    integration.status = 'error' as any;
    await integration.save();
  }
}

