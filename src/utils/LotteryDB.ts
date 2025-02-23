import {GetDB} from "QDBService";

export interface LottoDraw {
  drawNumber: number;
  numbers: number[];
  openDate?: string;
}

export interface LottoDBRecord {
  ID: number;
  Period: string;
  OpenDate: string;
  NO_1: string;
  NO_2: string;
  NO_3: string;
  NO_4: string;
  NO_5: string;
}
//轉換資料格式
export const transformLottoData = (data: LottoDBRecord): LottoDraw | null => {
  const drawNumber = parseInt(data.Period, 10);
  const numbers = [
    parseInt(data.NO_1, 10),
    parseInt(data.NO_2, 10),
    parseInt(data.NO_3, 10),
    parseInt(data.NO_4, 10),
    parseInt(data.NO_5, 10),
  ].sort((a, b) => a - b);

  if (isNaN(drawNumber) || numbers.some(isNaN)) {
    console.error("資料格式錯誤：", data);
    return null;
  }

  return {
    drawNumber,
    numbers,
    openDate: data.OpenDate,
  };
};

//取得樂透資料 並轉換為 LottoDraw
export const GetLotteryData = async (
  dataNumbers: string
): Promise<LottoDraw[]> => {
  const querySQL = `SELECT Top ${dataNumbers} *  FROM L539 ORDER BY Period desc`;
  console.log("query Sql:", querySQL);

  try {
    let db = GetDB("Lottery");
    const result = await db.query<LottoDBRecord>(querySQL);
    console.log(result.data?.at(0));
    if (!result.data || !Array.isArray(result.data)) {
      console.error("查詢結果異常", result);
      return [];
    }

    return result.data
      .reverse() // 加入這行 LSTM 資料須從 舊排到新
      .map((data) => transformLottoData(data))
      .filter((item): item is LottoDraw => item !== null);
  } catch (error) {
    console.error("獲取數據時出錯", error);
    return [];
  }
};

//LSTM 需要按照時間遞增順序（時間從過去到現在） 來訓練，確保模型學習到過去數據如何影響未來數據。
//取得樂透資料 並轉換為 LottoDraw
export const GetLotteryDataNewFirst = async (
  dataNumbers: string
): Promise<LottoDraw[]> => {
  const querySQL = `SELECT Top ${dataNumbers} *  FROM L539 ORDER BY Period desc`;
  console.log("query Sql:", querySQL);

  try {
    let db = GetDB("Lottery");
    const result = await db.query<LottoDBRecord>(querySQL);
    console.log(result.data?.at(0));
    if (!result.data || !Array.isArray(result.data)) {
      console.error("查詢結果異常", result);
      return [];
    }

    return result.data
      .map((data) => transformLottoData(data))
      .filter((item): item is LottoDraw => item !== null);
  } catch (error) {
    console.error("獲取數據時出錯", error);
    return [];
  }
};
