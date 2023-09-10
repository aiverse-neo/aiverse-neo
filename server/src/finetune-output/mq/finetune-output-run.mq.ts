import { GenerateParamsDTO } from 'src/presets/dto/generate-params.dto';
// import { ControlNetUnitDTO } from '../dto/control-net-unit.dto';

export const FINETUNE_OUTPUT_RUN_MQ = 'finetune-output:run';


export type FinetuneOutputRunPayload = {

  kind: 'finetune-output';
  id: string;

  // model?: string;
  // prompt: string;
  // // num_outputs
  // numOutputs: number;
  // height: number;
  // width: number;
  // // num_inference_steps
  // numInferenceSteps: number;
  // // cfg_scale
  // cfgScale: number;
  // // negative_prompt
  // negativePrompt: string;
  // // seed
  // seed: number;

  // // 指定时使用图生图
  // initImage?: string;

  // denoisingStrength?: number;
  // samplerName?: string;
  // alwaysonScripts?: {
  //   controlNetUnits?: ControlNetUnitDTO[];
  // };
  params: GenerateParamsDTO;
};
