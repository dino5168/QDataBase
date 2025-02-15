import ini from "ini";
import fs from "fs";
import {UtilFiles} from "@utils/UtilFiles";

//將 .ini 對應的 SQL 讀取入 Map 提供查詢使用。
export class SQLMapping {
  private static instance: SQLMapping | null = null;
  private fileName: string;
  private queryMap: Map<string, string>;

  private constructor(fileName: string) {
    this.fileName = fileName;
    this.queryMap = new Map<string, string>();
    this.read();
  }

  public static getInstance(fileName: string): SQLMapping {
    if (!SQLMapping.instance) {
      SQLMapping.instance = new SQLMapping(fileName);
    }
    return SQLMapping.instance;
  }

  private read(): void {
    try {
      this.queryMap = UtilFiles.ReadIni(this.fileName);
      console.log("Loaded queries:", this.queryMap);
    } catch (error) {
      console.error("Error reading config file:", error);
      throw error;
    }
  }

  public getKeys() {
    return Array.from(this.queryMap.keys());
  }

  public get(queryKey: string): string | undefined {
    const query = this.queryMap.get(queryKey);
    if (!query) {
      console.warn(`Query not found for key: ${queryKey}`);
    }
    return query;
  }

  public getAllQueries(): Map<string, string> {
    return new Map(this.queryMap);
  }

  public hasQuery(queryKey: string): boolean {
    return this.queryMap.has(queryKey);
  }

  public getQueriesByPrefix(prefix: string): Map<string, string> {
    const filteredQueries = new Map<string, string>();
    this.queryMap.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        filteredQueries.set(key, value);
      }
    });
    return filteredQueries;
  }

  // Optional: Method to reset the instance (mainly for testing purposes)
  public static resetInstance(): void {
    SQLMapping.instance = null;
  }
}
