import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { NeoPurchaseService } from './neo-purchase.service';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [NeoPurchaseService],
  exports: [NeoPurchaseService],
})
export class NeoPurchaseModule {}
