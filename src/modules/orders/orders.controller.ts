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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Создать новый заказ (публичный доступ)' })
  @ApiResponse({ status: 201, description: 'Заказ успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.ordersService.create(createOrderDto, sessionId, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'Получить все заказы (только для админа)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить отмененные заказы',
  })
  @ApiResponse({ status: 200, description: 'Список всех заказов' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.ordersService.findAll(include);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по заказам (только для админа)' })
  @ApiResponse({ status: 200, description: 'Статистика заказов' })
  getStatistics() {
    return this.ordersService.getStatistics();
  }

  @Public()
  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Получить заказ по номеру (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Заказ найден' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID (только для админа)' })
  @ApiResponse({ status: 200, description: 'Заказ найден' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить заказ (только для админа)' })
  @ApiResponse({ status: 200, description: 'Заказ обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ (только для админа)' })
  @ApiResponse({ status: 200, description: 'Заказ удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  // ========== КОРЗИНА ==========

  @Public()
  @Get('cart')
  @ApiOperation({ summary: 'Получить корзину с товарами (публичный доступ)' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'ID сессии',
  })
  @ApiResponse({ status: 200, description: 'Корзина найдена' })
  async getCart(@Query('sessionId') sessionId: string, @Query('userId') userId?: string) {
    return this.ordersService.getCartWithProducts(sessionId, userId);
  }

  @Public()
  @Post('cart/add')
  @ApiOperation({ summary: 'Добавить товар в корзину (публичный доступ)' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'ID сессии',
  })
  @ApiResponse({ status: 200, description: 'Товар добавлен в корзину' })
  async addToCart(
    @Query('sessionId') sessionId: string,
    @Body() addToCartDto: AddToCartDto,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.addToCart(sessionId, addToCartDto, userId);
  }

  @Public()
  @Patch('cart/item/:itemId')
  @ApiOperation({ summary: 'Обновить количество товара в корзине (публичный доступ)' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'ID сессии',
  })
  @ApiQuery({
    name: 'quantity',
    required: true,
    type: Number,
    description: 'Новое количество',
  })
  @ApiResponse({ status: 200, description: 'Корзина обновлена' })
  async updateCartItem(
    @Query('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @Query('quantity') quantity: string,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.updateCartItem(sessionId, itemId, parseInt(quantity, 10), userId);
  }

  @Public()
  @Delete('cart/item/:itemId')
  @ApiOperation({ summary: 'Удалить товар из корзины (публичный доступ)' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'ID сессии',
  })
  @ApiResponse({ status: 200, description: 'Товар удален из корзины' })
  async removeFromCart(
    @Query('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.removeFromCart(sessionId, itemId, userId);
  }

  @Public()
  @Delete('cart')
  @ApiOperation({ summary: 'Очистить корзину (публичный доступ)' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'ID сессии',
  })
  @ApiResponse({ status: 200, description: 'Корзина очищена' })
  async clearCart(@Query('sessionId') sessionId: string, @Query('userId') userId?: string) {
    return this.ordersService.clearCart(sessionId, userId);
  }
}


