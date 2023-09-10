import { Global, Module } from '@nestjs/common';
import { ImageUtilsService } from './image-utils.service';

@Global()
@Module({
  providers: [ImageUtilsService],
  exports: [ImageUtilsService],
})
export class CommonModule {}
