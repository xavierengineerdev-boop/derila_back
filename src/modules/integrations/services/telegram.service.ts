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
    groupId?: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const targetGroupId = groupId || integration.settings?.groupId;
    
    if (!targetGroupId) {
      throw new BadRequestException('Group ID is not configured');
    }

    // Преобразуем groupId в строку или число (Telegram API принимает оба варианта)
    // Если это строка с числом, преобразуем в число для групп (отрицательные числа)
    let chatId: string | number = targetGroupId;
    if (typeof targetGroupId === 'string') {
      // Убираем пробелы и проверяем, является ли это числом (включая отрицательные)
      const trimmed = targetGroupId.trim();
      const numId = parseInt(trimmed, 10);
      if (!isNaN(numId) && trimmed === numId.toString()) {
        chatId = numId;
      }
    }

    try {
      const url = `${this.baseUrl}${botToken}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview || false,
        ...options,
      };

      console.log('=== ОТПРАВКА СООБЩЕНИЯ В TELEGRAM ===');
      console.log('Исходный groupId:', targetGroupId, '(тип:', typeof targetGroupId + ')');
      console.log('Преобразованный chatId:', chatId, '(тип:', typeof chatId + ')');
      console.log('URL:', url.replace(botToken, 'TOKEN_HIDDEN'));
      console.log('Payload chat_id:', payload.chat_id);
      console.log('Длина сообщения:', message.length, 'символов');

      const response = await axios.post(url, payload);
      
      console.log('✅ Ответ от Telegram API:', {
        ok: response.data.ok,
        messageId: response.data.result?.message_id,
        chat: response.data.result?.chat?.title || response.data.result?.chat?.id
      });
      
      await this.updateUsageStats(integration);

      return {
        success: true,
        messageId: response.data.result?.message_id,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Ошибка при отправке сообщения в Telegram:');
      console.error('Ошибка:', error);
      
      let errorMessage = error.message;
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
        errorMessage = error.response.data?.description || error.response.data?.error_code 
          ? `Telegram API Error ${error.response.data.error_code}: ${error.response.data.description}`
          : error.message;
      }
      
      await this.updateErrorStats(integration, errorMessage);
      throw new BadRequestException(`Failed to send Telegram message: ${errorMessage}`);
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
    groupId?: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const targetGroupId = groupId || integration.settings?.groupId;
    
    if (!targetGroupId) {
      throw new BadRequestException('Group ID is not configured');
    }

    try {
      const url = `${this.baseUrl}${botToken}/sendPhoto`;
      const formData = new FormData();
      
      if (typeof photo === 'string') {
        formData.append('photo', photo);
      } else {
        formData.append('photo', photo, { filename: 'photo.jpg' });
      }
      
      formData.append('chat_id', targetGroupId);
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

  async getChatInfo(integration: IntegrationDocument, chatId?: string | number): Promise<any> {
    const botToken = integration.botToken || integration.token;
    
    if (!botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const targetChatId = chatId || integration.settings?.groupId;
    
    if (!targetChatId) {
      throw new BadRequestException('Chat ID is not configured');
    }

    // Преобразуем chatId в строку или число
    let finalChatId: string | number = targetChatId;
    if (typeof targetChatId === 'string') {
      // Убираем пробелы и проверяем, является ли это числом (включая отрицательные)
      const trimmed = targetChatId.trim();
      const numId = parseInt(trimmed, 10);
      if (!isNaN(numId) && trimmed === numId.toString()) {
        finalChatId = numId;
      }
    }

    try {
      const url = `${this.baseUrl}${botToken}/getChat`;
      const response = await axios.post(url, { chat_id: finalChatId });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.description || error.message;
      throw new BadRequestException(`Failed to get chat info: ${errorMessage}`);
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

