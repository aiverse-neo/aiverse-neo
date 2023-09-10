import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProduct } from './entity/ai-product.entity';
import { AiProductOutput } from './entity/ai-product-output.entity';
import { AiProductOutputDetails } from './entity/ai-product-output-details.entity';
import { AiProductController } from './ai-product.controller';
import { AiProductSettingsService } from './settings/ai-product.settings';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProduct,
      AiProductOutput,
      AiProductOutputDetails,
    ]),

    SettingsModule,
  ],
  providers: [
    AiProductSettingsService,
  ],
  controllers: [AiProductController],
})
export class AiProductModule {}
