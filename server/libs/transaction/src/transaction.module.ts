import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TransactionService } from './service/transaction.service';
import { HttpAdapterHost } from '@nestjs/core';
import { TransactionMiddleware } from './middleware/transaction.middleware';

// 用法: service使用@TransactionContext()装饰，method使用@Transactional()装饰，module入引TransactionModule
//
@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule implements NestModule {
  constructor(private readonly adapterHost: HttpAdapterHost) {}
  configure(consumer: MiddlewareConsumer) {
    const adapter = this.adapterHost.httpAdapter;
    let mountPoint = '*';
    if (adapter.constructor.name === 'FastifyAdapter') {
      mountPoint = '(.*)';
    }
    consumer.apply(TransactionMiddleware).forRoutes(mountPoint);
  }
}
