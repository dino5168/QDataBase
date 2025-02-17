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
  for (let i = 0; i < 10; i++) {
    let predictResult = await main("350");
    if (predictResult) {
      // if (predictResult.avrConfidence > 6) {
      arrPredictResult.push(predictResult);
      // }
    }
  }

  for (let i = 0; i < 10; i++) {
    let predictResult = await main("400");
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

//Run();
//main("300");
import {LotteryCanvas} from "@utils/LotteryCanvas";
import {GridImageGenerator} from "@utils/GridImageGenerator";

function fillPrediction(arr: number[], numbers: string[]): number[] {
  numbers.forEach((num) => {
    const index = parseInt(num, 10) - 1; // Convert string "01" to index 0, "03" to index 2, etc.
    if (index >= 0 && index < arr.length) {
      arr[index] = 1;
    }
  });
  return arr; // Return the modified arr instead of numbers
}
// Usage example
const example = async () => {
  try {
    // Use the static factory method instead of new
    const drawChart = await LotteryCanvas.create("25");
    const lotteryData = drawChart.getLotteryData();
    console.log(lotteryData);

    // Create a 2D array with 5 rows (for 5 periods) and 39 columns (for the numbers 1 to 39), initialized to 0
    let result: number[][] = Array.from({length: lotteryData.length}, () =>
      Array(39).fill(0)
    );

    // Fill in the corresponding numbers with 1
    lotteryData.forEach((data, index) => {
      [data.NO_1, data.NO_2, data.NO_3, data.NO_4, data.NO_5].forEach((no) => {
        const number = parseInt(no, 10) - 1; // Convert to 0-based index
        result[index][number] = 1; // Set the corresponding number's position to 1
      });
    });
    console.log(result);
    result.reverse();
    //
    let arr5391D: number[] = Array.from({length: 39}, () => 0);
    let predictNumbers = [
      "07",
      "13",
      "12",
      "18",
      "08",
      "05",
      "11",
      "20",
      "03",
      "09",
      "35",
      "23",
      "26",
      "31",
      "01",
      "29",
      "32",
      "06",
      "14",
      "22",
      "24",
    ];
    let fitNumbers = fillPrediction(arr5391D, predictNumbers);
    result.push(fitNumbers);

    console.log("fitNumbers:", fitNumbers);

    const imageGenerator = new GridImageGenerator(result, "C:/temp/539.png", {
      cellSize: 25,
      activeColor: "#FF6347",
      inactiveColor: "#F0F0F0",
      gridLineColor: "#B0B0B0",
      lineWidth: 2,
    });
    imageGenerator.generateImage();
    // console.log(result);
    //const tableData = drawChart.generateTable(lotteryData);
    //console.log(tableData);

    //console.log(tableData.header);

    // 確認資料和排序
    /*

    tableData.rows.forEach((row) => {
      console.log(row);
    });
    */
  } catch (error) {
    console.error("Error in lottery chart creation:", error);
  }
};

example();
