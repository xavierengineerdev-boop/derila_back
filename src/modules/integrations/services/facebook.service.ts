import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Integration, IntegrationDocument } from '../schemas/integration.schema';

@Injectable()
export class FacebookService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(private configService: ConfigService) {}

  async exchangeCodeForToken(
    integration: IntegrationDocument,
    code: string,
    redirectUri?: string,
  ): Promise<any> {
    const appId = integration.appId || integration.apiKey;
    const appSecret = integration.apiSecret;

    if (!appId || !appSecret) {
      throw new BadRequestException('Facebook App ID and App Secret are required');
    }

    try {
      const url = `${this.baseUrl}/oauth/access_token`;
      const params = {
        client_id: appId,
        client_secret: appSecret,
        code: code,
        redirect_uri: redirectUri || integration.settings?.redirectUri || 'https://localhost',
      };

      const response = await axios.get(url, { params });

      const accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;

      integration.accessToken = accessToken;
      if (expiresIn) {
        integration.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      }
      integration.status = 'active' as any;
      integration.code = null;
      await integration.save();

      return {
        success: true,
        accessToken,
        expiresIn,
        expiresAt: integration.tokenExpiresAt,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to exchange code for token: ${error.message}`);
    }
  }

  async getPageInfo(integration: IntegrationDocument): Promise<any> {
    const accessToken = integration.accessToken;
    const pageId = integration.pageId;

    if (!accessToken) {
      throw new BadRequestException('Facebook access token is not configured');
    }

    if (!pageId) {
      throw new BadRequestException('Facebook page ID is not configured');
    }

    try {
      const url = `${this.baseUrl}/${pageId}`;
      const params = {
        access_token: accessToken,
        fields: 'id,name,about,category,fan_count,link,picture',
      };

      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to get page info: ${error.message}`);
    }
  }

  async postToPage(
    integration: IntegrationDocument,
    message: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const accessToken = integration.accessToken;
    const pageId = integration.pageId;

    if (!accessToken) {
      throw new BadRequestException('Facebook access token is not configured');
    }

    if (!pageId) {
      throw new BadRequestException('Facebook page ID is not configured');
    }

    try {
      const url = `${this.baseUrl}/${pageId}/feed`;
      const payload = {
        access_token: accessToken,
        message: message,
        ...options,
      };

      const response = await axios.post(url, payload);

      await this.updateUsageStats(integration);

      return {
        success: true,
        postId: response.data.id,
        data: response.data,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to post to Facebook: ${error.message}`);
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


