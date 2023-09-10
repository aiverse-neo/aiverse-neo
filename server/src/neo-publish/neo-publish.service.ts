import { Injectable, Logger, Inject } from '@nestjs/common';
import { TransactionContext } from 'src/common/transcation-context';
import { Any, DataSource } from 'typeorm';
import Neon, { wallet, u, api, rpc } from '@cityofzion/neon-js';
import { HttpService } from '@nestjs/axios';
import { exec, fork, spawn } from 'child_process';
import { MarketPersonTemplateService } from 'src/market/service/market-person-template.service';
import { MarketPrivateModelService } from 'src/market/service/market-private-model.service';
import { PrivateModelEntity } from 'src/market/entity/private-model.entity';
import { PersonTemplateEntity } from 'src/market/entity/person-template.entity';
import { AssetsService } from 'src/assets/assets.service';

export interface PublishInfo {
  name: string;
  type: string;
  image: string;
  offLineId: string;
  info: string;
}

export interface PublishNftInfo {
  type: string;
  offLineId: string;
}

export interface MessageInfo {
  name: string;
  type: string;
  image: string;
  fileMD5: any;
  offLineId: string;
  info: string;
}

export interface SingerPublishInfo {
  message: string;
  signature: string;
}

@Injectable()
export class NeoPublishService {
  private logger = new Logger(NeoPublishService.name);

  constructor(
    private readonly datasource: DataSource,
    private readonly http: HttpService,
    private readonly marketPrivateModelService: MarketPrivateModelService,
    private readonly marketPersonTemplateService: MarketPersonTemplateService,
    private readonly assetService: AssetsService,
  ) {}

  

  async Url2MD5(url: string) {
    return new Promise((resolve, reject) => {
      const childProcess = fork('./src/neo-publish/url2MD5.js');

      childProcess.on('message', (msg) => {
        resolve(msg.toString());
      });

      childProcess.on('error', (err) => {
        this.logger.error('Url2MD5 child process error occurred: ', err);
        reject(err);
      });
      childProcess.send(url);
    });
  }

  async prePublishNft(
    offLineId: string,
    publishType: string,
    ctx?: TransactionContext,
  ): Promise<SingerPublishInfo> {
    ctx = ctx || new TransactionContext(this.datasource);
    return await ctx.run(async (em) => {

      let presetModelInfo = new PrivateModelEntity();
      let presetTempleInfo = new PersonTemplateEntity();
      let publishInfo: PublishInfo = {
        name: '',
        type: '',
        image: '',
        offLineId: '',
        info: '',
      };
      if (publishType == 'model') {
        presetModelInfo = await this.marketPrivateModelService.get(offLineId);

        const modelUrl = (
          await this.assetService.getAssetUrl(presetModelInfo.model.embedding)
        ).replace(/\\\\/g, '/');
        const imageUrl = (
          await this.assetService.getAssetUrl(
            presetModelInfo.model.inputImages[0],
          )
        ).replace(/\\\\/g, '/');
        const modelInfo = {
          modelFile: modelUrl.replace(/\\/g, '/'),
          modelType: presetModelInfo.model.type,
        };
        publishInfo = {
          name: presetModelInfo.model.token,
          type: 'model',
          image: imageUrl.replace(/\\/g, '/'),
          offLineId: offLineId,
          info: JSON.stringify(modelInfo),
        };
        
      } else {
        presetTempleInfo = await this.marketPersonTemplateService.get(
          offLineId,
        );
        publishInfo = {
          name: presetTempleInfo.preset.name,
          type: 'temple',
          image: presetTempleInfo.preset.displayImgUrl,
          offLineId: offLineId,
          info: JSON.stringify(presetTempleInfo.preset.attributes),
        };
      }

      const privateKey =
        'd208c7684a8b27014e08a27dca56c6cfa75e94b165147eef7bb3873882cf81b4';
      let fileURL = publishInfo.image;
      if (publishInfo.type == 'model') {
        console.log(JSON.parse(publishInfo.info));
        fileURL = JSON.parse(publishInfo.info).modelFile;
      }
      const md5 = await this.Url2MD5(fileURL);

      this.logger.log(`Publish Type: ${publishInfo.type}; File MD5: ${md5}`);
      const num = Math.floor(Math.random() * 100);
      const message: MessageInfo = {
        name:
          publishInfo.type +
          '#' +
          Buffer.from(publishInfo.name + num.toString()).toString('base64'),
        type: publishInfo.type,
        image: publishInfo.image,
        fileMD5: md5,
        offLineId: publishInfo.offLineId,
        info: Buffer.from(publishInfo.info.replace(/"/g, "'")).toString(
          'base64',
        ),
      };
      const keyPair = Neon.create.account(privateKey);
      // const metadataHash = new Uint8Array(
      //   sha256.array(JSON.stringify(message)),
      // );
      const signature = Neon.sign.message(
        JSON.stringify(message),
        keyPair.privateKey,
      );

      return {
        message: JSON.stringify(message),
        signature: signature,
      };
    });
  }
}
