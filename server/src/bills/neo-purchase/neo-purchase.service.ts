import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { PriceLevel } from '../dto/price-level.dto';
import { PurchaseChannelId } from '../enum/PurchaseChannelId.enum';
import { PurchaseChannel } from '../interface/purchase-channel.interface';
import { NeoPurchaseChannelInfo } from './dto/neo-purchase-channel-info.dto';
import { NeoPurchasedJobData } from './dto/neo-purchase-job-data.dto';
import { BigNumber } from 'ethers';

@Injectable()
export class NeoPurchaseService
  implements PurchaseChannel<NeoPurchaseChannelInfo, NeoPurchasedJobData>
{
  private readonly logger = new Logger(NeoPurchaseService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  id() {
    return PurchaseChannelId.NEO;
  }
  async queryPointsPrice(): Promise<PriceLevel[]> {
    return [
      { price: 2.5, points: 80, tempPoints: 0 },
      { price: 5, points: 300, tempPoints: 0 },
      { price: 15, points: 1000, tempPoints: 200 },
      { price: 25, points: 2000, tempPoints: 500 },
    ];
  }

  async getChannelInfo(): Promise<NeoPurchaseChannelInfo> {
    const receiver = this.configService.get('BILL_NEO_PAYMENT_ADDRESS');
    return {
      receiver,
    };
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get('BILL_NEO_CHANNEL_ENABLED') === 'true';
  }

  async judgeUid(data: NeoPurchasedJobData): Promise<string> {
    const user = await this.userService.getUserViaNeoAddress(
      data.payload.address,
    );
    if (!user) {
      throw new Error(`unknown neo address: ${data.payload.address}`);
    }
    return user.id;
  }

  async convertUnit(data: NeoPurchasedJobData): Promise<number> {
    const {
      payload: { amount },
    } = data;
    const decimals = +this.configService.get('BILL_NEO_FT_DECIMALS');
    let value = 0;
    if (decimals > 8) {
      value =
        parseFloat(
          BigNumber.from(amount)
            .div(BigNumber.from('10').pow(decimals - 5))
            .toString(),
        ) / 1e5;
    } else {
      value = parseFloat(amount) / +BigNumber.from(10).pow(decimals).toString();
    }
    return value;
  }
}
