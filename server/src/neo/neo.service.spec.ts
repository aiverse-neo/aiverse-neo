import { Test, TestingModule } from '@nestjs/testing';
import { NeoService } from './neo.service';

describe('NeoService', () => {
  let service: NeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeoService],
    }).compile();

    service = module.get<NeoService>(NeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
