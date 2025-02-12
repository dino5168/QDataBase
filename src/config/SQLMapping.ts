import ini from "ini";
import fs from "fs";

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
      const configFile = fs.readFileSync(this.fileName, "utf-8");
      const config = ini.parse(configFile);

      // Convert config object to Map
      Object.entries(config).forEach(([key, value]) => {
        this.queryMap.set(key, value as string);
      });

      console.log("Loaded queries:", this.queryMap);
    } catch (error) {
      console.error("Error reading config file:", error);
      throw error;
    }
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
