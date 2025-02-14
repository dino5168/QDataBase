import fs from "fs/promises";
import path from "path";

export interface RouteConfig {
  path: string;
  queryKey: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export class RouteConfigManager {
  private static instance: RouteConfigManager;
  private configs: RouteConfig[] = [];
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), "routeConfigs.json");
  }

  public static getInstance(): RouteConfigManager {
    if (!RouteConfigManager.instance) {
      RouteConfigManager.instance = new RouteConfigManager();
    }
    return RouteConfigManager.instance;
  }

  private isValidRouteConfig(config: any): config is RouteConfig {
    return (
      typeof config === "object" &&
      typeof config.path === "string" &&
      typeof config.queryKey === "string" &&
      ["GET", "POST", "PUT", "DELETE"].includes(config.method) &&
      (config.rateLimit === undefined ||
        (typeof config.rateLimit === "object" &&
          typeof config.rateLimit.windowMs === "number" &&
          typeof config.rateLimit.max === "number"))
    );
  }

  public setConfigPath(filePath: string): void {
    this.configPath = filePath;
  }
  //載入設定檔
  public async loadConfigs(): Promise<RouteConfig[]> {
    try {
      const jsonContent = await fs.readFile(this.configPath, "utf8");
      const parsedData = JSON.parse(jsonContent);

      if (!Array.isArray(parsedData)) {
        throw new Error("Config file must contain an array");
      }

      // Validate each config object
      const invalidConfigs = parsedData.filter(
        (config) => !this.isValidRouteConfig(config)
      );
      if (invalidConfigs.length > 0) {
        throw new Error(
          `Invalid config objects found: ${JSON.stringify(invalidConfigs)}`
        );
      }

      this.configs = parsedData as RouteConfig[];
      return this.configs;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn("Config file not found, returning empty array");
        return [];
      }
      console.error("Error reading configs from JSON:", error);
      throw error;
    }
  }

  public async saveConfigs(configs: RouteConfig[]): Promise<void> {
    try {
      // Validate configs before saving
      const invalidConfigs = configs.filter(
        (config) => !this.isValidRouteConfig(config)
      );
      if (invalidConfigs.length > 0) {
        throw new Error(
          `Invalid config objects found: ${JSON.stringify(invalidConfigs)}`
        );
      }

      const jsonContent = JSON.stringify(configs, null, 2);
      await fs.writeFile(this.configPath, jsonContent, "utf8");
      this.configs = configs;
      console.log("Successfully wrote configs to JSON file");
    } catch (error) {
      console.error("Error writing configs to JSON:", error);
      throw error;
    }
  }

  public getConfigs(): RouteConfig[] {
    return [...this.configs]; // Return a copy to prevent direct modification
  }

  public async addConfig(config: RouteConfig): Promise<void> {
    if (!this.isValidRouteConfig(config)) {
      throw new Error("Invalid route config provided");
    }
    this.configs.push(config);
    await this.saveConfigs(this.configs);
  }

  public async updateConfig(index: number, config: RouteConfig): Promise<void> {
    if (index < 0 || index >= this.configs.length) {
      throw new Error("Invalid config index");
    }
    if (!this.isValidRouteConfig(config)) {
      throw new Error("Invalid route config provided");
    }
    this.configs[index] = config;
    await this.saveConfigs(this.configs);
  }

  public async deleteConfig(index: number): Promise<void> {
    if (index < 0 || index >= this.configs.length) {
      throw new Error("Invalid config index");
    }
    this.configs.splice(index, 1);
    await this.saveConfigs(this.configs);
  }
}
