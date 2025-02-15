import {
  DatabaseConfigManager,
  SupportedDatabase,
} from "@lib/QDataBase/DatabaseConfigManager";
import {QDB} from "@lib/QDataBase/QDB";
import type {IQDB} from "@lib/QDataBase/IQDB";
import {SQLMapping} from "@config/SQLMapping";
import {QueryService} from "@services/QueryService";

import {QueryFunction, RedisController} from "@controllers/RedisController";
import {RouteConfigManager} from "@config/RouteConfigManager";
import {QueryDataController} from "@controllers/QueryDataController";
import {Express, Request, Response, NextFunction} from "express";

//如果 this 不應該變動，用箭頭函式。
//如果 this 需要動態變更，用普通 function。
//取得 DB
export const GetDB = (dataBaseName: string): IQDB => {
  const CONFIG_DATABASE: string = process.env.CONFIG_DATABASE as string;

  if (!CONFIG_DATABASE) {
    throw new Error("DataBase Config file not set errror");
  }
  // 獲取 DatabaseConfigManager 實例並載入配置
  let dbcm: DatabaseConfigManager =
    DatabaseConfigManager.getInstance().loadConfigs(CONFIG_DATABASE);

  // 使用 enum 來指定資料庫類型
  let mssqlConfig = dbcm.getConfig(
    SupportedDatabase.MSSQL, // 使用 enum 而不是字串 "MSSQL"
    dataBaseName // 資料庫名稱
  );

  console.log("mssqlConfig:", mssqlConfig);

  if (!mssqlConfig) throw new Error("mssqlConfig set up Error");
  return new QDB(mssqlConfig);
};

export const GetDBService = (qdb: IQDB, sqlMapping: SQLMapping) => {
  const keys = sqlMapping.getKeys();

  keys.forEach((key) => {
    console.log("key:", key);
  });

  return new QueryService(qdb, sqlMapping);
};

export const UseRedis = (app: Express, queryService: QueryService) => {
  const redis = RedisController.getInstance();
  redis.init(); // 使用預設值
  const createQueryFunction = (queryKey: string): QueryFunction => {
    return async () => {
      try {
        const queryResult = await queryService.Query(queryKey);
        return queryResult;
      } catch (error) {
        console.error(error);
        return {error};
      }
    };
  };
  // 添加查詢,依賴注入
  redis.add("QUERY_USER", createQueryFunction("QUERY_USER"));
  // 添加路由
  redis.addRouter("/Redis/User", "QUERY_USER");
  redis.registerRoutes(app);
};
/*
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Authenticating...");
  next(); // 進入下一步
};
*/
//使用中間層 // "/Lottery"
export const UseLottery = async (
  app: Express,
  path: string,
  queryService: QueryService,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => void
) => {
  try {
    // 環境變數檢查
    const CONFIG_LOTTERY = process.env.CONFIG_LOTTERY;
    if (!CONFIG_LOTTERY) throw new Error("SQL_SETTING set up Error");
    console.log("ROUTE_CONFIG:", CONFIG_LOTTERY);

    // 由外部註冊路由
    const routerconfigManger = RouteConfigManager.getInstance();
    routerconfigManger.setConfigPath(CONFIG_LOTTERY);

    // 等待載入完成
    const routeConfigs = await routerconfigManger.loadConfigs();

    // 初始化 Controller
    const queryDataController = new QueryDataController(
      queryService,
      routeConfigs
    );

    // 註冊路由，使用傳入的 authMiddleware
    app.use(path, authMiddleware, queryDataController.getRouter());

    console.log("Lottery 路由已註冊成功");
  } catch (error) {
    console.error("UseLottery 初始化失敗:", error);
  }
};
