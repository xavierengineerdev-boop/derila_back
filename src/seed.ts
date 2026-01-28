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

    const pillow = {
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

    const createdPillow = await productsService.create(pillow);
    console.log('✅ Товар создан: Derila Ergo Pillow');
    console.log('   Цена: $' + createdPillow.price.current);
    console.log('   Была: $' + createdPillow.price.old);

    const sensoryPanel = {
      name: 'Sensory Sky Panels (6-piece Activity Board)',
      description: 'Großes 6-teiliges Aktivitätsbrett für Kinder с небесной темой',
      shortDescription: 'Набор сенсорных панелей для развития и игр',
      price: {
        current: 409.99,
        old: 829.99,
        currency: 'zł',
      },
      sku: 'PANEL-001',
      stock: 50,
      attributes: [
        { name: 'Farbthema', value: 'Kräftige Farben' },
        { name: 'Montageart', value: 'Wandmontage' },
        { name: 'Modulgröße', value: '65x35x4 cm' },
        { name: 'Gesamtlänge', value: '65x210 cm' },
      ],
      images: [
        { url: '/Preview-1.svg', alt: 'Sensory Panel Preview 1', order: 0, isMain: true },
        { url: '/Preview-2.svg', alt: 'Sensory Panel Preview 2', order: 1 },
        { url: '/Preview-3.svg', alt: 'Sensory Panel Preview 3', order: 2 },
      ],
      rating: 4.9,
      reviewsCount: 14,
    };

    const createdPanel = await productsService.create(sensoryPanel);
    console.log('✅ Товар создан: Sensory Sky Panels (6-piece Activity Board)');
    console.log('   Цена: $' + createdPanel.price.current);

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
