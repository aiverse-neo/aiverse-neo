import { Test, TestingModule } from '@nestjs/testing';
import { NeoPublishService } from './neo-publish.service';

describe('NeoPublishService', () => {
  let service: NeoPublishService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeoPublishService],
    }).compile();

    service = module.get<NeoPublishService>(NeoPublishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
