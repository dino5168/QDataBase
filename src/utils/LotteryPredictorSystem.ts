import "tsconfig-paths/register";
import dotenv from "dotenv";
import {Get539Data} from "@utils/UtilLottery";
import {GetDB} from "QDBService";

import LotteryPredictor from "@utils/LotteryPredictor";

import LotteryPredictor02 from "@utils/LotteryPredictor02";
import LotteryPredictor03 from "@utils/LotteryLSTM";

export class LotteryPredictorSystem {
  constructor() {}
}

/*
async function example() {
  const predictor = new LotteryPredictor02();
  const result = await predictor.predict(5, 200);

  console.log("號碼統計：", result.stats);
  console.log("預測號碼：", result.predictedNumbers);
}
example();
*/
function getAverage(arr: number[]) {
  if (arr.length === 0) return 0; // 避免除以零的錯誤
  const sum = arr.reduce((acc, num) => acc + num, 0);
  return sum / arr.length;
}
interface PredictResult {
  avrConfidence: number;
  numbers: number[];
}
//使用 dotenv  載入環境變數
dotenv.config();
async function main(dataNumbers: string): Promise<PredictResult | undefined> {
  const predictor = new LotteryPredictor03();

  try {
    // 訓練並預測樂透號碼
    const predictionResult = await predictor.predict(150, dataNumbers);

    // 輸出預測結果

    console.log("預測樂透號碼：", predictionResult.predictedNumbers);

    console.log("預測信心度：", predictionResult.confidence);
    const avrConfidence = getAverage(predictionResult.confidence);
    //console.log("預測信心度：", avrConfidence);

    console.log("模型準確度：", predictionResult.modelAccuracy);
    console.log("trainingHistory:", predictionResult.trainingHistory);
    //const avrConfidence = getAverage(predictionResult.modelAccuracy);
    return {
      avrConfidence: avrConfidence,
      numbers: predictionResult.predictedNumbers,
    };

    // 可選：檢視訓練歷史
    //console.log("訓練歷史：", predictionResult.trainingHistory);
  } catch (error) {
    console.error("預測過程中發生錯誤：", error);
  } finally {
    // 銷毀模型以釋放記憶體
    predictor.dispose();
  }
}
type NumberStats = {
  count: number;
  weightedCount: number;
};

function calculateNumberStats(
  data: PredictResult[]
): Record<number, NumberStats> {
  const numberStats: Record<number, NumberStats> = {};

  data.forEach(({avrConfidence, numbers}) => {
    numbers.forEach((num) => {
      if (!numberStats[num]) {
        numberStats[num] = {count: 0, weightedCount: 0};
      }
      numberStats[num].count += 1;
      numberStats[num].weightedCount += avrConfidence;
    });
  });

  return numberStats;
}
function sortByCount(
  stats: Record<number, NumberStats>
): [number, NumberStats][] {
  return Object.entries(stats)
    .map(([num, stat]) => [parseInt(num), stat] as [number, NumberStats])
    .sort((a, b) => b[1].count - a[1].count);
}
async function Run() {
  // 執行程式5次
  let arrPredictResult = [];
  // 300, 400 , 500 ?

  for (let i = 0; i < 10; i++) {
    let predictResult = await main("300");
    if (predictResult) {
      // if (predictResult.avrConfidence > 6) {
      arrPredictResult.push(predictResult);
      // }
    }
  }

  const stats = calculateNumberStats(arrPredictResult);
  const sortedStats = sortByCount(stats);
  console.log(sortedStats);
}

Run();
