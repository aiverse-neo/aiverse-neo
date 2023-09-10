import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FinetuneOutputSize {
  @Field(() => Int)
  width: number;
  @Field(() => Int)
  height: number;
}
