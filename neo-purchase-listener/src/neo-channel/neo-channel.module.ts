import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeoNep17Transfer } from './entity/neo-nep17-transfer.entity';
import { PURCHASE_CHANNEL_QUEUE } from './mq/purchase-channel.mq';
import { NeoChannelService } from './neo-channel.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NeoNep17Transfer]),
    BullModule.registerQueue({
      name: PURCHASE_CHANNEL_QUEUE,
    }),
  ],
  providers: [NeoChannelService],
})
export class NeoChannelModule {}
