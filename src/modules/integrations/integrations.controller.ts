import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { TelegramService } from './services/telegram.service';
import { FacebookService } from './services/facebook.service';
import { KeytaroService } from './services/keytaro.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { GenerateLinkDto, GenerateButtonLinkDto } from './dto/generate-link.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { IntegrationType } from './schemas/integration.schema';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly telegramService: TelegramService,
    private readonly facebookService: FacebookService,
    private readonly keytaroService: KeytaroService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Создать новую интеграцию (только для админа)' })
  @ApiResponse({ status: 201, description: 'Интеграция успешно создана' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(@Body() createIntegrationDto: CreateIntegrationDto) {
    return this.integrationsService.create(createIntegrationDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'Получить все интеграции (только для админа)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные интеграции',
  })
  @ApiResponse({ status: 200, description: 'Список всех интеграций' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.integrationsService.findAll(include);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('type/:type')
  @ApiOperation({ summary: 'Получить интеграции по типу (только для админа)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные интеграции',
  })
  @ApiResponse({ status: 200, description: 'Список интеграций по типу' })
  findByType(
    @Param('type') type: IntegrationType,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.integrationsService.findByType(type, include);
  }

  @Public()
  @Get('active/:type')
  @ApiOperation({ summary: 'Получить активные интеграции по типу (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Список активных интеграций' })
  findActiveByType(@Param('type') type: IntegrationType) {
    return this.integrationsService.findActiveByType(type);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по интеграциям (только для админа)' })
  @ApiResponse({ status: 200, description: 'Статистика интеграций' })
  getStatistics() {
    return this.integrationsService.getStatistics();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: 'Получить интеграцию по ID (только для админа)' })
  @ApiResponse({ status: 200, description: 'Интеграция найдена' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить интеграцию (только для админа)' })
  @ApiResponse({ status: 200, description: 'Интеграция обновлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  update(@Param('id') id: string, @Body() updateIntegrationDto: UpdateIntegrationDto) {
    return this.integrationsService.update(id, updateIntegrationDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/activate')
  @ApiOperation({ summary: 'Активировать интеграцию (только для админа)' })
  @ApiResponse({ status: 200, description: 'Интеграция активирована' })
  activate(@Param('id') id: string) {
    return this.integrationsService.activate(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Деактивировать интеграцию (только для админа)' })
  @ApiResponse({ status: 200, description: 'Интеграция деактивирована' })
  deactivate(@Param('id') id: string) {
    return this.integrationsService.deactivate(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('telegram/send')
  @ApiOperation({ summary: 'Отправить сообщение в Telegram (только для админа)' })
  @ApiResponse({ status: 200, description: 'Сообщение отправлено' })
  @ApiResponse({ status: 400, description: 'Ошибка отправки' })
  async sendTelegramMessage(@Body() sendMessageDto: SendMessageDto) {
    const integration = await this.integrationsService.findOne(sendMessageDto.integrationId);
    
    if (integration.type !== IntegrationType.TELEGRAM) {
      throw new Error('Integration is not a Telegram integration');
    }

    return this.telegramService.sendMessage(
      integration as any,
      sendMessageDto.message,
      sendMessageDto.groupId,
      sendMessageDto.options,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('telegram/:id/bot-info')
  @ApiOperation({ summary: 'Получить информацию о Telegram боте (только для админа)' })
  @ApiResponse({ status: 200, description: 'Информация о боте' })
  async getTelegramBotInfo(@Param('id') id: string) {
    const integration = await this.integrationsService.findOne(id);
    
    if (integration.type !== IntegrationType.TELEGRAM) {
      throw new Error('Integration is not a Telegram integration');
    }

    return this.telegramService.getBotInfo(integration as any);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('facebook/exchange-code')
  @ApiOperation({ summary: 'Обменять OAuth код на токен для Facebook (только для админа)' })
  @ApiResponse({ status: 200, description: 'Токен успешно получен' })
  @ApiResponse({ status: 400, description: 'Ошибка обмена кода' })
  async exchangeFacebookCode(@Body() exchangeCodeDto: ExchangeCodeDto) {
    const integration = await this.integrationsService.findOne(exchangeCodeDto.integrationId);
    
    if (integration.type !== IntegrationType.FACEBOOK) {
      throw new Error('Integration is not a Facebook integration');
    }

    return this.facebookService.exchangeCodeForToken(
      integration as any,
      exchangeCodeDto.code,
      exchangeCodeDto.redirectUri,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('facebook/:id/page-info')
  @ApiOperation({ summary: 'Получить информацию о странице Facebook (только для админа)' })
  @ApiResponse({ status: 200, description: 'Информация о странице' })
  async getFacebookPageInfo(@Param('id') id: string) {
    const integration = await this.integrationsService.findOne(id);
    
    if (integration.type !== IntegrationType.FACEBOOK) {
      throw new Error('Integration is not a Facebook integration');
    }

    return this.facebookService.getPageInfo(integration as any);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('facebook/:id/post')
  @ApiOperation({ summary: 'Опубликовать сообщение на странице Facebook (только для админа)' })
  @ApiResponse({ status: 200, description: 'Сообщение опубликовано' })
  async postToFacebook(
    @Param('id') id: string,
    @Body() body: { message: string; options?: Record<string, any> },
  ) {
    const integration = await this.integrationsService.findOne(id);
    
    if (integration.type !== IntegrationType.FACEBOOK) {
      throw new Error('Integration is not a Facebook integration');
    }

    return this.facebookService.postToPage(integration as any, body.message, body.options);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('keytaro/exchange-code')
  @ApiOperation({ summary: 'Обменять OAuth код на токен для Keytaro (только для админа)' })
  @ApiResponse({ status: 200, description: 'Токен успешно получен' })
  @ApiResponse({ status: 400, description: 'Ошибка обмена кода' })
  async exchangeKeytaroCode(@Body() exchangeCodeDto: ExchangeCodeDto) {
    const integration = await this.integrationsService.findOne(exchangeCodeDto.integrationId);
    
    if (integration.type !== IntegrationType.CUSTOM) {
      throw new Error('Integration type is not supported for Keytaro');
    }

    return this.keytaroService.exchangeCodeForToken(
      integration as any,
      exchangeCodeDto.code,
      exchangeCodeDto.redirectUri,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('keytaro/:id/refresh-token')
  @ApiOperation({ summary: 'Обновить токен Keytaro через refresh token (только для админа)' })
  @ApiResponse({ status: 200, description: 'Токен обновлен' })
  async refreshKeytaroToken(@Param('id') id: string) {
    const integration = await this.integrationsService.findOne(id);
    
    return this.keytaroService.refreshToken(integration as any);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('keytaro/:id/send')
  @ApiOperation({ summary: 'Отправить данные в Keytaro (только для админа)' })
  @ApiResponse({ status: 200, description: 'Данные отправлены' })
  async sendToKeytaro(
    @Param('id') id: string,
    @Body() body: { data: any; endpoint?: string },
  ) {
    const integration = await this.integrationsService.findOne(id);
    
    return this.keytaroService.sendData(integration as any, body.data, body.endpoint);
  }

  @Public()
  @Get('keytaro/:id/tracking-script')
  @ApiOperation({ summary: 'Получить Keitaro tracking script (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Tracking script' })
  async getKeitaroTrackingScript(@Param('id') id: string) {
    const integration = await this.integrationsService.findOne(id);
    
    const script = this.keytaroService.getTrackingScript(integration as any);
    
    return {
      script,
      contentType: 'text/html',
    };
  }

  @Public()
  @Post('keytaro/generate-link')
  @ApiOperation({ summary: 'Сгенерировать ссылку с параметрами Keitaro (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Сгенерированная ссылка' })
  async generateKeitaroLink(@Body() generateLinkDto: GenerateLinkDto) {
    const integration = await this.integrationsService.findOne(generateLinkDto.integrationId);
    
    const link = this.keytaroService.generateTrackingLink(
      integration as any,
      generateLinkDto.baseUrl,
      generateLinkDto.params,
    );
    
    return {
      link,
      baseUrl: generateLinkDto.baseUrl,
      params: generateLinkDto.params,
    };
  }

  @Public()
  @Post('keytaro/generate-button-link')
  @ApiOperation({ summary: 'Сгенерировать ссылку для кнопки с параметрами рекламы (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Сгенерированная ссылка' })
  async generateKeitaroButtonLink(@Body() generateButtonLinkDto: GenerateButtonLinkDto) {
    const integration = await this.integrationsService.findOne(generateButtonLinkDto.integrationId);
    
    const link = this.keytaroService.generateButtonLink(
      integration as any,
      generateButtonLinkDto.baseUrl,
      {
        campaignName: generateButtonLinkDto.campaignName,
        siteSourceName: generateButtonLinkDto.siteSourceName,
        placement: generateButtonLinkDto.placement,
        campaignId: generateButtonLinkDto.campaignId,
        adsetId: generateButtonLinkDto.adsetId,
        adId: generateButtonLinkDto.adId,
        adsetName: generateButtonLinkDto.adsetName,
        adName: generateButtonLinkDto.adName,
      },
    );
    
    return {
      link,
      baseUrl: generateButtonLinkDto.baseUrl,
      campaignParams: {
        campaignName: generateButtonLinkDto.campaignName,
        siteSourceName: generateButtonLinkDto.siteSourceName,
        placement: generateButtonLinkDto.placement,
        campaignId: generateButtonLinkDto.campaignId,
        adsetId: generateButtonLinkDto.adsetId,
        adId: generateButtonLinkDto.adId,
        adsetName: generateButtonLinkDto.adsetName,
        adName: generateButtonLinkDto.adName,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить интеграцию (только для админа)' })
  @ApiResponse({ status: 200, description: 'Интеграция удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Интеграция не найдена' })
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }
}

