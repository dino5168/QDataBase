import "tsconfig-paths/register";
import dotenv from "dotenv";
import * as tf from "@tensorflow/tfjs-node";
import {GetDB} from "QDBService";
import type {LottoDraw, LottoDBRecord} from "@utils/LotteryDB";
import {GetLotteryData} from "@utils/LotteryDB";
import {LotteryBase} from "./LotteryBase";
import {LotteryMath} from "./LotteryMath";

dotenv.config();

interface PredictionResult {
  predictedNumbers: number[]; //預測號碼
  probability: number[]; //或然率
  modelAccuracy: number; //模型精確度
  trainingHistory: tf.History; //訓練的歷史資料
}

interface ModelConfig {
  sequenceLength: number; //用幾組歷史開獎號碼來預測未來號碼（默認 20）。
  epochs: number;
  batchSize: number; //訓練時每次處理的數據量
  lstmUnits: number;
}

export class LotteryLSTM {
  private readonly MAX_NUMBER = 39;
  private readonly NUMBERS_PER_DRAW = 10;
  private model: tf.LayersModel | null = null;
  //lstmUnits LSTM 層的單元數 (神經元數量)
  constructor(
    private readonly config: ModelConfig = {
      sequenceLength: 25,
      epochs: 40,
      batchSize: 32,
      lstmUnits: 50,
    }
  ) {}
  /**
   * 從資料庫獲取歷史開獎資料
   */
  private async fetchData(dataNumbers: string): Promise<LottoDraw[]> {
    //參數需給 300
    //集成學習 ----預測信心度：挑選高的
    return await GetLotteryData(dataNumbers);
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
        .map((draw) => LotteryMath.OneHotEncode(draw.numbers));
      const label = LotteryMath.OneHotEncode(
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
   * 訓練模型並進行預測
   */
  async predict(
    recentDraws: number = 150,
    dataNumbers: string,
    dataRange: number = 10
  ): Promise<PredictionResult> {
    // 獲取歷史數據
    const history = await this.fetchData(dataNumbers); //歷史紀錄
    console.log("history.length:", history.length);
    console.log("recentDraws:", recentDraws);
    const recentHistory = history.slice(-recentDraws); //最近歷史紀錄

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
      .map((draw) => LotteryMath.OneHotEncode(draw.numbers));

    const predictionInput = tf.tensor3d([lastSequence]);
    const prediction = this.model.predict(predictionInput) as tf.Tensor;
    const probabilityData = prediction.dataSync() as Float32Array; //取得預測結果機率值。
    console.log("predictionInput:", predictionInput);
    console.log("predictionData Length :", probabilityData.length);
    // 處理預測結果
    const predictedNumbers = LotteryMath.OneHotDecodeV2(
      Array.from(probabilityData),
      dataRange
    );
    console.log("predictedNumbers:", predictedNumbers);
    console.log("probabilityData:", probabilityData);
    const probability = LotteryMath.Sort_Slice(probabilityData, dataRange);

    //console.log("probability:", probability);
    //console.log("================================");

    // 清理 tensors
    xs.dispose();
    ys.dispose();
    prediction.dispose();
    predictionInput.dispose();

    return {
      predictedNumbers,
      probability,
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

export default LotteryLSTM;
