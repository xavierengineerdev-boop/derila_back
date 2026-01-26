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
  UploadedFiles,
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  productImageMemoryStorage,
  productImageDiskStorage,
  productImageFilter,
} from './config/file-upload.config';
import { FileUtil } from '../../common/utils/file.util';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: productImageMemoryStorage,
      fileFilter: productImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать новый товар с загрузкой изображений (только для админа)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        shortDescription: { type: 'string' },
        category: { type: 'string' },
        categories: { type: 'string', description: 'JSON array string' },
        price: { type: 'string', description: 'JSON object: {"current": 999.99, "old": 1299.99, "currency": "UAH"}' },
        variants: { type: 'string', description: 'JSON array string' },
        attributes: { type: 'string', description: 'JSON array string' },
        sku: { type: 'string' },
        stock: { type: 'string', description: 'Number as string' },
        order: { type: 'string', description: 'Number as string' },
        isActive: { type: 'string', description: 'true/false as string' },
        isNew: { type: 'string', description: 'true/false as string' },
        isFeatured: { type: 'string', description: 'true/false as string' },
        isOnSale: { type: 'string', description: 'true/false as string' },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        metaKeywords: { type: 'string' },
        customFields: { type: 'string', description: 'JSON object string' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Товар успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 409, description: 'Товар с таким slug уже существует' })
  async create(
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Преобразуем form-data в DTO
    let categories = [];
    if (body.categories) {
      try {
        if (typeof body.categories === 'string') {
          categories = JSON.parse(body.categories);
        } else if (Array.isArray(body.categories)) {
          categories = body.categories;
        }
      } catch (e) {
        categories = [];
      }
    }

    let price;
    try {
      price = typeof body.price === 'string' ? JSON.parse(body.price) : body.price;
    } catch (e) {
      throw new BadRequestException('Invalid price format');
    }

    let variants = [];
    if (body.variants) {
      try {
        variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : [];
      } catch (e) {
        variants = [];
      }
    }

    let attributes = [];
    if (body.attributes) {
      try {
        attributes = typeof body.attributes === 'string' ? JSON.parse(body.attributes) : [];
      } catch (e) {
        attributes = [];
      }
    }

    let customFields = {};
    if (body.customFields) {
      try {
        customFields = typeof body.customFields === 'string' ? JSON.parse(body.customFields) : {};
      } catch (e) {
        customFields = {};
      }
    }

    const createProductDto: CreateProductDto = {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      shortDescription: body.shortDescription || null,
      category: body.category || null,
      categories: categories.length > 0 ? categories : undefined,
      price,
      variants: variants.length > 0 ? variants : undefined,
      attributes: attributes.length > 0 ? attributes : undefined,
      sku: body.sku || null,
      stock: body.stock ? parseInt(body.stock, 10) : 0,
      order: body.order ? parseInt(body.order, 10) : 0,
      isActive: body.isActive === 'true' || body.isActive === true,
      isNew: body.isNew === 'true' || body.isNew === true,
      isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
      isOnSale: body.isOnSale === 'true' || body.isOnSale === true,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      metaKeywords: body.metaKeywords || null,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };

    // Создаем товар
    const product = await this.productsService.create(createProductDto);

    // Если есть файлы, сохраняем их
    if (files && files.length > 0) {
      const productId = (product as any)._id.toString();
      const productPath = path.join('uploads', 'products', productId);

      if (!fs.existsSync(productPath)) {
        fs.mkdirSync(productPath, { recursive: true });
      }

      const images = [];
      files.forEach((file, index) => {
        const fileName = FileUtil.generateFileName(file.originalname);
        const filePath = path.join(productPath, fileName);
        fs.writeFileSync(filePath, file.buffer);

        images.push({
          url: `/uploads/products/${productId}/${fileName}`,
          alt: body[`imageAlt_${index}`] || null,
          order: index,
          isMain: index === 0, // Первое изображение - главное
        });
      });

      // Обновляем товар с изображениями
      await this.productsService.update(productId, { images } as any);
      
      return this.productsService.findOne(productId);
    }

    return product;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Получить все товары (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список всех товаров' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.productsService.findAll(include);
  }

  @Public()
  @Get('paginated')
  @ApiOperation({ summary: 'Получить товары с пагинацией (публичный доступ)' })
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
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список товаров с пагинацией' })
  findAllPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const include = includeInactive === 'true';
    return this.productsService.findAllPaginated(pageNum, limitNum, include);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Поиск товаров (публичный доступ)' })
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
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  search(
    @Query('q') query: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.productsService.search(query, include);
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Получить товары по категории (публичный доступ)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Включить неактивные товары',
  })
  @ApiResponse({ status: 200, description: 'Список товаров категории' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.productsService.findByCategory(categoryId, include);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Получить рекомендуемые товары (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список рекомендуемых товаров' })
  findFeatured(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findFeatured(limitNum);
  }

  @Public()
  @Get('on-sale')
  @ApiOperation({ summary: 'Получить товары со скидкой (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список товаров со скидкой' })
  findOnSale(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findOnSale(limitNum);
  }

  @Public()
  @Get('new')
  @ApiOperation({ summary: 'Получить новые товары (публичный доступ)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество товаров',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Список новых товаров' })
  findNew(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findNew(limitNum);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по товарам (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Статистика товаров' })
  getStatistics() {
    return this.productsService.getStatistics();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить товар по slug (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по ID (публичный доступ)' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: productImageDiskStorage,
      fileFilter: productImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить товар с загрузкой изображений (только для админа)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        shortDescription: { type: 'string' },
        category: { type: 'string' },
        categories: { type: 'string', description: 'JSON array string' },
        price: { type: 'string', description: 'JSON object' },
        variants: { type: 'string', description: 'JSON array string' },
        attributes: { type: 'string', description: 'JSON array string' },
        sku: { type: 'string' },
        stock: { type: 'string' },
        order: { type: 'string' },
        isActive: { type: 'string' },
        isNew: { type: 'string' },
        isFeatured: { type: 'string' },
        isOnSale: { type: 'string' },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        metaKeywords: { type: 'string' },
        customFields: { type: 'string', description: 'JSON object string' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Товар обновлен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Преобразуем form-data в DTO
    const updateProductDto: UpdateProductDto = {};

    if (body.name !== undefined) updateProductDto.name = body.name;
    if (body.slug !== undefined) updateProductDto.slug = body.slug;
    if (body.description !== undefined) updateProductDto.description = body.description || null;
    if (body.shortDescription !== undefined) updateProductDto.shortDescription = body.shortDescription || null;
    if (body.category !== undefined) updateProductDto.category = body.category || null;
    if (body.sku !== undefined) updateProductDto.sku = body.sku || null;
    if (body.stock !== undefined) updateProductDto.stock = parseInt(body.stock, 10);
    if (body.order !== undefined) updateProductDto.order = parseInt(body.order, 10);
    if (body.isActive !== undefined) updateProductDto.isActive = body.isActive === 'true' || body.isActive === true;
    if (body.isNew !== undefined) updateProductDto.isNew = body.isNew === 'true' || body.isNew === true;
    if (body.isFeatured !== undefined) updateProductDto.isFeatured = body.isFeatured === 'true' || body.isFeatured === true;
    if (body.isOnSale !== undefined) updateProductDto.isOnSale = body.isOnSale === 'true' || body.isOnSale === true;
    if (body.metaTitle !== undefined) updateProductDto.metaTitle = body.metaTitle || null;
    if (body.metaDescription !== undefined) updateProductDto.metaDescription = body.metaDescription || null;
    if (body.metaKeywords !== undefined) updateProductDto.metaKeywords = body.metaKeywords || null;

    if (body.categories !== undefined) {
      try {
        updateProductDto.categories = typeof body.categories === 'string' 
          ? JSON.parse(body.categories) 
          : body.categories;
      } catch (e) {
        updateProductDto.categories = [];
      }
    }

    if (body.price !== undefined) {
      try {
        updateProductDto.price = typeof body.price === 'string' ? JSON.parse(body.price) : body.price;
      } catch (e) {
        // Ошибка парсинга цены
      }
    }

    if (body.variants !== undefined) {
      try {
        updateProductDto.variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : [];
      } catch (e) {
        updateProductDto.variants = [];
      }
    }

    if (body.attributes !== undefined) {
      try {
        updateProductDto.attributes = typeof body.attributes === 'string' ? JSON.parse(body.attributes) : [];
      } catch (e) {
        updateProductDto.attributes = [];
      }
    }

    if (body.customFields !== undefined) {
      try {
        updateProductDto.customFields = typeof body.customFields === 'string' ? JSON.parse(body.customFields) : {};
      } catch (e) {
        updateProductDto.customFields = {};
      }
    }

    // Если загружаются новые файлы, добавляем их к существующим
    if (files && files.length > 0) {
      const product = await this.productsService.findOne(id);
      const existingImages = product.images || [];
      const productPath = path.join('uploads', 'products', id);

      if (!fs.existsSync(productPath)) {
        fs.mkdirSync(productPath, { recursive: true });
      }

      const newImages = [];
      files.forEach((file, index) => {
        const fileName = FileUtil.generateFileName(file.originalname);
        const filePath = path.join(productPath, fileName);
        fs.writeFileSync(filePath, file.buffer);

        newImages.push({
          url: `/uploads/products/${id}/${fileName}`,
          alt: body[`imageAlt_${index}`] || null,
          order: existingImages.length + index,
          isMain: existingImages.length === 0 && index === 0,
        });
      });

      (updateProductDto as any).images = [...existingImages, ...newImages];
    }

    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить товар (только для админа)' })
  @ApiResponse({ status: 200, description: 'Товар удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(id);
    
    // Удаляем папку с изображениями
    const productImagePath = path.join('uploads', 'products', id);
    if (fs.existsSync(productImagePath)) {
      fs.rmSync(productImagePath, { recursive: true, force: true });
    }

    return product;
  }
}

