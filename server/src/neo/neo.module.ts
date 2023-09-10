import { Module } from '@nestjs/common';
import { NeoService } from './neo.service';

@Module({
  providers: [NeoService],
  exports: [NeoService],
})
export class NeoModule {}
