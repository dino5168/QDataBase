//資料庫查詢服務
//Promise<T> 表示這個函式是 非同步 (async)
import {SQLMapping} from "@config/SQLMapping";
import type {IQDB} from "@lib/QDataBase/IQDB";
export class QueryService {
  constructor(private db: IQDB, private sqlMapping: SQLMapping) {}
  async Query(sqlNote: string): Promise<Record<string, any>> {
    try {
      const sqlString = this.sqlMapping.get(sqlNote);
      if (!sqlString) {
        throw new Error(`SQL Note: "${sqlNote}" not found in mapping`);
      }
      return await this.db.query(sqlString);
    } catch (error) {
      console.error(
        `Database query error: ${sqlNote}, Error: ${(error as Error).message}`
      );
      throw error; // 向上拋出錯誤，讓呼叫端決定如何處理
    }
  }
}
