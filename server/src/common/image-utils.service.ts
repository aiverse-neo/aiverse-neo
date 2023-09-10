import { Injectable, Logger } from '@nestjs/common';
import sharp = require('sharp');

@Injectable()
export class ImageUtilsService {
  private readonly logger = new Logger(ImageUtilsService.name);

  async removeSDParams(image: Buffer): Promise<Buffer> {
    this.logger.verbose('remove SD params');
    return await sharp(image).rotate().toBuffer();
  }

  async detectImageType(image: Buffer) {
    const it = (await eval(
      `import('image-type')`,
    )) as typeof import('image-type');
    const result = await it.default(image);
    return result.mime;
  }

  async readImageMetadata(image: Buffer): Promise<{
    width: number;
    height: number;
  }> {
    const metadata = await sharp(image).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }
}
