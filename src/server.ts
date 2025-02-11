import "tsconfig-paths/register";

import express, {Express, Request, Response} from "express";
import dotenv from "dotenv";
import cors from "cors";

import {DatabaseConfigManager} from "@QDataBase/DatabaseConfigManager";

// 載入環境變數
//dotenv.config();

let dbcm: DatabaseConfigManager = DatabaseConfigManager.getInstance();
let mssqlConfig = dbcm.getConfig("mssql");
console.log(mssqlConfig);

// 建立 Express 應用
const app: Express = express();
const PORT = process.env.PORT || 3000;

// 啟用 CORS
app.use(cors());
app.use(express.json());

// 定義 API 路由
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript! 🚀");
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`⚡ Server is running at http://localhost:${PORT}`);
});
