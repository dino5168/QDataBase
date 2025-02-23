/*
2025-02-23

04,07,11,19,22
[06,14,13,5,32,19,18]
[22,27,08,12,01,11,23]
推薦號碼:
['14', '18', '01',  '06', '05', '15',  '27', '39', '02',  '12', '19', '20',  '09', '13']

 * 15
5,6,13,14,

*/
import "tsconfig-paths/register";
import dotenv from "dotenv";
import {Get539Data} from "@utils/UtilLottery";
import {GetDB} from "QDBService";
import LotteryPredictor from "@utils/LotteryPredictor";
import LotteryPredictor02 from "@utils/LotteryPredictor02";
import LotteryLSTM from "@utils/LotteryLSTM";
import {LotteryMath} from "@utils/math/LotteryMath";
import LotteryPredictor03 from "@utils/LotteryPredictor03";
import type {ModelConfig, PredictionResult} from "@utils/math/LotteryMath";

import fs from "fs";

import {
  GetLotteryData,
  GetLotteryDataNewFirst,
  LottoDraw,
} from "@utils/LotteryDB";
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
  const sourceData: LottoDraw[] = await GetLotteryDataNewFirst("500");
  const trainData = sourceData.slice(10, 310).reverse(); //需要重新排列
  console.log("trainData.length:", trainData.length);
  console.log("trainData:", trainData[trainData.length - 1]);

  predictor.setTrainData(trainData);
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
      predictNowData: sourceData[0],
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

//使用權重排序
function sortByCount(
  stats: Record<number, NumberStats>
): [number, NumberStats][] {
  return Object.entries(stats)
    .map(([num, stat]) => [parseInt(num), stat] as [number, NumberStats])
    .sort((a, b) => b[1].weightedCount - a[1].weightedCount);
}

async function Run() {
  let outputResults = [];
  for (let counter = 1; counter <= 100; counter++) {
    let outputResult = {
      csvString: "", //候選號碼
      intersectionString: "", //交集
      predictPreData: "", //開獎號碼
      predictNowData: "", //
    };

    const result = await LotteryMath.PredictedOne(
      counter,
      300 + counter,
      "1000"
    );
    console.log("predictPreData:,", result?.predictPreData);
    console.log("predictNowData:,", result?.predictNowData);
    console.log(result?.predictedNumbers);

    if (result?.predictPreData && result?.predictedNumbers) {
      const intersection: number[] = result.predictPreData.numbers.filter(
        (item: number) => result.predictedNumbers.includes(item) // 修改此行，應該是 compare predictPreData 和 predictNowData
      );
      console.log("Intersection:", intersection);

      outputResult.predictPreData = result?.predictPreData.numbers.join(",");
      outputResult.predictNowData = result?.predictNowData.numbers.join(",");
      outputResult.intersectionString = intersection.join(",");
    }

    const stringArray: string[] =
      result?.predictedNumbers?.map((num) =>
        num < 10 ? `0${num}` : num.toString()
      ) ?? [];
    const csvString: string = stringArray.join(",");
    outputResult.csvString = csvString;
    outputResults.push(outputResult);
  }
  //outputResults.forEach()
  const jsonString = JSON.stringify(outputResults, null, 2);
  fs.writeFileSync("C:/temp/output.json", jsonString, "utf-8");
}

function countOccurrences(arrays: number[][]): Record<number, number> {
  const frequencyMap: Record<number, number> = {};

  for (const array of arrays) {
    for (const num of array) {
      frequencyMap[num] = (frequencyMap[num] || 0) + 1;
    }
  }

  return frequencyMap;
}

async function RunOne() {
  let resultArray: number[][] = [];
  for (let index = 0; index < 1; index++) {
    const result = await LotteryMath.PredictedOne(0, 300, "500");
    console.log("predictPreData:,", result?.predictPreData);
    console.log("predictNowData:,", result?.predictNowData);
    console.log(result?.predictedNumbers);
    if (result) {
      resultArray.push(result?.predictedNumbers);
    }
  }
  //console.log(resultArray);
  const occurrences = countOccurrences(resultArray);
  console.log(occurrences);

  /*
  if (result?.predictPreData && result?.predictedNumbers) {
    const intersection: number[] = result.predictPreData.numbers.filter(
      (item: number) => result.predictedNumbers.includes(item) // 修改此行，應該是 compare predictPreData 和 predictNowData
    );
    console.log("Intersection:", intersection);
  }
  */
}

RunOne();
//main("300");
/*
const arrZero = LotteryMath.ZeroOne(39, 0);      
console.log(arrZero); 
const openNumbers = [39]; 
const hot = LotteryMath.OneHotEncode(openNumbers, 39);
console.log(hot);
const hotDecode = LotteryMath.OneHotDecode(hot, 39);
console.log(hotDecode);
*/
