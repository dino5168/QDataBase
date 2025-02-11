import type {
  DatabaseConfig,
  MongoConfig,
  RedisConfig,
} from "@lib/QDataBase/types";

export class ConnectionStringBuilder {
  static buildPostgresUrl(config: DatabaseConfig): string {
    const ssl = config.ssl ? "?sslmode=require" : "";
    return `postgresql://${config.user}:${config.password}@${config.server}:${config.port}/${config.database}${ssl}`;
  }

  static buildMongoUrl(config: MongoConfig): string {
    const auth =
      config.user && config.password
        ? `${config.user}:${config.password}@`
        : "";
    const replicaSet = config.replicaSet
      ? `?replicaSet=${config.replicaSet}`
      : "";
    return `mongodb://${auth}${config.server}:${config.port}/${config.database}${replicaSet}`;
  }

  static buildRedisUrl(config: RedisConfig): string {
    const auth = config.password ? `:${config.password}@` : "";
    return `redis://${auth}${config.server}:${config.port}`;
  }
}
