import fs from "fs";
import {
  DatabaseConnections,
  MongoConfig,
  DatabaseConfig,
  RedisConfig,
} from "@lib/QDataBase/types";

export enum SupportedDatabase {
  POSTGRES = "postgres",
  MONGODB = "mongodb",
  MSSQL = "mssql",
  MYSQL = "mysql",
  REDIS = "redis",
}

// 修改接口以匹配實際的配置文件格式
interface DatabaseEntry {
  type: string;
  config: any;
}

interface ConfigFile {
  databases: DatabaseEntry[];
}

export class DatabaseConfigManager {
  private static instance: DatabaseConfigManager;
  private configs: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseConfigManager {
    if (!DatabaseConfigManager.instance) {
      DatabaseConfigManager.instance = new DatabaseConfigManager();
    }
    return DatabaseConfigManager.instance;
  }

  public loadConfigs(configFileName: string): DatabaseConfigManager {
    try {
      console.log("Reading config file:", configFileName);
      const configFile = fs.readFileSync(configFileName, "utf8");
      const configData: ConfigFile = JSON.parse(configFile);

      // 清空現有配置
      this.configs.clear();

      // 處理配置數組
      configData.databases.forEach((entry) => {
        const dbType = entry.type.toLowerCase();
        //   console.log(`Processing database type: ${dbType}`, entry);

        if (
          Object.values(SupportedDatabase).includes(dbType as SupportedDatabase)
        ) {
          //   console.log(`Valid configuration found for ${dbType}:`, entry.config);
          // 將配置保存到 Map 中，使用類型和數據庫名稱作為鍵
          const key = `${dbType}:${entry.config.database}`;
          this.configs.set(key, entry.config);
        } else {
          console.warn(`Unsupported database type: ${dbType}`);
        }
      });

      //  console.log("Final loaded configs:", Object.fromEntries(this.configs));
      return this;
    } catch (error) {
      console.error("Error loading database config:", error);
      throw error;
    }
  }

  public getConfig<T extends SupportedDatabase>(
    dbType: T,
    dbName?: string
  ): DatabaseConnections[T] | null {
    const dbTypeLower = dbType.toLowerCase();
    // console.log("Looking for config:", {dbType: dbTypeLower, dbName});

    // 使用類型和數據庫名稱組合的鍵來查找配置
    const key = `${dbTypeLower}:${dbName}`;
    const config = this.configs.get(key);

    console.log("Found config:", config);

    return config || null;
  }

  public validateConfig(dbType: SupportedDatabase, dbName?: string): boolean {
    const config = this.getConfig(dbType, dbName);
    if (!config) return false;

    switch (dbType) {
      case SupportedDatabase.POSTGRES:
      case SupportedDatabase.MSSQL:
      case SupportedDatabase.MYSQL:
        return this.validateRelationalConfig(config as DatabaseConfig);
      case SupportedDatabase.MONGODB:
        return this.validateMongoConfig(config as MongoConfig);
      case SupportedDatabase.REDIS:
        return this.validateRedisConfig(config as RedisConfig);
      default:
        return false;
    }
  }

  private validateRelationalConfig(config: DatabaseConfig): boolean {
    return !!(config.server && config.port && config.user && config.database);
  }

  private validateMongoConfig(config: MongoConfig): boolean {
    return !!(config.server && config.port && config.database);
  }

  private validateRedisConfig(config: RedisConfig): boolean {
    return !!(config.server && config.port);
  }
}
