import {createClient, RedisClientOptions} from "redis";
import {Router, Request, Response} from "express";
import {Express} from "express";
interface RedisConfig {
  host?: string;
  port?: number;
  expireTime?: number;
  retryStrategy?: RetryStrategy;
}

type RetryStrategy = (retries: number) => number | Error;

export interface QueryFunction {
  (req?: Request): Promise<any>;
}

interface QueryConfig {
  expireTime?: number;
  queryFunction: QueryFunction;
}

interface QueryMap {
  [key: string]: QueryConfig;
}

interface RouterMap {
  [key: string]: string;
}

export class RedisController {
  private static instance: RedisController;
  // 使用 ! 運算符告訴 TypeScript 這個屬性會在使用前被初始化

  private redisClient!: ReturnType<typeof createClient>; //讓 type script 自動推斷 類型
  private queryMap: QueryMap = {};
  private routerMap: RouterMap = {};
  private router: Router;
  private cacheExpireTime: number = 60;
  private initialized: boolean = false;

  // ... 其餘代碼保持不變

  private constructor() {
    this.router = Router();
  }
  public static getInstance(): RedisController {
    if (!RedisController.instance) {
      RedisController.instance = new RedisController();
    }
    return RedisController.instance;
  }

  public async init(config: RedisConfig = {}): Promise<void> {
    if (this.initialized) {
      console.warn("RedisController already initialized");
      return;
    }

    try {
      const redisOptions: RedisClientOptions = {
        socket: {
          host: config.host || process.env.REDIS_HOST || "localhost",
          port: config.port || parseInt(process.env.REDIS_PORT || "6379", 10),
          reconnectStrategy:
            config.retryStrategy || this.defaultReconnectStrategy,
        },
      };

      this.redisClient = createClient(redisOptions);

      this.redisClient.on("error", this.handleRedisError);
      this.redisClient.on("connect", () => console.log("Redis connected"));
      this.redisClient.on("reconnecting", () =>
        console.log("Redis reconnecting")
      );

      await this.redisClient.connect();

      if (config.expireTime) {
        this.cacheExpireTime = config.expireTime;
      }

      this.setupRoutes();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      throw error;
    }
  }

  private defaultReconnectStrategy: RetryStrategy = (
    retries: number
  ): number | Error => {
    if (retries > 10) {
      return new Error("Redis max retries reached");
    }
    return Math.min(retries * 100, 3000);
  };

  public async shutdown(): Promise<void> {
    try {
      await this.redisClient?.quit();
      this.initialized = false;
    } catch (error) {
      console.error("Error shutting down Redis:", error);
      throw error;
    }
  }

  public add(
    queryKey: string,
    queryFunction: QueryFunction,
    expireTime?: number
  ): void {
    this.queryMap[queryKey] = {
      queryFunction,
      expireTime: expireTime || this.cacheExpireTime,
    };
  }

  public addRouter(path: string, queryKey: string): void {
    if (!this.queryMap[queryKey]) {
      throw new Error(`Query ${queryKey} not found`);
    }
    console.log("add routerMap:", path, queryKey);
    this.routerMap[path] = queryKey;
  }

  /***註冊路由器 ************/
  /***註冊路由器 ************/
  public async registerRoutes(app: Express): Promise<void> {
    Object.entries(this.routerMap).forEach(([path, queryKey]) => {
      app.get(path, async (req: Request, res: Response): Promise<void> => {
        // 使用 app.get() 正確註冊路由
        console.log(`Handling request for ${path}`);
        if (!this.queryMap[queryKey]) {
          res.status(500).json({error: `Query ${queryKey} not found`});
        }
        try {
          const result = await this.queryMap[queryKey].queryFunction(req);
          res.json(result);
        } catch (error) {
          console.error(`Error processing request for ${path}:`, error);
          res.status(500).json({error: "Internal Server Error"});
        }
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  public async clearCache(path?: string): Promise<void> {
    try {
      if (path) {
        await this.redisClient.del(`cache:${path}`);
      } else {
        const keys = await this.redisClient.keys("cache:*");
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw error;
    }
  }

  private handleRedisError = (error: Error): void => {
    console.error("Redis Error:", error);
    // 這裡可以添加監控或警告邏輯
  };

  private async executeQuery(queryKey: string, req?: Request): Promise<any> {
    const queryConfig = this.queryMap[queryKey];
    if (!queryConfig) {
      throw new Error(`Query ${queryKey} not found`);
    }

    const queryResult = await queryConfig.queryFunction();
    const expireTime = queryConfig.expireTime || this.cacheExpireTime;

    //return {queryResult, expireTime};
    return queryResult;
  }

  private setupRoutes(): void {
    this.router.get("*", async (req: Request, res: Response) => {
      this.handleRequest(req, res);
    });
    this.router.post("*", async (req: Request, res: Response) => {
      await this.handleRequest(req, res);
    });

    this.router.delete("*", async (req: Request, res: Response) => {
      await this.clearCache(req.path);
      res.json({message: "Cache cleared"});
    });
  }
  //
  private async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!this.initialized) {
        res.status(503).json({error: "Service not initialized"});
        return;
      }

      const path = req.path;
      const queryKey = this.routerMap[path];

      if (!queryKey) {
        res.status(404).json({error: "Route not found"});
        return;
      }

      const redisKey = `cache:${path}`;

      try {
        const cachedData = await this.redisClient.get(redisKey);
        if (cachedData) {
          res.json(JSON.parse(cachedData));
          return;
        }
        const queryResult = await this.executeQuery(queryKey); //回傳 Json 物件

        await this.redisClient.setEx(
          redisKey,
          this.cacheExpireTime,
          JSON.stringify(queryResult)
        );

        res.json(queryResult);
      } catch (error) {
        console.error(`Error processing request for ${path}:`, error);
        res.status(500).json({error: "Internal server error"});
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
}
