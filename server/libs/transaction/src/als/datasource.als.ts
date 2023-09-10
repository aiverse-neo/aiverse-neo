import { AsyncLocalStorage } from 'async_hooks';
import { DataSource } from 'typeorm';

// 管理datasource实例、记录tx树 (能让tx找到自己的root tx，用于挂hooks)
export interface DataSourceState {
  datasource: DataSource;
}

export const DataSourceAls = new AsyncLocalStorage<DataSourceState>();
