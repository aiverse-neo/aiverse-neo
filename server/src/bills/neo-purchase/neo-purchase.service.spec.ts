import { Test, TestingModule } from '@nestjs/testing';
import { NeoPurchaseService } from './neo-purchase.service';

describe('NeoPurchaseService', () => {
  let service: NeoPurchaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeoPurchaseService],
    }).compile();

    service = module.get<NeoPurchaseService>(NeoPurchaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
