import "tsconfig-paths/register";
import express, {Express, Request, Response} from "express";
import cors from "cors";

import {DatabaseConfigManager} from "@QDataBase/DatabaseConfigManager";
import {DatabaseConfig} from "@QDataBase/types";
import {QDB} from "@QDataBase/QDB";

// 載入環境變數
//dotenv.config();

let dbcm: DatabaseConfigManager = DatabaseConfigManager.getInstance();
let mssqlConfig: DatabaseConfig | undefined | null = dbcm.getConfig("mssql");
console.log(mssqlConfig);
let qdb: QDB;
if (mssqlConfig) {
  qdb = new QDB(mssqlConfig);
} else {
  console.log("Error : Mssql config error ");
}

// 建立 Express 應用
const app: Express = express();
const PORT = process.env.PORT || 3000;

// 啟用 CORS
app.use(cors());
app.use(express.json());

// 定義 API 路由
app.get("/", async (req: Request, res: Response) => {
  const queryResult = await qdb.query(
    "SELECT top 25 * FROM L539 order by Period desc"
  );
  console.log(queryResult);
  res.send("Hello, Express with TypeScript! 🚀");
});

// 定義 API 路由
app.get("/539", async (req: Request, res: Response) => {
  const queryResult = await qdb.query(
    "SELECT top 25 * FROM L539 order by Period desc"
  );

  res.send(queryResult);
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`⚡ Server is running at http://localhost:${PORT}`);
});
