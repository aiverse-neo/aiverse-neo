import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Neon from '@cityofzion/neon-js';
import {
  PurchaseChannelJobData,
  PURCHASE_CHANNEL_QUEUE,
} from './mq/purchase-channel.mq';
import { TransactionContext } from 'src/common/transcation-context';
import { NeoNep17Transfer } from './entity/neo-nep17-transfer.entity';

@Injectable()
export class NeoChannelService {
  private logger = new Logger(NeoChannelService.name);
  constructor(
    private readonly datasource: DataSource,
    private readonly configService: ConfigService,
    @InjectQueue(PURCHASE_CHANNEL_QUEUE)
    private channelQueue: Queue<PurchaseChannelJobData>,
  ) {}

  async onModuleInit() {
    this.loopSync().catch((err) => {
      this.logger.error('failed to sync purchase', err);
    });
  }

  private async loopSync() {
    const LOOP_INTERVAL = +this.configService.get('NEO_SYNC_LOOP_INTERVAL'); // seconds
    const ASSET_HASH = this.configService.get('NEO_ASSET_HASH');

    const DEFAULT_START_TIMESTAMP = +this.configService.get(
      'NEO_SYNC_START_TIMESTAMP',
    );
    const NEO_RPC_URL = this.configService.get('NEO_RPC_URL');
    const NEO_RECV_ADDRESS = this.configService.get('NEO_RECV_ADDRESS');


    const rpc = Neon.create.rpcClient(NEO_RPC_URL);
    this.logger.log(`ASSET=${ASSET_HASH}`);
    while (true) {
      try {
        const ctx = new TransactionContext(this.datasource);
        await ctx.run(async (em, ctx) => {
          const repo = em.getRepository(NeoNep17Transfer);

          const latestTransfer = await repo.findOne({
            where: { asset: ASSET_HASH },
            lock: { mode: 'pessimistic_write' },
            order: {
              timestamp: 'DESC',
            },
          });
          const startTime = latestTransfer
            ? Math.floor(latestTransfer.timestamp.valueOf()) - 1000
            : DEFAULT_START_TIMESTAMP;
          const endTime = new Date().valueOf();

          this.logger.debug(`fetch (${startTime} => ${endTime})`);
          const result: Nep17TransfersQueryResult = await rpc.getNep17Transfers(
            NEO_RECV_ADDRESS,
            startTime.toString(),
            endTime.toString(),
          );

          const transfers = this.prepareTransfers(result, ASSET_HASH);

          for (const transfer of transfers) {
            const existedTransfer = await repo.exist({
              where: {
                blockIndex: transfer.blockIndex,
                tx: transfer.tx,
                transferNotifyIndex: transfer.transferNotifyIndex,
              },
            });
            if (!existedTransfer) {
              await this.handlePurchase(transfer);
              await repo.save({
                ...transfer,
                from: transfer.from || '',
                timestamp: new Date(transfer.timestamp),
              });
            }
          }
        });
      } catch (err) {
        this.logger.error('sync failed, try next loop', err);
      }

      await new Promise((res) => setTimeout(res, LOOP_INTERVAL * 1000));
    }
  }

  private prepareTransfers(
    data: Nep17TransfersQueryResult,
    targetAsset: string,
  ) {
    const {
      address,
      // sent,
      received,
    } = data;
    const transfers: Transfer[] = [];

  

    received.forEach((t) =>
      transfers.push({
        tx: t.txhash,
        asset: t.assethash,
        to: address,
        from: t.transferaddress,
        transferNotifyIndex: t.transfernotifyindex,
        blockIndex: t.blockindex,
        amount: t.amount,
        timestamp: t.timestamp,
      }),
    );


    transfers.sort((a, b) => a.timestamp - b.timestamp);


    return transfers.filter((t) => t.asset === targetAsset);
  }

  private async handlePurchase(transfer: Transfer) {
    if (!transfer.from) {
      this.logger.warn(
        `INVALID FROM: FROM=${transfer.from} AMOUNT=${transfer.amount} BLK=${transfer.blockIndex} TX=${transfer.tx}`,
      );
      return;
    }

    this.logger.log(
      `PURCHASE: FROM=${transfer.from} AMOUNT=${transfer.amount} BLK=${transfer.blockIndex} TX=${transfer.tx}`,
    );
    const orderId = `${transfer.blockIndex}:${transfer.tx}:${transfer.transferNotifyIndex}`;
    await this.channelQueue.add(
      {
        channel: 'neo',
        type: 'purchased',
        payload: {
          address: transfer.from,
          orderId,
          amount: transfer.amount,
          txHash: transfer.tx,
        },
      },
      {
        jobId: 'neo:' + orderId,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 10 * 1000,
        },
        removeOnComplete: true,
      },
    );
  }
}

type Nep17TransfersQueryResult = {
  address: string;
  sent: {
    timestamp: number; // ms
    assethash: string;
    transferaddress: string;
    amount: string;
    blockindex: number;
    transfernotifyindex: number;
    txhash: string;
  }[];
  received: {
    timestamp: number; // ms
    assethash: string;
    transferaddress: string | null;
    amount: string;
    blockindex: number;
    transfernotifyindex: number;
    txhash: string;
  }[];
};

type Transfer = {
  tx: string;
  asset: string;
  from: string;
  to: string;
  transferNotifyIndex: number;
  blockIndex: number;
  amount: string;
  timestamp: number;
};
