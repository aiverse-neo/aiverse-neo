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
    // 模型 / 模板
    type: string;
    // 线下资源ID
    offlineId: string;
  };
}
