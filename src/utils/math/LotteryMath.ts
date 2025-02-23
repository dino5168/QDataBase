import * as tf from "@tensorflow/tfjs-node";
import LotteryLSTM from "../LotteryLSTM";
import {GetLotteryDataNewFirst, LottoDraw} from "../LotteryDB";
/**定義預測結果 */
export interface PredictionResult {
  predictedNumbers: number[];
  probability: number[];
  modelAccuracy: number;
  trainingHistory: tf.History;
  predictNowData: LottoDraw;
  predictPreData?: LottoDraw;
}

/*定義LSTM 模型參數*/
export interface ModelConfig {
  sequenceLength: number; //用幾組歷史開獎號碼來預測未來號碼（默認 20）。
  epochs: number;
  batchSize: number; //訓練時每次處理的數據量
  lstmUnits: number;
}

export type NumberStats = {
  count: number;
  weightedCount: number;
};

export const LightColorMap: Record<number, string> = {
  1: "#FFDDC1",
  2: "#FFEEB4",
  3: "#FDFD96",
  4: "#D4F4DD",
  5: "#C1E1C1",
  6: "#A7D8DE",
  7: "#C1E0FF",
  8: "#D7C1FF",
  9: "#F4C1FF",
  10: "#FFD1DC",
  11: "#FFDAC1",
  12: "#FFF5BA",
  13: "#D6E9FE",
  14: "#C1FFC1",
  15: "#AEEEEE",
  16: "#B0E0E6",
  17: "#C6E2FF",
  18: "#D8BFD8",
  19: "#E6E6FA",
  20: "#FAFAD2",
  21: "#E0FFFF",
  22: "#F0FFF0",
  23: "#F5FFFA",
  24: "#F0F8FF",
  25: "#FFF0F5",
  26: "#FFFACD",
  27: "#E6F2FF",
  28: "#D1EEFC",
  29: "#D8FFDA",
  30: "#F4E1D2",
  31: "#E8D8C4",
  32: "#E6E0D4",
  33: "#FFE4E1",
  34: "#FFDAB9",
  35: "#E3DAC9",
  36: "#F0E68C",
  37: "#E6E6FA",
  38: "#BFEFFF",
  39: "#D9F9B1",
};
/***數學函數 */
export class LotteryMath {
  constructor() {}
  /**計算平均值 */
  public static Average = (arr: number[]) => {
    if (arr.length === 0) return 0; // 避免除以零的錯誤
    const sum = arr.reduce((acc, num) => acc + num, 0);
    return sum / arr.length;
  };

  //產生一個一維陣列
  public static ZeroOne(numbers: number, fillNumber: number = 0) {
    return new Array(numbers).fill(fillNumber);
  }
  /**
   * One-hot 編碼樂透號碼
   */
  public static OneHotEncode(
    numbers: number[],
    maxNumber: number = 39
  ): number[] {
    const encoding = LotteryMath.ZeroOne(maxNumber);
    numbers.forEach((num) => {
      if (num >= 1 && num <= maxNumber) {
        encoding[num - 1] = 1;
      }
    });
    return encoding;
  }

  public static OneHotDecodeSource(encoding: number[]): number[] {
    const numbers: number[] = [];

    encoding.forEach((value, index) => {
      if (value === 1) {
        numbers.push(index + 1); // One-Hot 的索引對應到實際數字 (從 1 開始)
      }
    });

    return numbers;
  }

  /**
   * 將 one-hot 編碼轉回號碼
   */
  public static OneHotDecode(
    encoding: number[],
    maxNumber: number = 7
  ): number[] {
    return encoding
      .map((value, index) => ({value, index}))
      .sort((a, b) => b.value - a.value)
      .slice(0, maxNumber)
      .map((item) => item.index + 1)
      .sort((a, b) => a - b);
  }
  // 在 LotteryMath 類中
  public static OneHotDecodeV2(
    probabilities: number[],
    count: number = 7
  ): number[] {
    // 將機率陣列轉換為索引和機率的對象陣列
    const indexedProbs = probabilities.map((prob, index) => ({
      index: index + 1,
      probability: prob,
    }));

    // 按機率降序排序
    const sorted = indexedProbs.sort((a, b) => b.probability - a.probability);

    // 返回指定數量最高機率的索引
    return sorted.slice(0, count).map((item) => item.index);
  }
  /**
   * 計算預測結果的信心度
   */
  public static Sort_Slice(
    prediction: Float32Array,
    sliceNumber: number = 10
  ): number[] {
    const sortedIndices = Array.from(prediction)
      .map((value, index) => ({value, index}))
      .sort((a, b) => b.value - a.value)
      .slice(0, sliceNumber);

    return sortedIndices.map((item) => item.value * 100);
  }
  //合併兩個陣列
  public static MergeArrays(
    numbers: number[],
    probability: number[]
  ): {number: number; confidence: number}[] {
    if (numbers.length !== probability.length) {
      throw new Error("Arrays must have the same length");
    }

    return numbers.map((num, index) => ({
      number: num,
      confidence: probability[index],
    }));
  }

  //執行一次 LSTM 預測
  public static async PredictedOne(
    from: number,
    to: number,
    dataNumbers: string
  ): Promise<PredictionResult | undefined> {
    //訓練模型參數 :
    const config: ModelConfig = {
      sequenceLength: 21,
      epochs: 50, //訓練次數
      batchSize: 7,
      lstmUnits: 50, //神經元
    };
    // 參數 ep:30 lst:50 300 , 50 , 150
    const predictor = new LotteryLSTM(config);
    const tranRecodSize = 150;
    const dataRange = 18;
    //sequenceLength < transRecordSize
    const sourceData: LottoDraw[] = await GetLotteryDataNewFirst(dataNumbers);
    const predictNowData = sourceData[from];
    let predictPreData = undefined;
    if (from > 0) {
      predictPreData = sourceData[from - 1];
    }

    const trainData = sourceData.slice(from, to).reverse(); //需要重新排列
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
        predictNowData: predictNowData,
        predictPreData: predictPreData,
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

  public static Sort_Count(data: Record<string, number>): [string, number][] {
    return Object.entries(data).sort((a, b) => b[1] - a[1]); // 根據值進行升序排序
  }

  //將數字轉成文字 1-> 01
  public static Number_To_String(sort_data: [string, number][]): string[] {
    const str_arr_num: string[] = [];

    Object.entries(sort_data).forEach(([_, value]) => {
      const num = parseInt(value.toString(), 10); // 轉換數字為字串再解析
      const str_num = num < 10 ? `0${num}` : `${num}`;
      str_arr_num.push(str_num);

      console.log(str_num);
    });
    return str_arr_num; // 返回結果
  }

  //產生補數陣列
  public static getComplementNumbers(
    numbers: number[],
    maxNumber: number = 39
  ): number[] {
    const numberSet = new Set(numbers); // 使用 Set 方便查找
    const complement: number[] = [];

    for (let i = 1; i <= maxNumber; i++) {
      if (!numberSet.has(i)) {
        complement.push(i);
      }
    }

    return complement;
  }
}
