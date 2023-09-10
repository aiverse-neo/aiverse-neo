import { Test, TestingModule } from '@nestjs/testing';
import { NeoChannelService } from './neo-channel.service';

describe('NeoChannelService', () => {
  let service: NeoChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeoChannelService],
    }).compile();

    service = module.get<NeoChannelService>(NeoChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
