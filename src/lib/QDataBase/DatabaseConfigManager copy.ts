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

interface NamedDatabaseConfig<T> {
  name: string;
  config: T;
}

type NamedDatabaseConnections = {
  [key in SupportedDatabase]?: NamedDatabaseConfig<any>[];
};

function isNamedDatabaseConfigArray(
  value: unknown
): value is NamedDatabaseConfig<any>[] {
  if (!Array.isArray(value)) {
    console.log("Config is not an array:", value);
    return false;
  }
  const isValid = value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "config" in item &&
      typeof item.name === "string"
  );
  console.log("Config validation result:", isValid);
  return isValid;
}

export class DatabaseConfigManager {
  private static instance: DatabaseConfigManager;
  private configs: NamedDatabaseConnections = {};

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
      console.log("Config file content:", configFile);

      const configData = JSON.parse(configFile);
      console.log("Parsed config data:", configData);

      if (!configData.databases) {
        throw new Error(
          "Invalid config file format: 'databases' property not found"
        );
      }

      // 清空現有配置
      this.configs = {};

      Object.entries(configData.databases).forEach(([dbType, config]) => {
        const dbTypeLower = dbType.toLowerCase();
        console.log(`Processing database type: ${dbTypeLower}`, config);

        if (
          Object.values(SupportedDatabase).includes(
            dbTypeLower as SupportedDatabase
          )
        ) {
          if (isNamedDatabaseConfigArray(config)) {
            console.log(
              `Valid configuration found for ${dbTypeLower}:`,
              config
            );
            this.configs[dbTypeLower as SupportedDatabase] = config;
          } else {
            console.warn(
              `Invalid configuration format for database type: ${dbTypeLower}`,
              config
            );
          }
        } else {
          console.warn(`Unsupported database type: ${dbTypeLower}`);
        }
      });

      console.log("Final loaded configs:", this.configs);
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
    const dbTypeLower = dbType.toLowerCase() as T;
    console.log("Current configs state:", this.configs);
    console.log("Looking for config:", {dbType: dbTypeLower, dbName});

    const dbConfigs = this.configs[dbTypeLower] || [];
    console.log("Found dbConfigs:", dbConfigs);

    const config =
      dbConfigs.find((db) => db.name === dbName)?.config ||
      dbConfigs[0]?.config;

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
