import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Size')
export class SizeModel {
  @Field(() => Int)
  width: number;
  @Field(() => Int)
  height: number;
}

export class UnkownSizeModel extends SizeModel {
  width = -1;
  height = -1;
}
