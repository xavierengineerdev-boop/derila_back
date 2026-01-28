import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ProductsService } from './modules/products/products.service';
import { IntegrationsService } from './modules/integrations/integrations.service';
import { TelegramService } from './modules/integrations/services/telegram.service';
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
      let botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
      let groupIdRaw = configService.get<string>('TELEGRAM_GROUP_ID');
      
      // Убираем пробелы и кавычки, если есть
      if (botToken) {
        botToken = botToken.trim().replace(/^["']|["']$/g, '');
      }
      if (groupIdRaw) {
        groupIdRaw = groupIdRaw.trim().replace(/^["']|["']$/g, '');
      }
      
      const groupId = groupIdRaw;
      
      console.log('   Проверка переменных окружения:');
      console.log('   TELEGRAM_BOT_TOKEN:', botToken ? '✅ Найден (' + botToken.substring(0, 10) + '...)' : '❌ Не найден');
      console.log('   TELEGRAM_GROUP_ID:', groupId ? '✅ Найден (' + groupId + ', тип: ' + typeof groupId + ')' : '❌ Не найден');
      if (groupId) {
        const numId = parseInt(groupId, 10);
        console.log('   Преобразование groupId в число:', isNaN(numId) ? '❌ Не число' : '✅ ' + numId);
      }
      
      if (!botToken || !groupId) {
        console.warn('⚠️  Переменные окружения не настроены! Проверьте .env файл.');
        console.warn('   Нужно добавить:');
        console.warn('   TELEGRAM_BOT_TOKEN=ваш_токен');
        console.warn('   TELEGRAM_GROUP_ID=ваш_chat_id\n');
      } else {
        // Ищем существующую интеграцию
        const existingIntegrations = await integrationsService.findByType(IntegrationType.TELEGRAM, true);
        let telegramIntegration;
        
        if (existingIntegrations.length > 0) {
          // Обновляем существующую
          console.log('   Найдена существующая интеграция, обновляю...');
          telegramIntegration = existingIntegrations[0];
          telegramIntegration.botToken = botToken;
          telegramIntegration.status = IntegrationStatus.ACTIVE;
          telegramIntegration.isActive = true;
          telegramIntegration.settings = {
            ...telegramIntegration.settings,
            groupId: groupId, // Уже обработан выше (trim)
          };
          await telegramIntegration.save();
          console.log('✅ Telegram интеграция обновлена');
        } else {
          // Создаем новую
          console.log('   Создаю новую интеграцию...');
          telegramIntegration = await integrationsService.create({
            type: IntegrationType.TELEGRAM,
            name: 'Main Telegram Bot',
            description: 'Основной Telegram бот для уведомлений о заказах',
            status: IntegrationStatus.ACTIVE,
            botToken: botToken,
            isActive: true,
            settings: {
              groupId: groupId, // Уже обработан выше (trim)
            },
          });
          console.log('✅ Telegram интеграция создана');
        }
        
        console.log('   Bot Token:', telegramIntegration.botToken ? '✅ Настроен' : '❌ Не настроен');
        console.log('   Group ID:', telegramIntegration.settings?.groupId || '❌ Не настроен');
        console.log('   Статус:', telegramIntegration.status);
        console.log('   isActive:', telegramIntegration.isActive);
        
        // Проверяем доступ к группе и отправляем тестовое сообщение
        if (telegramIntegration.botToken && telegramIntegration.settings?.groupId) {
          const telegramService = app.get(TelegramService);
          
          // Сначала проверяем, может ли бот получить информацию о группе
          try {
            console.log('\n   Проверка доступа к группе...');
            const chatInfo = await telegramService.getChatInfo(telegramIntegration as any);
            console.log('   ✅ Бот имеет доступ к группе:', chatInfo.result?.title || chatInfo.result?.id);
            console.log('   Тип чата:', chatInfo.result?.type);
          } catch (chatError: any) {
            console.error('   ❌ Бот не может получить доступ к группе:', chatError.message);
            console.error('   ⚠️  Убедитесь, что:');
            console.error('      1. Бот добавлен в группу');
            console.error('      2. ID группы правильный:', telegramIntegration.settings.groupId);
            console.error('      3. Бот не был удален из группы');
            console.error('');
            // Не пытаемся отправлять сообщение, если нет доступа к группе
            return;
          }
          
          // Если доступ есть, пробуем отправить тестовое сообщение
          try {
            console.log('   Тестирование отправки сообщения...');
            await telegramService.sendMessage(
              telegramIntegration as any,
              '🧪 <b>Тестовое сообщение</b>\n\nИнтеграция Telegram настроена и работает!',
              telegramIntegration.settings.groupId,
              { parseMode: 'HTML' }
            );
            console.log('   ✅ Тестовое сообщение успешно отправлено в Telegram!');
          } catch (testError: any) {
            console.error('   ❌ Ошибка при тестовой отправке:', testError.message);
            if (testError.response?.data) {
              console.error('   Детали ошибки от Telegram API:', testError.response.data);
            }
            console.error('   Проверьте права бота на отправку сообщений в группе');
          }
        }
        
        console.log('');
      }
    } catch (error: any) {
      console.error('❌ Ошибка при настройке Telegram интеграции:', error.message);
      console.error('   Stack:', error.stack);
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
        const productAny = product as any; // Mongoose документы имеют _id, но TypeScript этого не знает
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${productAny._id || 'N/A'}`);
        console.log(`   SKU: ${product.sku || 'N/A'}`);
        console.log(`   Цена: ${product.price.current} ${product.price.currency || 'zł'}`);
        if (product.price.old) {
          console.log(`   Была: ${product.price.old} ${product.price.currency || 'zł'}`);
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
