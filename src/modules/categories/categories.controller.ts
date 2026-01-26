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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { categoryImageMemoryStorage, categoryImageDiskStorage, categoryImageFilter } from './config/file-upload.config';
import { FileUtil } from '../../common/utils/file.util';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageMemoryStorage,
      fileFilter: categoryImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать новую категорию с загрузкой изображения (только для админа)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        parent: { type: 'string' },
        parentCategories: { type: 'string', description: 'JSON array string' },
        order: { type: 'string', description: 'Number as string' },
        description: { type: 'string' },
        icon: { type: 'string' },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        metaKeywords: { type: 'string' },
        isActive: { type: 'string', description: 'true/false as string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Категория успешно создана' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 409, description: 'Категория с таким slug уже существует' })
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Преобразуем form-data в DTO
    let parentCategories = [];
    if (body.parentCategories) {
      try {
        // Если это строка, пытаемся распарсить как JSON
        if (typeof body.parentCategories === 'string') {
          parentCategories = JSON.parse(body.parentCategories);
        } else if (Array.isArray(body.parentCategories)) {
          parentCategories = body.parentCategories;
        }
      } catch (e) {
        // Если не удалось распарсить, оставляем пустой массив
        parentCategories = [];
      }
    }

    const createCategoryDto: CreateCategoryDto = {
      name: body.name,
      slug: body.slug,
      parent: body.parent || null,
      parentCategories,
      order: body.order ? parseInt(body.order, 10) : 0,
      description: body.description || null,
      icon: body.icon || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      metaKeywords: body.metaKeywords || null,
      isActive: body.isActive === 'true' || body.isActive === true,
    };

    // Создаем категорию сначала
    const category = await this.categoriesService.create(createCategoryDto);

    // Если есть файл, сохраняем его в правильную папку
    if (file) {
      const categoryId = (category as any)._id.toString();
      const categoryPath = path.join('uploads', 'categories', categoryId);
      const fileName = FileUtil.generateFileName(file.originalname);
      const filePath = path.join(categoryPath, fileName);

      // Создаем папку если не существует
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }

      // Сохраняем файл из буфера в нужную папку
      fs.writeFileSync(filePath, file.buffer);

      // Обновляем путь к изображению в категории
      const imagePath = `/uploads/categories/${categoryId}/${fileName}`;
      await this.categoriesService.update(categoryId, { image: imagePath });
      
      // Возвращаем обновленную категорию
      return this.categoriesService.findOne(categoryId);
    }

    return category;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Получить все категории (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории (по умолчанию только активные)',
  })
  @ApiResponse({ status: 200, description: 'Список всех категорий' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.categoriesService.findAll(include);
  }

  @Public()
  @Get('main')
  @ApiOperation({ summary: 'Получить только главные категории (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Список главных категорий' })
  findMainCategories(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.categoriesService.findMainCategories(include);
  }

  @Public()
  @Get('sub/:parentId')
  @ApiOperation({ summary: 'Получить подкатегории по ID родителя (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Список подкатегорий' })
  findSubCategories(
    @Param('parentId') parentId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.categoriesService.findSubCategories(parentId, include);
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Получить дерево категорий (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Дерево категорий' })
  getTree(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.categoriesService.getTree(include);
  }

  @Public()
  @Get('tree/:id')
  @ApiOperation({ summary: 'Получить дерево категорий начиная с определенной категории (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Дерево категорий' })
  getTreeFromCategory(
    @Param('id') id: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.categoriesService.getTreeFromCategory(id, include);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Поиск категорий по названию (публичный доступ)' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Поисковый запрос',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  search(
    @Query('q') query: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.categoriesService.search(query, include);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить категорию по slug (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Категория найдена' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Public()
  @Get('paginated')
  @ApiOperation({ summary: 'Получить категории с пагинацией (публичный доступ)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество на странице',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные категории',
  })
  @ApiResponse({ status: 200, description: 'Список категорий с пагинацией' })
  findAllPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const include = includeInactive === 'true';
    return this.categoriesService.findAllPaginated(pageNum, limitNum, include);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по категориям (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Статистика категорий' })
  getStatistics() {
    return this.categoriesService.getStatistics();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Получить категорию по ID (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Категория найдена' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageDiskStorage,
      fileFilter: categoryImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить категорию с загрузкой изображения (только для админа)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        parent: { type: 'string' },
        parentCategories: { type: 'string', description: 'JSON array string' },
        order: { type: 'string', description: 'Number as string' },
        description: { type: 'string' },
        icon: { type: 'string' },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        metaKeywords: { type: 'string' },
        isActive: { type: 'string', description: 'true/false as string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Категория обновлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Преобразуем form-data в DTO
    const updateCategoryDto: UpdateCategoryDto = {};
    
    if (body.name !== undefined) updateCategoryDto.name = body.name;
    if (body.slug !== undefined) updateCategoryDto.slug = body.slug;
    if (body.parent !== undefined) updateCategoryDto.parent = body.parent || null;
    if (body.parentCategories !== undefined) {
      let parentCategories = [];
      try {
        // Если это строка, пытаемся распарсить как JSON
        if (typeof body.parentCategories === 'string') {
          parentCategories = JSON.parse(body.parentCategories);
        } else if (Array.isArray(body.parentCategories)) {
          parentCategories = body.parentCategories;
        }
      } catch (e) {
        // Если не удалось распарсить, оставляем пустой массив
        parentCategories = [];
      }
      updateCategoryDto.parentCategories = parentCategories;
    }
    if (body.order !== undefined) updateCategoryDto.order = parseInt(body.order, 10);
    if (body.description !== undefined) updateCategoryDto.description = body.description || null;
    if (body.icon !== undefined) updateCategoryDto.icon = body.icon || null;
    if (body.metaTitle !== undefined) updateCategoryDto.metaTitle = body.metaTitle || null;
    if (body.metaDescription !== undefined) updateCategoryDto.metaDescription = body.metaDescription || null;
    if (body.metaKeywords !== undefined) updateCategoryDto.metaKeywords = body.metaKeywords || null;
    if (body.isActive !== undefined) {
      updateCategoryDto.isActive = body.isActive === 'true' || body.isActive === true;
    }

    // Если загружается новый файл, удаляем старый
    if (file) {
      const category = await this.categoriesService.findOne(id);
      if (category.image) {
        const oldImagePath = category.image.replace(/^\//, '');
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Файл уже сохранен в правильную папку через diskStorage
      // Обновляем путь к изображению
      updateCategoryDto.image = `/uploads/categories/${id}/${file.filename}`;
    }

    return this.categoriesService.update(id, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('order')
  @ApiOperation({ summary: 'Массовое обновление порядка категорий (только для админа)' })
  @ApiResponse({ status: 200, description: 'Порядок обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  updateOrder(@Body() updates: { id: string; order: number }[]) {
    return this.categoriesService.updateOrder(updates);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить категорию (только для админа)' })
  @ApiResponse({ status: 200, description: 'Категория удалена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @ApiResponse({ status: 400, description: 'Нельзя удалить категорию с дочерними элементами' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

