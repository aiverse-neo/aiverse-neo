import { Module } from '@nestjs/common';
import { HandleNeoTransferService } from './handle-neo-transfer.service';
import { BullModule } from '@nestjs/bull';
import { UserModule } from 'src/user/user.module';
import { TRANSFER_CHANNEL_QUEUE } from './mq/neo-transfer.mq';
import { MarketModule } from 'src/market/market.module';
import { TransactionModule } from '@app/transaction';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TRANSFER_CHANNEL_QUEUE,
    }),
    UserModule,
    MarketModule,
    TransactionModule,
  ],
  providers: [HandleNeoTransferService],
})
export class HandleNeoTransferModule {}
