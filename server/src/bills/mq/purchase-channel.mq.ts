import { NeoPurchasedJobData } from '../neo-purchase/dto/neo-purchase-job-data.dto';

export const PURCHASE_CHANNEL_QUEUE = 'aigc:pruchase:channel';

export type ChannelPurchasedJobData =
  | NeoPurchasedJobData

