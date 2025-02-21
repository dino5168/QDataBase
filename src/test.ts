import "tsconfig-paths/register";
import dotenv from "dotenv";
import {Get539Data} from "@utils/UtilLottery";
import {GetDB} from "QDBService";

import LotteryPredictor from "@utils/LotteryPredictor";

import LotteryPredictor02 from "@utils/LotteryPredictor02";
import LotteryLSTM from "@utils/LotteryLSTM";
import {LotteryMath} from "@utils/LotteryMath";
import LotteryPredictor03 from "@utils/LotteryPredictor03";
import type {ModelConfig, PredictionResult} from "@utils/LotteryMath";
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
function getAverage(arr: number[]) {
  if (arr.length === 0) return 0; // 避免除以零的錯誤
  const sum = arr.reduce((acc, num) => acc + num, 0);
  return sum / arr.length;
}
//使用 dotenv  載入環境變數
dotenv.config();
async function main(
  dataNumbers: string
): Promise<PredictionResult | undefined> {
  //訓練模型參數 :
  const config: ModelConfig = {
    sequenceLength: 50,
    epochs: 30, //訓練次數
    batchSize: 32,
    lstmUnits: 50, //神經元
  };
  // 參數 ep:30 lst:50 300 , 50 , 150
  const predictor = new LotteryLSTM(config);
  const tranRecodSize = 150;
  const dataRange = 18;
  //sequenceLength < transRecordSize
  try {
    // 訓練並預測樂透號碼
    const predictionResult = await predictor.predict(
      tranRecodSize,
      dataNumbers,
      dataRange
    );
    return {
      probability: predictionResult.probability,
      predictedNumbers: predictionResult.predictedNumbers,
      trainingHistory: predictionResult.trainingHistory,
      modelAccuracy: predictionResult.modelAccuracy,
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
  data: PredictionResult[]
): Record<number, NumberStats> {
  const numberStats: Record<number, NumberStats> = {};

  data.forEach(({probability, predictedNumbers}) => {
    predictedNumbers.forEach((num, index) => {
      if (!numberStats[num]) {
        numberStats[num] = {count: 0, weightedCount: 0};
      }
      numberStats[num].count += 1;
      numberStats[num].weightedCount += probability[index];
    });
  });

  return numberStats;
}

function sortByCount(
  stats: Record<number, NumberStats>
): [number, NumberStats][] {
  return Object.entries(stats)
    .map(([num, stat]) => [parseInt(num), stat] as [number, NumberStats])
    .sort((a, b) => b[1].weightedCount - a[1].weightedCount);
}
async function Run() {
  // 執行程式5次
  let arrPredictResult = [];
  // 300, 400 , 500 ?

  for (let i = 0; i < 10; i++) {
    let predictResult = await main("300");
    if (predictResult) {
      console.log(predictResult.predictedNumbers);
      console.log(predictResult.probability);

      console.log(predictResult.trainingHistory);

      arrPredictResult.push(predictResult);
    }
  }

  const stats = calculateNumberStats(arrPredictResult);
  const sortedStats = sortByCount(stats);
  console.log(sortedStats);
}

//Run();
main("300");
/*
const arrZero = LotteryMath.ZeroOne(39, 0);
console.log(arrZero);
const openNumbers = [39];
const hot = LotteryMath.OneHotEncode(openNumbers, 39);
console.log(hot);
const hotDecode = LotteryMath.OneHotDecode(hot, 39);
console.log(hotDecode);
*/
