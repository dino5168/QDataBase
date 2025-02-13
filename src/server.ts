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
import {QServer, StartServer} from "QServer";
import {RouterHandler} from "routes/RouterHandler";
import {QueryService} from "@services/QueryService";
import {LotteryRouter} from "@controllers/LotteryController";
import {QRouterService} from "@services/QRouterService";
import {RouteConfig, RouteConfigManager} from "@config/RouteConfigManager";
import QRCode from "qrcode";

QRCode.toFile(
  "C:/temp/qrcode.png",
  "https://dino5168.github.io/Lottery/",
  {
    color: {dark: "#000", light: "#FFF"},
  },
  (err) => {
    if (err) console.error("Error generating QR Code file:", err);
    else console.log("QR Code saved as qrcode.png");
  }
);

//使用  載入環境變數
dotenv.config();
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Authenticating...");
  next(); // 進入下一步
};
try {
  //資料庫設定
  const SQL_SETTING = process.env.SQL_SETTING;
  const DATABASE_CONFIG: string = process.env.DATABASE_CONFIG as string;
  console.log(SQL_SETTING);

  if (!DATABASE_CONFIG) {
    throw new Error("DataBase Config file not set errror");
  }
  // 獲取 DatabaseConfigManager 實例並載入配置
  let dbcm: DatabaseConfigManager =
    DatabaseConfigManager.getInstance().loadConfigs(DATABASE_CONFIG);

  // 使用 enum 來指定資料庫類型
  let mssqlConfig = dbcm.getConfig(
    SupportedDatabase.MSSQL, // 使用 enum 而不是字串 "MSSQL"
    "Lottery" // 資料庫名稱
  );

  console.log("mssqlConfig:", mssqlConfig);

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
  let queryService = server.GetService();
  //let lotteryController = new LotteryRouter(queryService);
  //const router = express.Router();
  //router.get("/", lotteryController.getRouter());

  // 設定路由
  //server.setupRoutes();

  //server.start();
  const app = express();
  //app.use("/lottery", router); // 或其他合適的路徑前綴
  //StartServer(qdb, sqlMapping);
  const PORT = process.env.PORT || 3000;

  //
  // Router Config
  const ROUTE_CONFIG = process.env.ROUTE_CONFIG;
  if (!ROUTE_CONFIG) throw new Error("SQL_SETTING set up Error");
  console.log("ROUTE_CONFIG:", ROUTE_CONFIG);

  // 由外部註冊路由
  RouteConfigManager.getInstance().setConfigPath(ROUTE_CONFIG);
  RouteConfigManager.getInstance()
    .loadConfigs()
    .then((routeConfigs) => {
      const lotteryRouter = new QRouterService(queryService, routeConfigs);

      app.use("/Lottery", authMiddleware, lotteryRouter.getRouter());
    });

  app.listen(PORT, () => {
    console.log(`⚡ Server is running at http://localhost:${PORT}`);
  });
} catch (exception) {
  //if (exception) {
  console.log(exception);
  //}
}
