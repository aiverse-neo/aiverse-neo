export interface NeoPurchasedJobData {
  channel: 'neo';
  type: 'purchased';
  payload: {
    address: string;
    amount: string;
    orderId: string;
    txHash: string;
  };
}
