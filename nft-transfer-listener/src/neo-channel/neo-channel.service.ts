import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
// import { HttpService } from '@nestjs/axios';
import Neon, { sc, rpc, api, u, wallet } from '@cityofzion/neon-js';
import {
  TransferChannelJobData,
  TRANSFER_CHANNEL_QUEUE,
} from './mq/transfer-channel.mq';
import { TransactionContext } from 'src/common/transcation-context';
import { NeoNep11Transfer } from './entity/neo-nep11-transfer.entity';

@Injectable()
export class NeoChannelService {
  private logger = new Logger(NeoChannelService.name);
  constructor(
    private readonly datasource: DataSource,
    // private readonly http: HttpService,
    private readonly configService: ConfigService,
    @InjectQueue(TRANSFER_CHANNEL_QUEUE)
    private channelQueue: Queue<TransferChannelJobData>,
  ) {}

  async onModuleInit() {
    this.loopSync().catch((err) => {
      this.logger.error('failed to sync transfer', err);
    });
    // const NEO_RPC_URL = this.configService.get('NEO_RPC_URL');
    // const ASSET_HASH = this.configService.get('NEO_ASSET_HASH');
    // const rpc = Neon.create.rpcClient(NEO_RPC_URL);
    // const stringTokenId = u.hexstring2str('3135323454455354');
    // console.log(`解析tokenId:  ${stringTokenId}`);
    // const tokenIdParam = sc.ContractParam.string(stringTokenId);
    // const nftMetadata = (
    //   await rpc.invokeFunction(ASSET_HASH, 'properties', [tokenIdParam])
    // ).stack[0].value;
    // let type = '';
    // let offLineId = '';
    // for (let i = 0; i < 6; i++) {
    //   const metadataKey = nftMetadata[i].key['value'];
    //   if (metadataKey == 'dHlwZQ==') {
    //     console.log('这是type');
    //     type = nftMetadata[i].value['value'];
    //     console.log(u.base642utf8(type));
    //   }
    //   if (metadataKey == 'b2ZmTGluZUlk') {
    //     console.log('这是offLineId');
    //     offLineId = nftMetadata[i].value['value'];
    //     console.log(u.base642utf8(offLineId));
    //   }
    // }
  }

  private async loopSync() {
    const LOOP_INTERVAL = +this.configService.get('NEO_SYNC_LOOP_INTERVAL');
    const ASSET_HASH = this.configService.get('NEO_ASSET_HASH');

    let DEFAULT_START_BLOCKCOUNT = +this.configService.get(
      'NEO_SYNC_START_BLOCKCOUNT',
    );
    const NEO_RPC_URL = this.configService.get('NEO_RPC_URL');

  
    const rpc = Neon.create.rpcClient(NEO_RPC_URL);
    this.logger.log(`ASSET=${ASSET_HASH}`);
    while (true) {
      try {
        const ctx = new TransactionContext(this.datasource);
        await ctx.run(async (em, ctx) => {

          const nowBlockCount = await rpc.getBlockCount();

          const repo = em.getRepository(NeoNep11Transfer);
          const latestBlockInfo = await repo.find({
            order: {
              createTime: 'DESC',
            },
          });
          if (latestBlockInfo.length > 0) {
            if (DEFAULT_START_BLOCKCOUNT < latestBlockInfo[0].index) {
              DEFAULT_START_BLOCKCOUNT = latestBlockInfo[0].index;
            }
          }

          if (nowBlockCount > DEFAULT_START_BLOCKCOUNT) {
            this.logger.log(
              `StartBlock: ${DEFAULT_START_BLOCKCOUNT}, EndBlock: ${nowBlockCount}`,
            );
            await this.processBlockInfo(
              DEFAULT_START_BLOCKCOUNT,
              nowBlockCount,
            );
            DEFAULT_START_BLOCKCOUNT = nowBlockCount - 1;
          }
        });
      } catch (err) {
        this.logger.error('sync failed, try next loop', err);
      }
      await new Promise((res) => setTimeout(res, LOOP_INTERVAL * 1000));
    }
  }

