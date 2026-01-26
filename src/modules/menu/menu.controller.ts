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
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Создать новое меню (только для админа)' })
  @ApiResponse({ status: 201, description: 'Меню успешно создано' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 409, description: 'Меню с таким slug уже существует' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Получить все меню (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные меню (по умолчанию только активные)',
  })
  @ApiResponse({ status: 200, description: 'Список всех меню' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.menuService.findAll(include);
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Получить дерево меню (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные меню (по умолчанию только активные)',
  })
  @ApiResponse({ status: 200, description: 'Дерево меню' })
  getTree(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.menuService.getTree(include);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить меню по slug (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Меню найдено' })
  @ApiResponse({ status: 404, description: 'Меню не найдено' })
  findBySlug(@Param('slug') slug: string) {
    return this.menuService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Получить меню по ID (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Меню найдено' })
  @ApiResponse({ status: 404, description: 'Меню не найдено' })
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить меню (только для админа)' })
  @ApiResponse({ status: 200, description: 'Меню обновлено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Меню не найдено' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить меню (только для админа)' })
  @ApiResponse({ status: 200, description: 'Меню удалено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Меню не найдено' })
  @ApiResponse({ status: 400, description: 'Нельзя удалить меню с дочерними элементами' })
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}

