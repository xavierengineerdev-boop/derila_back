import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { IntegrationsService } from './modules/integrations/integrations.service';
import { TelegramService } from './modules/integrations/services/telegram.service';
import { IntegrationType } from './modules/integrations/schemas/integration.schema';

async function checkTelegram() {
  const app = await NestFactory.create(AppModule);
  const integrationsService = app.get(IntegrationsService);
  const telegramService = app.get(TelegramService);

  try {
    console.log('🔍 Проверка настроек Telegram интеграции...\n');

    const telegramIntegrations = await integrationsService.findActiveByType(IntegrationType.TELEGRAM);
    
    if (telegramIntegrations.length === 0) {
      console.error('❌ Нет активных интеграций Telegram!');
      console.error('\nДля создания интеграции нужно:');
      console.error('1. Запустить seed скрипт: npm run seed');
      console.error('2. Или создать через API: POST /api/integrations');
      console.error('3. Убедиться, что в .env есть:');
      console.error('   - TELEGRAM_BOT_TOKEN=ваш_токен_бота');
      console.error('   - TELEGRAM_GROUP_ID=ваш_chat_id');
      return;
    }

    console.log(`✅ Найдено активных интеграций: ${telegramIntegrations.length}\n`);

    for (const integration of telegramIntegrations) {
      console.log('📱 Интеграция:', integration.name);
      console.log('   ID:', (integration as any)._id || (integration as any).id);
      console.log('   Статус:', integration.status);
      console.log('   isActive:', integration.isActive);
      console.log('   Bot Token:', integration.botToken ? '✅ Настроен' : '❌ Не настроен');
      console.log('   Token:', integration.token ? '✅ Настроен' : '❌ Не настроен');
      console.log('   Group ID:', integration.settings?.groupId || '❌ Не настроен');
      console.log('   Последняя ошибка:', integration.lastError || 'Нет');
      console.log('   Использований:', integration.usageCount || 0);
      console.log('   Последнее использование:', integration.lastUsedAt || 'Никогда');
      
      if (integration.botToken || integration.token) {
        try {
          console.log('\n   Тестирование бота...');
          const botInfo = await telegramService.getBotInfo(integration as any);
          console.log('   ✅ Бот работает!');
          console.log('   Имя бота:', botInfo.result?.first_name);
          console.log('   Username:', botInfo.result?.username);
        } catch (e: any) {
          console.error('   ❌ Ошибка при проверке бота:', e.message);
        }
      }
      
      console.log('\n');
    }

    console.log('✅ Проверка завершена!');
  } catch (error: any) {
    console.error('❌ Ошибка при проверке:', error.message);
  } finally {
    await app.close();
  }
}

checkTelegram();

