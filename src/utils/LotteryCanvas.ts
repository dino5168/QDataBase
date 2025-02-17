import {GetDB} from "QDBService";
import {QueryResult} from "@lib/QDataBase/types";
import {createCanvas} from "canvas";
import * as fs from "fs";
// Define interfaces for better type safety
interface LotteryData {
  ID: number;
  Period: number;
  OpenDate: string;
  NO_1: string;
  NO_2: string;
  NO_3: string;
  NO_4: string;
  NO_5: string;
}

interface TableData {
  header: string[];
  rows: Record<string, string | number>[];
}

export class LotteryCanvas {
  private lotteryData: LotteryData[] = [];
  private initialized: boolean = false;

  // Static method to create an initialized instance
  static async create(selectNumber: string): Promise<LotteryCanvas> {
    const instance = new LotteryCanvas();
    await instance.init(selectNumber);
    return instance;
  }

  private constructor() {
    // Private constructor to enforce using create() method
  }

  async init(selectNumber: string): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.lotteryData = await this.getData(selectNumber);
    this.initialized = true;
  }

  private async getData(selectNumber: string): Promise<LotteryData[]> {
    try {
      const result: QueryResult<Record<string, any>[]> = await GetDB(
        "Lottery"
      ).query(`SELECT TOP  ${selectNumber} * FROM L539 ORDER BY Period DESC`);

      if (!result.success || !Array.isArray(result.data)) {
        console.error("Query failed:", result.error);
        return [];
      }

      return result.data.map((item) => ({
        ID: Number(item.ID),
        Period: Number(item.Period),
        OpenDate: String(item.OpenDate),
        NO_1: String(item.NO_1),
        NO_2: String(item.NO_2),
        NO_3: String(item.NO_3),
        NO_4: String(item.NO_4),
        NO_5: String(item.NO_5),
      }));
    } catch (error) {
      console.error("Failed to fetch lottery data:", error);
      return [];
    }
  }

  public getLotteryData(): LotteryData[] {
    if (!this.initialized) {
      throw new Error("LotteryCanvas not initialized. Call init() first.");
    }
    return [...this.lotteryData]; // Return a copy to prevent external modifications
  }
  public generateTable(data: LotteryData[]): TableData {
    // 生成表頭
    const header = [
      "Period",
      ...Array.from({length: 39}, (_, i) =>
        (i + 1).toString().padStart(2, "0")
      ),
    ];

    // 生成資料列
    const rows = data.map((entry) => {
      // 將中獎號碼轉換為數字集合，方便查詢
      const numbers = new Set(
        [entry.NO_1, entry.NO_2, entry.NO_3, entry.NO_4, entry.NO_5].map(
          (num) => parseInt(num, 10)
        )
      );

      // 創建一個新的物件，以期號開始
      const unsortedRow: {[key: string]: number | string} = {
        Period: entry.Period,
      };

      // 將每個號碼填充到 unsortedRow
      for (let i = 1; i <= 39; i++) {
        const numStr = i.toString().padStart(2, "0");
        unsortedRow[numStr] = numbers.has(i) ? 1 : 0;
      }

      // 創建一個空的 sortedRow 並按照 header 的順序填充
      const sortedRow: {[key: string]: number | string} = {
        Period: unsortedRow.Period,
      };

      // 確保 sortedRow 的順序與 header 順序一致
      header.slice(1).forEach((numStr) => {
        console.log(numStr);
        sortedRow[numStr] = unsortedRow[numStr];
      });
      console.log(sortedRow);

      return sortedRow;
    });

    // 依照期號排序
    rows.sort((a, b) => {
      return a.Period.toString().localeCompare(b.Period.toString());
    });

    return {header, rows};
  }

  public printData(): void {
    if (!this.initialized) {
      throw new Error("LotteryCanvas not initialized. Call init() first.");
    }
    console.log(JSON.stringify(this.lotteryData, null, 2));
  }
}
