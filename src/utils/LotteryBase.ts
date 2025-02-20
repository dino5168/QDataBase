import {GetLotteryData, LottoDraw} from "@utils/LotteryDB";
//抓取資料,資料基本運算
export class LotteryBase {
  constructor() {}

  public GetLotteryData = async (dataNumbers: string): Promise<LottoDraw[]> => {
    return GetLotteryData(dataNumbers);
  };
}
