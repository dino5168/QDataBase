import "tsconfig-paths/register";
import express, {Express, NextFunction, Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  DatabaseConfigManager,
  SupportedDatabase,
} from "@lib/QDataBase/DatabaseConfigManager";
import {DatabaseConfig} from "@lib/QDataBase/types";
import {SQLMapping} from "@config/SQLMapping";
import {QDB} from "@lib/QDataBase/QDB";
import type {IQDB} from "@lib/QDataBase/IQDB";
import {GetDB, GetDBService, UseLottery, UseRedis} from "./QDBService";
import {QServer, StartServer} from "QServer";
import {RouterHandler} from "routes/RouterHandler";
import {QueryService} from "@services/QueryService";

import {RouteConfig, RouteConfigManager} from "@config/RouteConfigManager";

import {createClient} from "redis";
import {RedisController} from "@controllers/RedisController";
import {json} from "stream/consumers";
import {QueryDataController} from "@controllers/QueryDataController";

import type {QueryFunction} from "@controllers/RedisController";
//使用 dotenv  載入環境變數
dotenv.config();

try {
  //資料庫設定
  const app = express();
  const PORT = process.env.PORT || 3080;
  app.use(cors()); // 需要這行 不然會有跨網域問題

  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("Authenticating...");
    next(); // 進入下一步
  };

  let qdb: IQDB = GetDB();

  let queryService = GetDBService(qdb);
  console.log("DB Service Initialized:", queryService);
  UseLottery(app, queryService, authMiddleware);
  UseRedis(app, queryService);

  //

  //
  app.use("/test", (req: Request, res: Response) => {
    res.send("test OK");
  });

  // 使用控制器的路由
  app.listen(PORT, () => {
    console.log(`⚡ Server is running at http://localhost:${PORT}`);
  });
} catch (exception) {
  //if (exception) {
  console.log(exception);
  //}
}
