import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './modules/admin/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.setGlobalPrefix('api');
  app.enableCors();
  
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'products'), {
    prefix: '/uploads/products',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'categories'), {
    prefix: '/uploads/categories',
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  
  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const appName = configService.get<string>('app.name') || 'Back Shop';
  
  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('API документация для Back Shop')
    .setVersion('1.0')
    .addTag('app', 'Основные эндпоинты приложения')
    .addTag('admin', 'Управление админом')
    .addTag('menu', 'Управление меню')
    .addTag('categories', 'Управление категориями товаров')
    .addTag('products', 'Управление товарами')
    .addTag('integrations', 'Управление интеграциями')
    .addTag('orders', 'Управление заказами и корзиной')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(port);
  
  console.log('=================================');
  console.log(`🚀 ${appName} успешно стартовал!`);
  console.log(`📍 API: http://localhost:${port}/api`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  console.log(`🌍 Окружение: ${nodeEnv}`);
  console.log('=================================');
}
bootstrap();

