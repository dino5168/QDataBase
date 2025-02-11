// 定義資料庫配置介面
export interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  port?: number;
  database: string;
  ssl?: boolean;
  timeout?: number;
  options?: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    connectionTimeout: number;
    requestTimeout: number;
  };
  pool?: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

//Redis
//Pick<T, K> 是一個內建的 泛型工具類型，用來從 T 類型中選擇特定的鍵（K），並建立新的類型。
export interface RedisConfig extends Pick<DatabaseConfig, "server" | "port"> {
  password?: string;
  db?: number;
}
//Mongo
export interface MongoConfig
  extends Pick<DatabaseConfig, "server" | "port" | "user" | "password"> {
  database: string;
  authSource?: string;
  replicaSet?: string;
}

export type SupportedDatabase =
  | "postgres"
  | "mysql"
  | "mongodb"
  | "redis"
  | "mssql";

//定義資料庫連結
export interface DatabaseConnections {
  postgres?: DatabaseConfig;
  mysql?: DatabaseConfig;
  mongodb?: MongoConfig;
  redis?: RedisConfig;
  mssql?: DatabaseConfig;
}

// 定義查詢結果介面
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
