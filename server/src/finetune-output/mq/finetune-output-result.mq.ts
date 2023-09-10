export const FINETUNE_OUTPUT_RESULT_MQ = 'finetune-output:result';

export type FinetuneOutputResultPayload =
  | FinetuneOutputResultFinishedPayload
  | FinetuneOutputResultFailedPayload
  | FinetuneOutputResultProgressPayload;

export type FinetuneOutputResultFinishedPayload = {
  type: 'finished';
  kind: 'finetune-output';
  // 生成任务的ID
  id: string;
  // rawResult: any;
  // // 成功完成finetune时，以下字段存在
  // outputResult: {
  //   images: string[]; // 结果图片url
  // };
  result: {
    images: string[];
  };
};

export type FinetuneOutputResultFailedPayload = {
  type: 'failed';
  kind: 'finetune-output';
  // 生成任务的ID
  id: string;
  // rawResult: any; // 第三方服务原始结果
  error: string;
};

export type FinetuneOutputResultProgressPayload = {
  type: 'progress';
  kind: 'finetune-output';
  // 生成任务的ID
  id: string;
  progress: number;
};
