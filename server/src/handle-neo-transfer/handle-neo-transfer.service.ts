import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import {
  TRANSFER_CHANNEL_QUEUE,
  TransferChannelJobData,
} from './mq/neo-transfer.mq';
import { UserService } from 'src/user/user.service';
import { DataSource } from 'typeorm';
import { Job } from 'bull';
import { TransactionContext } from 'src/common/transcation-context';
import { MarketPrivateModelService } from 'src/market/service/market-private-model.service';
import { MarketPersonTemplateService } from 'src/market/service/market-person-template.service';
import { TransactionService } from '@app/transaction/service/transaction.service';

@Processor(TRANSFER_CHANNEL_QUEUE)
@Injectable()
export class HandleNeoTransferService {
  private logger = new Logger(HandleNeoTransferService.name);

  constructor(
    private readonly datasource: DataSource,
    private readonly userService: UserService,
    private readonly marketPrivateModelService: MarketPrivateModelService,
    private readonly marketPersonTemplateService: MarketPersonTemplateService,
    private readonly transactionService: TransactionService,
  ) {}

  async onModuleInit() {
  }

  @Process()
  async handleTransferJob(job: Job<TransferChannelJobData>) {
    const ctx = new TransactionContext(this.datasource);
    try {
      return await ctx.run(async (em, ctx) => {
        const { data } = job;
        await this.transactionService.runWithDataSource(async () => {
          if (data.transferload.from == 'SYSTEM') {
            if (data.transferload.type == 'model') {
              await this.marketPrivateModelService.setPublished(
                data.transferload.offlineId,
                true,
              );
            } else {
              await this.marketPersonTemplateService.setPublished(
                data.transferload.offlineId,
                true,
              );
            }
            this.logger.log(
              `Published ${data.transferload.type}, ID: ${data.transferload.offlineId}`,
            );
          }

          else {

            let user = await this.userService.getUserViaNeoAddress(
              data.transferload.to,
            );
            if (!user) {
              const id = crypto.randomUUID();
              this.logger.warn(`auto create user: ${id}`);
              user = await this.userService.createUser({
                id: id,
                userBoundNeoAccount: {
                  wallet: 'NeoLine',
                  publicKey: 'Transfer events create',
                },
              });
            }
            if (data.transferload.type == 'modle') {
              await this.marketPrivateModelService.changeOwner(
                data.transferload.offlineId,
                user.id,
              );
            } else {
              await this.marketPersonTemplateService.changeOwner(
                data.transferload.offlineId,
                user.id,
              );
            }
            this.logger.log(
              `Transfer ${data.transferload.type}, ID: ${data.transferload.offlineId}, NewOwner: ${user.id}`,
            );
          }
        });
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
}
