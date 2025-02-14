// routes.config.ts
export interface RouteConfig {
  path: string;
  queryKey: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

type HttpMethod = "get" | "post" | "put" | "delete";

const methodMap: Record<RouteConfig["method"], HttpMethod> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
};
// ConfigurableRouter.ts
import {Router, Request, Response} from "express";
import {rateLimit} from "express-rate-limit";
import {QueryService} from "@services/QueryService";

export class QueryDataController {
  private router: Router;

  constructor(
    private queryService: QueryService,
    private configs: RouteConfig[]
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.configs.forEach((config) => {
      // 為每個路由創建特定的限流器
      const routeLimiter = config.rateLimit
        ? rateLimit(config.rateLimit)
        : null;
      // 註冊路由
      this.router[methodMap[config.method]](
        config.path,
        ...(routeLimiter ? [routeLimiter] : []),
        async (req: Request, res: Response) => {
          try {
            const result = await this.queryService.Query(config.queryKey);
            res.json({
              success: true,
              data: result,
            });
          } catch (error) {
            console.error(`Route ${config.path} error:`, error);
            res.status(500).json({
              success: false,
              error: "Internal server error",
            });
          }
        }
      );
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

// app.ts (使用範例)
/*
import express from "express";
import {ConfigurableRouter} from "./ConfigurableRouter";
import {routeConfigs} from "./routes.config";
import {QueryService} from "./QueryService";

const app = express();

// 初始化服務
const queryService = new QueryService(db, sqlMapping);

// 創建路由器
const lotteryRouter = new ConfigurableRouter(queryService, routeConfigs);

// 註冊路由
app.use("/Lottery", lotteryRouter.getRouter());
*/
