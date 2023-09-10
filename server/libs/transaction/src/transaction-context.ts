// import { DataSource, QueryRunner } from 'typeorm';
// import { Propagation } from './enum/propagation.enum';
// import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

// type TxId = string;
// type Isolation = IsolationLevel;

// //

// // handle propagation of transaction
// // 内部以树列表记录执行的transaction。

// interface Tx {
//   id: TxId;
//   nestTxs: Tx[];
// }

// /**
//  * - Tx1
//  *  - Tx11
//  *  - Tx12
//  *    - Tx121
//  * - Tx2
//  *  - Tx21
//  */
// export class TransactionContext {
//   static async create(datasource: DataSource): Promise<TransactionContext> {
//     return new TransactionContext(datasource);
//   }
//   private txs: Record<TxId, Tx> = {};
//   private tree: Tx[] = [];

//   private constructor(readonly datasource: DataSource) {}

//   async handlePropagation(
//     propagation: Propagation,
//     isolation: Isolation,
//     work: () => Promise<any>,
//   ): Promise<TxId> {
//     const tx: Tx = {
//       id: this.generateId(),
//       nestTxs: [],
//     };

//     this.txs[tx.id] = tx;

//     switch (propagation) {
//       case Propagation.REQUIRED: {
//         // 如果当前存在事务，则使用当前事务，否则创建新事务。
//         break;
//       }
//       case Propagation.SUPPORTS: {
//         // 如果当前存在事务，则使用当前事务，否则不使用事务。
//         break;
//       }
//       case Propagation.MANDATORY: {
//         // 如果当前存在事务，则使用当前事务，否则抛出异常。
//         break;
//       }
//       case Propagation.REQUIRED_NEW: {
//         // 创建新事务，如果当前存在事务，则挂起当前事务。
//         break;
//       }
//       case Propagation.NOT_SUPPORTED: {
//         // 不使用事务，如果当前存在事务，则挂起当前事务。
//         break;
//       }
//       case Propagation.NEVER: {
//         // 不使用事务，如果当前存在事务，则抛出异常。
//         break;
//       }
//       case Propagation.NESTED: {
//         // 如果当前存在事务，则创建嵌套事务，否则创建新事务。
//         break;
//       }
//     }

//     return tx.id;
//   }

//   // 当前Tx如何判断？会存在Promise.all的情况,无法保证顺序。
//   // 每个事务都采用单独一个als来记录。每一层只通过父级状态决定自己的状态。
//   // RootAls => 提供数据库信息
//   // - Tx1Als
//   //  - Tx11Als
//   //  - Tx12Als
//   // - Tx2Als
//   private currentTx() {}

//   private generateId(): TxId {
//     return Math.random().toString(36).slice(2, 9);
//   }
// }
