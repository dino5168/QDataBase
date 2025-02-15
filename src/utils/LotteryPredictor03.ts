import "tsconfig-paths/register";
import dotenv from "dotenv";
import * as tf from "@tensorflow/tfjs-node";
import {GetDB} from "QDBService";

dotenv.config();

interface LottoDraw {
  drawNumber: number;
  numbers: number[];
  openDate?: string;
}

interface LottoDBRecord {
  ID: number;
  Period: string;
  OpenDate: string;
  NO_1: string;
  NO_2: string;
  NO_3: string;
  NO_4: string;
  NO_5: string;
}

interface PredictionResult {
  predictedNumbers: number[];
  confidence: number[];
  modelAccuracy: number;
  trainingHistory: tf.History;
}

interface ModelConfig {
  sequenceLength: number;
  epochs: number;
  batchSize: number;
  lstmUnits: number;
}

class LotteryPredictor03 {
  private readonly MAX_NUMBER = 39;
  private readonly NUMBERS_PER_DRAW = 5;
  private model: tf.LayersModel | null = null;

  constructor(
    private readonly config: ModelConfig = {
      sequenceLength: 10,
      epochs: 50,
      batchSize: 16,
      lstmUnits: 50,
    }
  ) {}

  /**
   * 從資料庫獲取歷史開獎資料
   */
  private async fetchData(): Promise<LottoDraw[]> {
    try {
      let db = GetDB("Lottery");
      const result = await db.query<LottoDBRecord>(
        "SELECT * FROM L539 ORDER BY Period desc"
      );

      if (!result.data || !Array.isArray(result.data)) {
        console.error("查詢結果異常", result);
        return [];
      }

      return result.data
        .map((data) => this.transformLottoData(data))
        .filter((item): item is LottoDraw => item !== null);
    } catch (error) {
      console.error("獲取數據時出錯", error);
      return [];
    }
  }

  /**
   * 轉換資料格式
   */
  private transformLottoData(data: LottoDBRecord): LottoDraw | null {
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
  }

  /**
   * One-hot 編碼樂透號碼
   */
  private oneHotEncode(numbers: number[]): number[] {
    const encoding = new Array(this.MAX_NUMBER).fill(0);
    numbers.forEach((num) => {
      if (num >= 1 && num <= this.MAX_NUMBER) {
        encoding[num - 1] = 1;
      }
    });
    return encoding;
  }

  /**
   * 將 one-hot 編碼轉回號碼
   */
  private oneHotDecode(
    encoding: number[],
    count: number = this.NUMBERS_PER_DRAW
  ): number[] {
    return encoding
      .map((value, index) => ({value, index}))
      .sort((a, b) => b.value - a.value)
      .slice(0, count)
      .map((item) => item.index + 1)
      .sort((a, b) => a - b);
  }

  /**
   * 處理訓練數據
   */
  private preprocessData(history: LottoDraw[]): {
    input: number[][][];
    output: number[][];
  } {
    const sequences: number[][][] = [];
    const labels: number[][] = [];

    for (let i = 0; i < history.length - this.config.sequenceLength; i++) {
      const sequence = history
        .slice(i, i + this.config.sequenceLength)
        .map((draw) => this.oneHotEncode(draw.numbers));
      const label = this.oneHotEncode(
        history[i + this.config.sequenceLength].numbers
      );

      sequences.push(sequence);
      labels.push(label);
    }

    return {input: sequences, output: labels};
  }

  /**
   * 創建 LSTM 模型
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // 添加 LSTM 層
    model.add(
      tf.layers.lstm({
        units: this.config.lstmUnits,
        returnSequences: false,
        inputShape: [this.config.sequenceLength, this.MAX_NUMBER],
      })
    );

    // 添加 Dropout 層以防止過擬合
    model.add(tf.layers.dropout({rate: 0.2}));

    // 添加全連接層
    model.add(
      tf.layers.dense({
        units: this.MAX_NUMBER,
        activation: "softmax",
      })
    );

    // 編譯模型
    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  /**
   * 計算預測結果的信心度
   */
  private calculateConfidence(prediction: Float32Array): number[] {
    const sortedIndices = Array.from(prediction)
      .map((value, index) => ({value, index}))
      .sort((a, b) => b.value - a.value)
      .slice(0, this.NUMBERS_PER_DRAW);

    return sortedIndices.map((item) => item.value * 100);
  }

  /**
   * 訓練模型並進行預測
   */
  async predict(recentDraws: number = 200): Promise<PredictionResult> {
    // 獲取歷史數據
    const history = await this.fetchData();
    const recentHistory = history.slice(-recentDraws);

    if (recentHistory.length < this.config.sequenceLength + 1) {
      throw new Error("歷史數據不足以進行預測");
    }

    // 準備訓練數據
    const {input, output} = this.preprocessData(recentHistory);
    const xs = tf.tensor3d(input);
    const ys = tf.tensor2d(output);

    // 創建並訓練模型
    this.model = this.createModel();
    console.log("開始訓練模型...");

    const trainingHistory = await this.model.fit(xs, ys, {
      epochs: this.config.epochs,
      batchSize: this.config.batchSize,
      validationSplit: 0.1,
      verbose: 1,
    });

    // 準備預測數據
    const lastSequence = recentHistory
      .slice(-this.config.sequenceLength)
      .map((draw) => this.oneHotEncode(draw.numbers));

    const predictionInput = tf.tensor3d([lastSequence]);
    const prediction = this.model.predict(predictionInput) as tf.Tensor;
    const predictionData = prediction.dataSync() as Float32Array;

    // 處理預測結果
    const predictedNumbers = this.oneHotDecode(Array.from(predictionData));
    const confidence = this.calculateConfidence(predictionData);

    // 清理 tensors
    xs.dispose();
    ys.dispose();
    prediction.dispose();
    predictionInput.dispose();

    return {
      predictedNumbers,
      confidence,
      modelAccuracy: trainingHistory.history.accuracy
        ? (trainingHistory.history.accuracy.slice(-1)[0] as number)
        : 0,
      trainingHistory,
    };
  }

  /**
   * 銷毀模型，釋放記憶體
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

export default LotteryPredictor03;
