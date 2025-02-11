
import type {DatabaseConfig, MongoConfig, RedisConfig} from "@Env/types";

export class ConnectionStringBuilder {
  static buildPostgresUrl(config: DatabaseConfig): string {
    const ssl = config.ssl ? "?sslmode=require" : "";
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }

  static buildMongoUrl(config: MongoConfig): string {
    const auth =
      config.username && config.password
        ? `${config.username}:${config.password}@`
        : "";
    const replicaSet = config.replicaSet
      ? `?replicaSet=${config.replicaSet}`
      : "";
    return `mongodb://${auth}${config.host}:${config.port}/${config.database}${replicaSet}`;
  }

  static buildRedisUrl(config: RedisConfig): string {
    const auth = config.password ? `:${config.password}@` : "";
    return `redis://${auth}${config.host}:${config.port}`;
  }
}
