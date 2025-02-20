import * as tf from "@tensorflow/tfjs-node";
/**定義預測結果 */
export interface PredictionResult {
  predictedNumbers: number[];
  probability: number[];
  modelAccuracy: number;
  trainingHistory: tf.History;
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
}
