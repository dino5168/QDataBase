//控制器
/*
Controller 負責處理請求
Controller 只關心處理請求 (req, res)
不直接操作資料庫，而是呼叫 Service 層
*/
import {QueryService} from "@services/QueryService";
import {Request, Response, Router} from "express";
import {rateLimit} from "express-rate-limit";

// 創建限流器
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 限制每個 IP 15分鐘內最多 100 個請求
});

// 定義允許的查詢類型
const ALLOWED_QUERIES = new Set(["539", "53901", "53902"]);

export class LotteryRouter {
  private router: Router;

  constructor(private queryService: QueryService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // 套用限流器
    this.router.use(limiter);
    this.router.get("/", async (req, res) => {
      res.send("OK Lottery");
    });

    // 處理 /Lottery/:type 路由
    this.router.get(
      "/:type",
      async (req: Request, res: Response): Promise<void> => {
        try {
          const {type} = req.params;

          // 驗證查詢類型
          if (!ALLOWED_QUERIES.has(type)) {
            res.status(400).json({
              error: "Invalid lottery type",
            });
          }

          // 構建 SQL 查詢標識符
          const queryKey = `QUERY_${type}`;
          console.log("queryKey", queryKey);

          // 執行查詢
          const result = await this.queryService.Query(queryKey);

          // 返回結果
          res.json({
            success: true,
            data: result,
          });
        } catch (error) {
          console.error("Router error:", error);
          res.status(500).json({
            error: "Internal server error",
          });
        }
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
