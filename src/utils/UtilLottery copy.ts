import fs from "fs";

// 定義樂透數據結構
interface LottoDraw {
  drawNumber: number; // 期號
  numbers: number[]; // 開獎號碼
}

// 計算兩組號碼之間的相似度（使用 Jaccard 相似度）
function jaccardSimilarity(setA: Set<number>, setB: Set<number>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x))).size;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// 讀取歷史開獎數據
function loadLottoData(filePath: string): LottoDraw[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as LottoDraw[];
}

// k-NN 選號邏輯
function predictLottoNumbers(history: LottoDraw[], k: number = 5): number[] {
  if (history.length < k) {
    throw new Error("歷史數據不足以進行預測");
  }

  // 取得最新一期的號碼作為基準
  const latestDraw = history[history.length - 1];
  const latestNumbers = new Set(latestDraw.numbers);

  // 計算與歷史期數的相似度
  const similarities = history.slice(0, -1).map((draw) => ({
    drawNumber: draw.drawNumber,
    numbers: draw.numbers,
    similarity: jaccardSimilarity(latestNumbers, new Set(draw.numbers)),
  }));

  // 取最相似的 k 期
  similarities.sort((a, b) => b.similarity - a.similarity);
  const nearestNeighbors = similarities.slice(0, k);

  // 統計這些期數中最常出現的號碼
  const numberFrequency = new Map<number, number>();
  nearestNeighbors.forEach((neighbor) => {
    neighbor.numbers.forEach((num) => {
      numberFrequency.set(num, (numberFrequency.get(num) || 0) + 1);
    });
  });

  // 取出出現次數最多的 6 個號碼作為預測結果
  return [...numberFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map((entry) => entry[0]);
}

// 測試程式
const lottoHistory = loadLottoData("lotto_data.json"); // 確保你有 lotto_data.json
const predictedNumbers = predictLottoNumbers(lottoHistory, 5);
console.log("推薦的樂透號碼:", predictedNumbers);

/****************************/

// 定義樂透數據結構
interface LottoDraw {
  drawNumber: number; // 期號
  numbers: number[]; // 開獎號碼
}

// 讀取歷史開獎數據
function loadLottoData(filePath: string): LottoDraw[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as LottoDraw[];
}

// 統計號碼的出現次數
function calculateNumberFrequency(history: LottoDraw[]): Map<number, number> {
  const frequency = new Map<number, number>();
  history.forEach((draw) => {
    draw.numbers.forEach((num) => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });
  });
  return frequency;
}

// 使用蒙特卡洛模擬選號
function monteCarloLottoPrediction(
  history: LottoDraw[],
  simulations: number = 100000
): number[] {
  const frequency = calculateNumberFrequency(history);
  const weightedNumbers: number[] = [];

  // 根據頻率加權
  frequency.forEach((count, num) => {
    for (let i = 0; i < count; i++) {
      weightedNumbers.push(num);
    }
  });

  const simulationResults = new Map<number, number>();

  for (let i = 0; i < simulations; i++) {
    const simulatedDraw = new Set<number>();
    while (simulatedDraw.size < 6) {
      const randomIndex = Math.floor(Math.random() * weightedNumbers.length);
      simulatedDraw.add(weightedNumbers[randomIndex]);
    }

    simulatedDraw.forEach((num) => {
      simulationResults.set(num, (simulationResults.get(num) || 0) + 1);
    });
  }

  // 選擇出現次數最多的 6 個號碼
  return [...simulationResults.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map((entry) => entry[0]);
}

// 測試程式
const lottoHistory = loadLottoData("lotto_data.json"); // 確保你有 lotto_data.json
const predictedNumbers = monteCarloLottoPrediction(lottoHistory, 100000);
console.log("推薦的樂透號碼 (蒙特卡洛模擬):", predictedNumbers);

/**********ml-arima********* */
import fs from "fs";
import {ARIMA} from "ml-arima";

// 定義樂透數據結構
interface LottoDraw {
  drawNumber: number;
  numbers: number[];
}

// 讀取歷史樂透數據
function loadLottoData(filePath: string): LottoDraw[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as LottoDraw[];
}

// 計算特定號碼的時間序列數據
function getNumberFrequency(
  history: LottoDraw[],
  targetNumber: number
): number[] {
  return history.map((draw) => (draw.numbers.includes(targetNumber) ? 1 : 0));
}

// 使用 ARIMA 預測某個號碼未來出現的機率
function predictWithARIMA(
  history: LottoDraw[],
  targetNumber: number,
  futurePeriods: number = 5
): number[] {
  const frequencySeries = getNumberFrequency(history, targetNumber);

  const arima = new ARIMA({p: 2, d: 1, q: 2}); // p, d, q 參數可調整
  arima.fit(frequencySeries);

  return arima.predict(futurePeriods);
}

// 測試程式
const lottoHistory = loadLottoData("lotto_data.json"); // 確保你有 lotto_data.json
const targetNumber = 18; // 想分析的號碼
const predictions = predictWithARIMA(lottoHistory, targetNumber, 5);
console.log(`未來 5 期內號碼 ${targetNumber} 出現的機率:`, predictions);

/************使用 LSTM 預測樂透號碼模式****************************/

import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";

// 定義樂透數據結構
interface LottoDraw {
  drawNumber: number;
  numbers: number[];
}

const TOTAL_NUMBERS = 39; // 樂透號碼範圍 1~39
const SEQUENCE_LENGTH = 10; // 取過去 10 期來預測下一期
const EPOCHS = 50;
const BATCH_SIZE = 16;

// 讀取樂透數據
function loadLottoData(filePath: string): LottoDraw[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as LottoDraw[];
}

// 轉換數據為 one-hot encoding
function preprocessData(history: LottoDraw[]): {
  input: number[][][];
  output: number[][];
} {
  const sequences: number[][][] = [];
  const labels: number[][] = [];

  for (let i = 0; i < history.length - SEQUENCE_LENGTH; i++) {
    const sequence = history
      .slice(i, i + SEQUENCE_LENGTH)
      .map((draw) => oneHotEncode(draw.numbers));
    const label = oneHotEncode(history[i + SEQUENCE_LENGTH].numbers);

    sequences.push(sequence);
    labels.push(label);
  }
  return {input: sequences, output: labels};
}

// One-hot 編碼樂透號碼
function oneHotEncode(numbers: number[]): number[] {
  const encoding = new Array(TOTAL_NUMBERS).fill(0);
  numbers.forEach((num) => (encoding[num - 1] = 1));
  return encoding;
}

// 建立 LSTM 模型
function createLSTMModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 50,
      returnSequences: false,
      inputShape: [SEQUENCE_LENGTH, TOTAL_NUMBERS],
    })
  );
  model.add(tf.layers.dense({units: TOTAL_NUMBERS, activation: "softmax"}));
  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}

async function trainAndPredict() {
  const history = loadLottoData("lotto_data.json");
  const {input, output} = preprocessData(history);

  const xs = tf.tensor3d(input);
  const ys = tf.tensor2d(output);

  const model = createLSTMModel();
  console.log("開始訓練模型...");
  await model.fit(xs, ys, {epochs: EPOCHS, batchSize: BATCH_SIZE});

  console.log("訓練完成，進行預測...");
  const lastSequence = tf.tensor3d([input[input.length - 1]]);
  const prediction = model.predict(lastSequence) as tf.Tensor;
  const predictedNumbers = tf
    .argMax(prediction, 1)
    .dataSync()
    .slice(0, 6)
    .map((n) => n + 1);

  console.log("LSTM 預測的樂透號碼:", predictedNumbers);
}

trainAndPredict();
