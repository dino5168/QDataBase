import {Knex} from "knex";
import {QueryResult} from "@lib/QDataBase/types";

export interface IQDB {
  query<T extends Record<string, any>>(
    queryString: string,
    params?: readonly any[]
  ): Promise<QueryResult<T[]>>;

  insert<T extends Record<string, any>>(
    tableName: string,
    data: Partial<T>
  ): Promise<QueryResult<T>>;

  update<T extends Record<string, any>>(
    tableName: string,
    where: Partial<T>,
    data: Partial<T>
  ): Promise<QueryResult<T>>;

  delete<T extends Record<string, any>>(
    tableName: string,
    where: Partial<T>
  ): Promise<QueryResult<number>>;

  transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<QueryResult<T>>;

  disconnect(): Promise<void>;
}
