import { Module } from '@nestjs/common';
import { NeoPublishService } from './neo-publish.service';
import { HttpModule } from '@nestjs/axios';
import { MarketModule } from 'src/market/market.module';
import { AssetsModule } from 'src/assets/assets.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
    MarketModule,
    AssetsModule,
  ],
  providers: [NeoPublishService],
  exports: [NeoPublishService],
})
export class NeoPublishModule {}
