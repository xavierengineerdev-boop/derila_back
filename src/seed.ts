import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ProductsService } from './modules/products/products.service';
import { IntegrationsService } from './modules/integrations/integrations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './modules/products/schemas/product.schema';
import { IntegrationType, IntegrationStatus } from './modules/integrations/schemas/integration.schema';
import { ConfigService } from '@nestjs/config';

async function seed() {
  const app = await NestFactory.create(AppModule);
  const productsService = app.get(ProductsService);
  const integrationsService = app.get(IntegrationsService);
  const productModel = app.get(getModelToken(Product.name));
  const configService = app.get(ConfigService);

  try {
    console.log('🌱 Начинаем заполнение БД...\n');

    console.log('📱 Настраиваю Telegram интеграцию...');
    try {
      const telegramIntegration = await integrationsService.create({
        type: IntegrationType.TELEGRAM,
        name: 'Main Telegram Bot',
        description: 'Основной Telegram бот для уведомлений о заказах',
        status: IntegrationStatus.ACTIVE,
        botToken: configService.get<string>('TELEGRAM_BOT_TOKEN'),
        isActive: true,
        settings: {
          groupId: configService.get<string>('TELEGRAM_GROUP_ID'),
        },
      });
      console.log('✅ Telegram интеграция создана');
      console.log('   Bot Token: ' + telegramIntegration.botToken);
      console.log('   Group ID: ' + telegramIntegration.settings?.groupId);
      console.log('   Статус: ' + telegramIntegration.status + '\n');
    } catch (error) {
      console.warn('⚠️  Ошибка при создании Telegram интеграции:', error.message);
    }

    console.log('🗑️  Удаляю старые товары...');
    await productModel.deleteMany({});
    console.log('✅ Старые товары удалены\n');

    const product = {
      name: 'Derila Ergo Pillow',
      description: 'Ортопедическая подушка для здорового сна',
      shortDescription: 'Комфортная ортопедическая подушка',
      price: {
        current: 190.99,
        old: 289.99,
        currency: 'zł',
      },
      sku: 'PILLOW-001',
      stock: 100,
      attributes: [
        { name: 'Материал', value: 'Memory foam' },
        { name: 'Размер', value: '54x36 см' },
        { name: 'Вес', value: '1.2 кг' },
        { name: 'Жесткость', value: 'Средняя' },
      ],
      images: [
        {
          url: '/Pod-1.svg',
          alt: 'Derila Ergo Pillow',
          order: 0,
          isMain: true,
        },
      ],
      rating: 4.8,
      reviewsCount: 22,
    };

    const createdProduct = await productsService.create(product);
    console.log('✅ Товар создан: Derila Ergo Pillow');
    console.log('   Цена: $' + createdProduct.price.current);
    console.log('   Была: $' + createdProduct.price.old);

    console.log('\n📦 Все товары в БД:\n');
    const allProducts = await productsService.findAll(true);
    
    if (allProducts.length === 0) {
      console.log('❌ Товаров не найдено!');
    } else {
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Цена: $${product.price.current}`);
        if (product.price.old) {
          console.log(`   Была: $${product.price.old}`);
        }
        console.log(`   В наличии: ${product.stock} шт\n`);
      });
    }

    console.log('✅ Seed завершен успешно!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await app.close();
  }
}

seed();
