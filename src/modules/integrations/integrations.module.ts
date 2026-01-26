import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { Integration, IntegrationSchema } from './schemas/integration.schema';
import { TelegramService } from './services/telegram.service';
import { FacebookService } from './services/facebook.service';
import { KeytaroService } from './services/keytaro.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, TelegramService, FacebookService, KeytaroService],
  exports: [IntegrationsService, TelegramService, FacebookService, KeytaroService],
})
export class IntegrationsModule {}

