import { Test, TestingModule } from '@nestjs/testing';
import { HandleNeoTransferService } from './handle-neo-transfer.service';

describe('HandleNeoTransferService', () => {
  let service: HandleNeoTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HandleNeoTransferService],
    }).compile();

    service = module.get<HandleNeoTransferService>(HandleNeoTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
