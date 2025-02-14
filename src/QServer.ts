import express, {Request, Response, Application, NextFunction} from "express";
import {SQLMapping} from "@config/SQLMapping";
import {IQDB} from "@lib/QDataBase/IQDB";
import {QueryService} from "@services/QueryService";
import {RouterHandler} from "routes/RouterHandler";

// 定義資料庫查詢介面

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
};

export class QServer {
  private static instance: QServer | null = null;
  private sqlMapping: SQLMapping | null = null;
  private db: IQDB;
  private app: Application;
  private QueryServiceObj: QueryService;

  private constructor(db: IQDB, sqlMapping: SQLMapping) {
    this.db = db;
    this.app = express();
    this.sqlMapping = sqlMapping;
    this.QueryServiceObj = new QueryService(db, sqlMapping);
  }

  public static getInstance(db: IQDB, sqlMapping: SQLMapping): QServer {
    if (!QServer.instance) {
      QServer.instance = new QServer(db, sqlMapping);
    }
    return QServer.instance;
  }
  //回傳服務
  public GetService(): QueryService {
    return this.QueryServiceObj;
  }

  

  public async initialize(): Promise<void> {
    try {
      const sqlSettingPath = process.env.CONFIG_SQL_SETTING;
      if (!sqlSettingPath) {
        throw new Error("SQL_SETTING environment variable is not defined");
      }
      this.sqlMapping = SQLMapping.getInstance(sqlSettingPath);
      console.log("SQL Mapping initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      throw error;
    }
  }

  public setupRoutes(): void {
    this.app.get("/", this.handleRootRoute.bind(this));
  }

  private async handleRootRoute(req: Request, res: Response): Promise<void> {
    try {
      if (!this.sqlMapping) {
        throw new Error("SQL Mapping not initialized");
      }

      const query539 = this.sqlMapping.get("QUERY_539");
      if (!query539) {
        throw new Error("Query QUERY_539 not found");
      }

      const queryResult = await this.db.query(query539);

      res.json({
        message: "Hello, Express with TypeScript! 🚀",
        data: queryResult,
      });
    } catch (error) {
      console.error("Error handling root route:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  public async start(): Promise<void> {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`⚡ Server is running at http://localhost:${PORT}`);
    });
  }

  public async shutdown(): Promise<void> {
    try {
      await this.db.disconnect();
      console.log("Server shutdown complete");
    } catch (error) {
      console.error("Error during shutdown:", error);
      throw error;
    }
  }
}

// 應用程式啟動程式
export async function StartServer(qdb: IQDB, sqlMapping: SQLMapping) {
  try {
    // 初始化應用程式
    const server = QServer.getInstance(qdb, sqlMapping);
    // 設定路由
    server.setupRoutes();
    await server.initialize();
    await server.start();

    // 優雅關閉處理
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received");
      await server.shutdown();
      process.exit(0);
    });
    process.on("SIGINT", async () => {
      console.log("SIGINT signal received");
      await server.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