  private async processBlockInfo(startIndex: number, endIndex: number) {
    const NEO_RPC_URL = this.configService.get('NEO_RPC_URL');
    const ASSET_HASH = this.configService.get('NEO_ASSET_HASH');
    // const LOOP_INTERVAL = +this.configService.get('NEO_SYNC_LOOP_INTERVAL');
    const rpc = Neon.create.rpcClient(NEO_RPC_URL);
    const ctx = new TransactionContext(this.datasource);
    await ctx.run(async (em, ctx) => {
      for (let i = startIndex + 1; i <= endIndex - 1; i++) {
        try {
          const blockInfo = await rpc.getBlock(i, 1);
          if (JSON.parse(JSON.stringify(blockInfo)).tx.length == 0) {
            continue;
          }
          const txInfo = await rpc.getApplicationLog(
            JSON.parse(JSON.stringify(blockInfo)).tx[0].hash,
          );
          const txInfoEvent = JSON.parse(JSON.stringify(txInfo)).executions[0];
          if (txInfoEvent.notifications[0].contract != ASSET_HASH) {
            continue;
          }
          if (txInfoEvent.notifications[0].eventname != 'Transfer') {
            continue;
          }
          const repo = em.getRepository(NeoNep11Transfer);
          if (await repo.exist({ where: { index: i } })) {
            continue;
          }
          this.logger.log(
            `Our contract nft transfer event, txHash: ${
              JSON.parse(JSON.stringify(blockInfo)).tx[0].hash
            }`,
          );
          let newOwnerN3Address = '';
          let oldOwnerN3Address = '';
          if (txInfoEvent.notifications[0].state.value[0].type == 'Any') {
            newOwnerN3Address = this.toN3Address(
              txInfoEvent.notifications[0].state.value[1].value,
            );
            oldOwnerN3Address = 'SYSTEM';
          } else {
            newOwnerN3Address = this.toN3Address(
              txInfoEvent.notifications[0].state.value[1].value,
            );
            oldOwnerN3Address = this.toN3Address(
              txInfoEvent.notifications[0].state.value[0].value,
            );
          }
          const tokenId = u.HexString.fromBase64(
            txInfoEvent.notifications[0].state.value[3].value,
          );
          const stringTokenId = u.hexstring2str(tokenId.toString());

          const tokenIdParam = sc.ContractParam.string(stringTokenId);
          const nftMetadata = (
            await rpc.invokeFunction(ASSET_HASH, 'properties', [tokenIdParam])
          ).stack[0].value;
          let type = '';
          let offLineId = '';
          for (let i = 0; i < 6; i++) {
            const metadataKey = nftMetadata[i].key['value'];
            if (metadataKey == 'dHlwZQ==') {
              type = nftMetadata[i].value['value'];
              type = u.base642utf8(type);
            }
            if (metadataKey == 'b2ZmTGluZUlk') {
              offLineId = nftMetadata[i].value['value'];
              offLineId = u.base642utf8(offLineId);
            }
          }
          await this.creatTransfer(
            i,
            JSON.parse(JSON.stringify(blockInfo)).hash,
            JSON.parse(JSON.stringify(blockInfo)).tx[0].hash,
            JSON.parse(JSON.stringify(blockInfo)).time.toString(),
            newOwnerN3Address,
            oldOwnerN3Address,
            tokenId.toString(),
          );
          await this.addBullJob(
            oldOwnerN3Address,
            newOwnerN3Address,
            tokenId.toString(),
            JSON.parse(JSON.stringify(blockInfo)).tx[0].hash,
            type,
            offLineId,
          );
        } catch (err) {
          this.logger.error('sync failed, try next loop', err);
        }
      }
    });
  }

  async creatTransfer(
    index: number,
    blockHash: string,
    txHash: string,
    time: string,
    newOwner: string,
    oldOwner: string,
    nftTokenId: string,
    ctx?: TransactionContext,
  ): Promise<NeoNep11Transfer> {
    ctx = ctx || new TransactionContext(this.datasource);
    return await ctx.run(async (em, ctx) => {
      const repo = em.getRepository(NeoNep11Transfer);
      const creatRepo = repo.create({
        index: index,
        blockHash: blockHash,
        txHash: txHash,
        time: time,
        newOwner: newOwner,
        oldOwner: oldOwner,
        nftTokenId: nftTokenId,
      });
      const creattransferinfo = await repo.save(creatRepo);
      return creattransferinfo;
    });
  }

  private toN3Address(str: string) {
    const n3ScriptHash = u.HexString.fromBase64(str, true);
    const N3Address = wallet.getAddressFromScriptHash(n3ScriptHash.toString());
    return N3Address;
  }

  private async addBullJob(
    from: string,
    to: string,
    tokenId: string,
    txHash: string,
    type: string,
    offLineId: string,
  ) {
    try {
      const job = await this.channelQueue.add(
        {
          channel: 'neo',
          type: 'transfer',
          transferload: {
            from: from,
            to: to,
            tokenId: tokenId,
            txHash: txHash,
            type: type,
            offlineId: offLineId,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 10 * 1000,
          },
          removeOnComplete: true,
        },
      );
      this.logger.debug(`Neo transfer job id: ${job.id.toString()}`);
    } catch (err) {
      this.logger.error(
        `add Neo transfer job error. Transfer.txHash: ${txHash}`,
      );
      this.logger.error(err);
    }
  }
}
