export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  timeout?: number;
  poolSize?: number;
}
//Redis
//Pick<T, K> 是一個內建的 泛型工具類型，用來從 T 類型中選擇特定的鍵（K），並建立新的類型。
export interface RedisConfig extends Pick<DatabaseConfig, "host" | "port"> {
  password?: string;
  db?: number;
}
//Mongo
export interface MongoConfig
  extends Pick<DatabaseConfig, "host" | "port" | "username" | "password"> {
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
