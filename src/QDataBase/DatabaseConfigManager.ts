import {
  DatabaseConnections,
  MongoConfig,
  SupportedDatabase,
  DatabaseConfig,
  RedisConfig,
} from "@Env/types";

export class DatabaseConfigManager {
  private static instance: DatabaseConfigManager;
  private configs: DatabaseConnections = {};

  private constructor() {
    this.loadConfigs();
  }

  public static getInstance(): DatabaseConfigManager {
    if (!DatabaseConfigManager.instance) {
      DatabaseConfigManager.instance = new DatabaseConfigManager();
    }
    return DatabaseConfigManager.instance;
  }

  private loadConfigs(): void {
    // Load PostgreSQL config
    if (process.env.POSTGRES_ENABLED === "true") {
      this.configs.postgres = {
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        username: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "",
        database: process.env.POSTGRES_DB || "postgres",
        ssl: process.env.POSTGRES_SSL === "true",
        poolSize: parseInt(process.env.POSTGRES_POOL_SIZE || "10"),
        timeout: parseInt(process.env.POSTGRES_TIMEOUT || "5000"),
      };
    }

    // Load MongoDB config
    if (process.env.MONGODB_ENABLED === "true") {
      this.configs.mongodb = {
        host: process.env.MONGODB_HOST || "localhost",
        port: parseInt(process.env.MONGODB_PORT || "27017"),
        username: process.env.MONGODB_USER || "",
        password: process.env.MONGODB_PASSWORD || "",
        database: process.env.MONGODB_DATABASE || "test",
        authSource: process.env.MONGODB_AUTH_SOURCE,
        replicaSet: process.env.MONGODB_REPLICA_SET,
      };
    }

    // Load MSSQL config
    if (process.env.MSSQL_ENABLED === "true") {
      this.configs.mssql = {
        host: process.env.MSSQL_HOST || "localhost",
        port: parseInt(process.env.MSSQL_PORT || "1433"),
        username: process.env.MSSQL_USER || "",
        password: process.env.MSSQL_PASSWORD || "",
        database: process.env.MSSQL_DATABASE || "Lottery",
      };
    }

    // Add more database configurations as needed...
  }

  public getConfig<T extends SupportedDatabase>(
    dbType: T
  ): DatabaseConnections[T] | null {
    return this.configs[dbType] || null;
  }

  public validateConfig(dbType: SupportedDatabase): boolean {
    const config = this.getConfig(dbType);
    if (!config) return false;

    switch (dbType) {
      case "postgres":
      case "mssql":
      case "mysql":
        return this.validateRelationalConfig(config as DatabaseConfig);
      case "mongodb":
        return this.validateMongoConfig(config as MongoConfig);
      case "redis":
        return this.validateRedisConfig(config as RedisConfig);

      default:
        return false;
    }
  }

  private validateRelationalConfig(config: DatabaseConfig): boolean {
    return !!(config.host && config.port && config.username && config.database);
  }

  private validateMongoConfig(config: MongoConfig): boolean {
    return !!(config.host && config.port && config.database);
  }

  private validateRedisConfig(config: RedisConfig): boolean {
    return !!(config.host && config.port);
  }
}
