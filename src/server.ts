import "tsconfig-paths/register";
import express, {Express, Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";

import {DatabaseConfigManager} from "@lib/QDataBase/DatabaseConfigManager";
import {DatabaseConfig} from "@lib/QDataBase/types";
import {SQLMapping} from "@config/SQLMapping";
import {QDB} from "@lib/QDataBase/QDB";
import type {IQDB} from "@lib/QDataBase/IQDB";
import {QServer, StartServer} from "QServer";
import {RouterHandler} from "routes/RouterHandler";
import {QueryService} from "@lib/QDataBase/QueryService";
import {LotteryController} from "@controllers/LotteryController";

//使用  載入環境變數
dotenv.config();

try {
  //資料庫設定
  const SQL_SETTING = process.env.SQL_SETTING;
  console.log(SQL_SETTING);

  let dbcm: DatabaseConfigManager = DatabaseConfigManager.getInstance();
  let mssqlConfig: DatabaseConfig | undefined | null = dbcm.getConfig("mssql");
  if (!mssqlConfig) throw new Error("mssqlConfig set up Error");
  let qdb: IQDB = new QDB(mssqlConfig);

  if (!SQL_SETTING) throw new Error("SQL_SETTING set up Error");
  //
  const sqlMapping = SQLMapping.getInstance(SQL_SETTING);

  //路由設定
  //let router = new RouterHandler(services);

  // 初始化應用程式
  const server = QServer.getInstance(qdb, sqlMapping);
  server.initialize();

  let service = server.GetService();
  let lotteryController = new LotteryController(service);
  const router = express.Router();

  router.get("/", lotteryController.getQueryData);

  // 設定路由
  //server.setupRoutes();

  //server.start();
  const app = express();
  app.use("/lottery", router); // 或其他合適的路徑前綴
  //StartServer(qdb, sqlMapping);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`⚡ Server is running at http://localhost:${PORT}`);
  });
} catch (exception) {
  //if (exception) {
  console.log(exception);
  //}
}
