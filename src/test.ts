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
main();
