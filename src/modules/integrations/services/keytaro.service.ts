import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Integration, IntegrationDocument } from '../schemas/integration.schema';

@Injectable()
export class KeytaroService {
  private readonly baseUrl = 'https://api.keytaro.com';

  constructor(private configService: ConfigService) {}

  getTrackingScript(integration: IntegrationDocument): string {
    return integration.trackingScript || '';
  }

  generateTrackingLink(
    integration: IntegrationDocument,
    baseUrl: string,
    params?: Record<string, string>,
  ): string {
    const trackingUrl = integration.trackingUrl || integration.settings?.trackingUrl;
    
    if (!trackingUrl) {
      throw new BadRequestException('Keitaro tracking URL is not configured');
    }

    const keitaroParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          keitaroParams.append(key, value);
        }
      });
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const queryString = keitaroParams.toString();
    
    return `${baseUrl}${separator}${queryString}`;
  }

  generateButtonLink(
    integration: IntegrationDocument,
    baseUrl: string,
    campaignParams?: {
      campaignName?: string;
      siteSourceName?: string;
      placement?: string;
      campaignId?: string;
      adsetId?: string;
      adId?: string;
      adsetName?: string;
      adName?: string;
    },
  ): string {
    const trackingUrl = integration.trackingUrl || integration.settings?.trackingUrl;
    
    if (!trackingUrl) {
      throw new BadRequestException('Keitaro tracking URL is not configured');
    }

    const params: Record<string, string> = {};
    
    if (campaignParams) {
      if (campaignParams.campaignName) params.utm_campaign = campaignParams.campaignName;
      if (campaignParams.siteSourceName) params.utm_source = campaignParams.siteSourceName;
      if (campaignParams.placement) params.utm_placement = campaignParams.placement;
      if (campaignParams.campaignId) params.campaign_id = campaignParams.campaignId;
      if (campaignParams.adsetId) params.adset_id = campaignParams.adsetId;
      if (campaignParams.adId) params.ad_id = campaignParams.adId;
      if (campaignParams.adsetName) params.adset_name = campaignParams.adsetName;
      if (campaignParams.adName) params.ad_name = campaignParams.adName;
    }

    return this.generateTrackingLink(integration, baseUrl, params);
  }

  async exchangeCodeForToken(
    integration: IntegrationDocument,
    code: string,
    redirectUri?: string,
  ): Promise<any> {
    const clientId = integration.apiKey;
    const clientSecret = integration.apiSecret;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Keytaro Client ID and Client Secret are required');
    }

    try {
      const url = `${this.baseUrl}/oauth/token`;
      const payload = {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri || integration.settings?.redirectUri || 'https://localhost',
      };

      const response = await axios.post(url, payload);

      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const expiresIn = response.data.expires_in;

      integration.accessToken = accessToken;
      if (refreshToken) {
        integration.refreshToken = refreshToken;
      }
      if (expiresIn) {
        integration.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      }
      integration.status = 'active' as any;
      integration.code = null;
      await integration.save();

      return {
        success: true,
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt: integration.tokenExpiresAt,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to exchange code for token: ${error.message}`);
    }
  }

  async refreshToken(integration: IntegrationDocument): Promise<any> {
    const clientId = integration.apiKey;
    const clientSecret = integration.apiSecret;
    const refreshToken = integration.refreshToken;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new BadRequestException('Keytaro credentials are not configured');
    }

    try {
      const url = `${this.baseUrl}/oauth/token`;
      const payload = {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      };

      const response = await axios.post(url, payload);

      const accessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      const expiresIn = response.data.expires_in;

      integration.accessToken = accessToken;
      if (newRefreshToken) {
        integration.refreshToken = newRefreshToken;
      }
      if (expiresIn) {
        integration.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      }
      await integration.save();

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        expiresAt: integration.tokenExpiresAt,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to refresh token: ${error.message}`);
    }
  }

  async sendData(
    integration: IntegrationDocument,
    data: any,
    endpoint?: string,
  ): Promise<any> {
    const accessToken = integration.accessToken;

    if (!accessToken) {
      throw new BadRequestException('Keytaro access token is not configured');
    }

    try {
      const url = endpoint 
        ? `${this.baseUrl}${endpoint}`
        : `${this.baseUrl}/api/data`;

      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      await this.updateUsageStats(integration);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      await this.updateErrorStats(integration, error.message);
      throw new BadRequestException(`Failed to send data to Keytaro: ${error.message}`);
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

