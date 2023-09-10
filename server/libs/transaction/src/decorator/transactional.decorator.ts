import { DataSourceAls } from '../als/datasource.als';
import { TransactionAls, TransactionState } from '../als/transaction.als';
import { Isolation } from '../enum/isolation.enum';
import { Propagation } from '../enum/propagation.enum';
import { logger } from '../logger';
import { TransactionHooksManager, generateTxId } from '../utils';

export function Transactional(opts?: {
  propagation?: Propagation;
  isolation?: Isolation;
}): MethodDecorator {
  return function (
    target: object,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await runInTransaction.bind(this)(opts, originMethod, ...args);
    };
  };
}

export async function runInTransaction(
  options: {
    propagation?: Propagation;
    isolation?: Isolation;
  },
  originMethod: PropertyDescriptor['value'],
  ...args: any[]
) {
  const { propagation = Propagation.REQUIRED, isolation } = options || {};

  const datasource = DataSourceAls.getStore()?.datasource;
  if (!datasource) {
    throw new Error('@Transaction() must run in TransactionMiddleware');
  }

  const currTx = TransactionAls.getStore();

  const hasRunner = currTx && currTx.queryRunner;
  const hasActiveTx = hasRunner && currTx.queryRunner.isTransactionActive;

  const run = async (opts: {
    newRunner: boolean;
    newTx: boolean;
    useHooks?: TransactionHooksManager;
  }): Promise<any> => {
    const { newRunner, newTx, useHooks: propagatedHooks } = opts;

    const getParent = () => {
      if (currTx) {
        return [currTx.parent, currTx.id].filter((v) => !!v).join('.');
      }
      return '';
    };
    const tx: TransactionState = newRunner
      ? {
          id: generateTxId(),
          parent: getParent(),
          isolation,
          propagation,
          queryRunner: datasource.createQueryRunner(),
          hooks: propagatedHooks ?? new TransactionHooksManager(),
        }
      : {
          id: generateTxId(),
          parent: getParent(),
          isolation,
          propagation,
          queryRunner: currTx.queryRunner,
          hooks: propagatedHooks ?? new TransactionHooksManager(),
        };

    return await TransactionAls.run(tx, async () => {
      const executeWithReplacedRepos = async () => {
        const result = await originMethod.bind(this)(...args);
        return result;
      };

      logger.verbose(
        `transactional propagation='${propagation}' isolation='${
          isolation || 'datasource default'
        }'`,
      );

      if (newRunner) {
        logger.debug(`queryRunner.connect()`);
        await tx.queryRunner.connect();
      }

      if (newTx) {
        logger.debug(`queryRunner.startTransaction(${tx.isolation || ''})`);
        await tx.queryRunner.startTransaction(tx.isolation);
        try {
          const result = await executeWithReplacedRepos();
          logger.debug(`queryRunner.commitTransaction()`);

          if (!propagatedHooks) {
            logger.verbose(`runHook('beforeCommit')`);
            await tx.hooks.runHook('beforeCommit');
          }
          await tx.queryRunner.commitTransaction();
          if (!propagatedHooks) {
            logger.verbose(`runHook('afterCommit')`);
            await tx.hooks.runHook('afterCommit');
          }
          return result;
        } catch (err) {
          logger.debug(`queryRunner.rollbackTransaction()`);

          if (!propagatedHooks) {
            logger.verbose(`runHook('beforeRollback')`);
            await tx.hooks.runHook('beforeRollback');
          }
          await tx.queryRunner.rollbackTransaction();
          if (!propagatedHooks) {
            logger.verbose(`runHook('afterRollback')`);
            await tx.hooks.runHook('afterRollback');
          }
          throw err;
        } finally {
          logger.debug(`queryRunner.release()`);
          await tx.queryRunner.release();
          if (!propagatedHooks) {
            logger.verbose(`runHook('onComplete')`);
            await tx.hooks.runHook('onComplete');
          }
        }
      } else {
        return await executeWithReplacedRepos();
      }
    });
  };

  switch (propagation) {
    case Propagation.REQUIRED: {
      // 如果当前存在事务，则使用当前事务，否则创建新事务。
      // 1.使用新连接，创建事务
      // 2.使用已有连接，创建事务
      // 3.使用已有链接，使用已有事务
      return await run({
        newRunner: !hasRunner,
        newTx: !hasActiveTx,
        useHooks: hasActiveTx ? currTx.hooks : undefined,
      });
    }
    case Propagation.SUPPORTS: {
      // 如果当前存在事务，则使用当前事务，否则不使用事务。
      // 1. 使用新连接
      // 2. 使用已有连接
      return await run({
        newRunner: !hasRunner,
        newTx: false,
        useHooks: currTx?.hooks,
      });
    }
    case Propagation.MANDATORY: {
      // 如果当前存在事务，则使用当前事务，否则抛出异常。
      // 1. 抛出异常(无连接、无事务)
      // 2. 使用已有连接

      if (!hasActiveTx) {
        throw new Error('MANDATORY transaction required');
      }
      return await run({
        newRunner: false,
        newTx: false,
        useHooks: currTx?.hooks,
      });
    }
    case Propagation.REQUIRES_NEW: {
      // 创建新事务，如果当前存在事务，则挂起当前事务。
      // 1. 使用新连接，创建事务
      return await run({
        newRunner: true,
        newTx: true,
        useHooks: undefined,
      });
    }

    case Propagation.NOT_SUPPORTED: {
      // 不使用事务，如果当前存在事务，则挂起当前事务。
      // 1. 使用新连接
      return await run({ newRunner: true, newTx: false });
    }

    case Propagation.NEVER: {
      // 不使用事务，如果当前存在事务，则抛出异常。
      // 1. 抛出异常(有事务)

      if (hasActiveTx) {
        throw new Error('NEVER required no transaction');
      }
      return await run({ newRunner: !hasRunner, newTx: false });
    }

    case Propagation.NESTED: {
      // 如果当前存在事务，则创建嵌套事务，否则创建新事务。
      // 1. 使用新连接，创建事务
      // 2. 使用已有连接，创建事务

      return await run({
        newRunner: !hasRunner,
        newTx: true,
        useHooks: hasActiveTx ? currTx?.hooks : undefined,
      });
    }

    default:
      throw new Error(`unknown propagation: ${propagation}`);
  }
}
