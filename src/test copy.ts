import "tsconfig-paths/register";
import dotenv from "dotenv";
import {Get539Data} from "@utils/UtilLottery";
import {GetDB} from "QDBService";

import LotteryPredictor from "@utils/LotteryPredictor";

import LotteryPredictor02 from "@utils/LotteryPredictor02";
import LotteryPredictor03 from "@utils/LotteryPredictor03";
// 使用範例
/*
async function example() {
  const predictor = new LotteryPredictor();
  const result = await predictor.predict(25, 100);

  console.log("預測號碼：", result.predictedNumbers);
  console.log("號碼統計：", result.stats);
}

example();
*/
/*
async function example() {
  const predictor = new LotteryPredictor02();
  const result = await predictor.predict(5, 200);

  console.log("號碼統計：", result.stats);
  console.log("預測號碼：", result.predictedNumbers);
}
example();
*/

//使用 dotenv  載入環境變數
dotenv.config();
async function main() {
  const predictor = new LotteryPredictor03();

  try {
    // 訓練並預測樂透號碼
    const predictionResult = await predictor.predict();

    // 輸出預測結果
    console.log("預測樂透號碼：", predictionResult.predictedNumbers);
    console.log("預測信心度：", predictionResult.confidence);
    console.log("模型準確度：", predictionResult.modelAccuracy);

    // 可選：檢視訓練歷史
    console.log("訓練歷史：", predictionResult.trainingHistory);
  } catch (error) {
    console.error("預測過程中發生錯誤：", error);
  } finally {
    // 銷毀模型以釋放記憶體
    predictor.dispose();
  }
}

// 執行範例程式
//main();
type SourceData = {
  ID: number;
  OpenDate: string;
  numbers: string;
};

type TransformedData = {
  Period: string;
  OpenDate: string;
  NO_1: string;
  NO_2: string;
  NO_3: string;
  NO_4: string;
  NO_5: string;
};

const transformData = (year: string, data: SourceData[]): TransformedData[] => {
  return data.map((item, index) => {
    const numbers = item.numbers.split(", ");
    return {
      Period: `${year}${(index + 1).toString().padStart(6, "0")}`,
      OpenDate: item.OpenDate.split("(")[0], // 去除括號內的文字
      NO_1: numbers[0],
      NO_2: numbers[1],
      NO_3: numbers[2],
      NO_4: numbers[3],
      NO_5: numbers[4],
    };
  });
};

let db = GetDB("Lottery");

const GetA539 = async () => {
  const transYear = "2007";
  const transPublicYear = "" + (parseInt(transYear) - 1911);

  const result = await db.query(
    `select  * from A539 where OpenDate like '${transYear}%' order by OpenDate asc`
  );
  let trandatas = transformData(transPublicYear, result.data as SourceData[]);
  trandatas.forEach((element) => {
    db.insert("L539", element);
  });
  console.log("TransFinish");
};

GetA539();
