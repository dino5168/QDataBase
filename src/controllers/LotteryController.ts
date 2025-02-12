//控制器
/*
Controller 負責處理請求
Controller 只關心處理請求 (req, res)
不直接操作資料庫，而是呼叫 Service 層
*/
import {QueryService} from "@lib/QDataBase/QueryService";
import {Request, Response} from "express";
export class LotteryController {
  constructor(private service: QueryService) {}
  //使用 箭頭函數 不然就要綁定 this .bind
  //router.get("/", lotteryController.getQueryData.bind(lotteryController));
  //router.get("/", (req: Request, res: Response) => lotteryController.getQueryData(req, res));
  getQueryData = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryResult = await this.service.Query("QUERY_539");
      res.json(queryResult);
    } catch (error) {
      res.status(500).json({error: "取得使用者清單失敗"});
    }
  };
}
