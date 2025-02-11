import knex, {Knex} from "knex";

import {DatabaseConfig, QueryResult} from "@lib/QDataBase/types";
import {DBException} from "@lib/QDataBase/DBException";

export class QDB {
  private db: Knex;
  private isConnected: boolean = false;

  constructor(config?: Partial<DatabaseConfig>) {
    const defaultConfig: DatabaseConfig = {
      user: "sa",
      password: "0936284791",
      server: "localhost",
      database: "Lottery",
    };

    const mergedConfig = {
      ...defaultConfig,
      ...config,
    };

    this.db = knex({
      client: "mssql",
      connection: {
        user: mergedConfig.user,
        password: mergedConfig.password,
        server: mergedConfig.server,
        database: mergedConfig.database,
        options: mergedConfig.options,
      },
      pool: mergedConfig.pool,
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.db.raw("SELECT 1");
        this.isConnected = true;
      } catch (error) {
        throw new DBException("Failed to establish database connection", error);
      }
    }
  }

  // 修改後的 query 方法
  async query<T extends Record<string, any>>(
    queryString: string,
    params: readonly any[] = []
  ): Promise<QueryResult<T[]>> {
    try {
      await this.ensureConnection();
      const result = await this.db.raw<T[]>(queryString, params);
      const data = Array.isArray(result) ? result : result[0];

      return {
        success: true,
        data: data as T[],
      };
    } catch (error) {
      console.error("Query error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // 插入資料
  async insert<T extends Record<string, any>>(
    tableName: string,
    data: Partial<T>
  ): Promise<QueryResult<T>> {
    try {
      await this.ensureConnection();
      const result = await this.db(tableName).insert(data).returning("*");

      return {
        success: true,
        data: (Array.isArray(result) ? result[0] : result) as T,
      };
    } catch (error) {
      console.error("Insert error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // 更新資料
  async update<T extends Record<string, any>>(
    tableName: string,
    where: Partial<T>,
    data: Partial<T>
  ): Promise<QueryResult<T>> {
    try {
      await this.ensureConnection();
      const result = await this.db(tableName)
        .where(where)
        .update(data)
        .returning("*");

      return {
        success: true,
        data: (Array.isArray(result) ? result[0] : result) as T,
      };
    } catch (error) {
      console.error("Update error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // 刪除資料
  async delete<T extends Record<string, any>>(
    tableName: string,
    where: Partial<T>
  ): Promise<QueryResult<number>> {
    try {
      await this.ensureConnection();
      const count = await this.db(tableName).where(where).del();

      return {
        success: true,
        data: count,
      };
    } catch (error) {
      console.error("Delete error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // 交易處理
  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<QueryResult<T>> {
    try {
      await this.ensureConnection();
      const result = await this.db.transaction(callback);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Transaction error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.db.destroy();
      this.isConnected = false;
    } catch (error) {
      throw new DBException("Failed to close database connection", error);
    }
  }
}
