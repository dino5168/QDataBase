import {Request, Response} from "express";
import {QueryService} from "@lib/QDataBase/QueryService";
export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
}

export class RouterHandler {
  constructor(private queryService: QueryService) {}

  public async handleRoot(req: Request, res: Response): Promise<void> {
    try {
      const queryResult = await this.queryService.Query("QUERY_539");

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

  public handleHealth(req: Request, res: Response): void {
    const healthCheck: HealthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
    };
    res.json(healthCheck);
  }
}
