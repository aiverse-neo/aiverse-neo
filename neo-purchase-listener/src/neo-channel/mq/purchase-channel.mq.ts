export const PURCHASE_CHANNEL_QUEUE = 'aigc:pruchase:channel';
export type PurchaseChannelJobData = NeoPurchasedJobData;

interface NeoPurchasedJobData {
  channel: 'neo';
  type: 'purchased';
  payload: {
    address: string;
    amount: string;
    orderId: string;
    txHash: string;
  };
}
