export const TRANSFER_CHANNEL_QUEUE = 'aiverse:transfer:channel';
export type TransferChannelJobData = NeoTransferJobData;

interface NeoTransferJobData {
  channel: 'neo';
  type: 'transfer';
  transferload: {
    from: string;
    to: string;
    tokenId: string;
    txHash: string;
    type: string;
    offlineId: string;
  };
}
