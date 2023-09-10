import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeoNep11Transfer } from './entity/neo-nep11-transfer.entity';
import { TRANSFER_CHANNEL_QUEUE } from './mq/transfer-channel.mq';
import { NeoChannelService } from './neo-channel.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
    ConfigModule,
    TypeOrmModule.forFeature([NeoNep11Transfer]),
    BullModule.registerQueue({
      name: TRANSFER_CHANNEL_QUEUE,
    }),
  ],
  providers: [NeoChannelService],
})
export class NeoChannelModule {}
