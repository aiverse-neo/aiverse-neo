import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AiProductMetadataModel {
  @Field({ })
  customUsePresetId: string;
}
