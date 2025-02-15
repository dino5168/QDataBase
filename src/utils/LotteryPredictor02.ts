import "tsconfig-paths/register";
import dotenv from "dotenv";
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

interface NumberStats {
  frequency: number; // 出現頻率
  lastAppearance: number; // 最後出現期數
  streak: number; // 連續出現次數
  gapsSinceLastDraw: number; // 距離上次開出的期數
}

interface SimulationResult {
  predictedNumbers: number[]; // 預測號碼
  confidence: number[]; // 每個號碼的信心度
  stats: Map<number, NumberStats>; // 詳細統計資料
  rawSimulationData: Map<number, number>; // 原始模擬結果
}

class LotteryPredictor02 {
  private readonly MAX_NUMBER = 39;
  private readonly NUMBERS_PER_DRAW = 5;

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
   * 計算每個號碼的詳細統計資料
   */
  private calculateNumberStats(history: LottoDraw[]): Map<number, NumberStats> {
    const stats = new Map<number, NumberStats>();

    // 初始化統計資料
    for (let i = 1; i <= this.MAX_NUMBER; i++) {
      stats.set(i, {
        frequency: 0,
        lastAppearance: history.length, // 預設為最大期數
        streak: 0,
        gapsSinceLastDraw: history.length,
      });
    }

    // 計算統計資料
    history.forEach((draw, index) => {
      const currentNumbers = new Set(draw.numbers);

      for (let num = 1; num <= this.MAX_NUMBER; num++) {
        const stat = stats.get(num)!;

        if (currentNumbers.has(num)) {
          stat.frequency++;
          stat.lastAppearance = index;
          stat.streak =
            index > 0 && history[index - 1].numbers.includes(num)
              ? stat.streak + 1
              : 1;
          stat.gapsSinceLastDraw = 0;
        } else {
          stat.streak = 0;
          if (stat.gapsSinceLastDraw < history.length) {
            stat.gapsSinceLastDraw++;
          }
        }
      }
    });

    return stats;
  }

  /**
   * 計算號碼的權重
   */
  private calculateWeights(
    stats: Map<number, NumberStats>,
    totalDraws: number
  ): Map<number, number> {
    const weights = new Map<number, number>();

    stats.forEach((stat, num) => {
      // 基礎權重：出現頻率
      let weight = stat.frequency / totalDraws;

      // 調整因子：根據距離上次開出的期數
      const recencyFactor = Math.exp(-stat.gapsSinceLastDraw / totalDraws);

      // 調整因子：連續出現次數
      const streakFactor = 1 + stat.streak * 0.1;

      // 計算最終權重
      const finalWeight = Math.round(
        weight * recencyFactor * streakFactor * 1000
      );
      weights.set(num, Math.max(1, finalWeight)); // 確保至少有基礎權重
    });

    return weights;
  }

  /**
   * 執行蒙特卡洛模擬
   */
  private monteCarloSimulation(
    weights: Map<number, number>,
    simulations: number
  ): Map<number, number> {
    const results = new Map<number, number>();
    const weightedNumbers: number[] = [];

    // 根據權重建立號碼池
    weights.forEach((weight, num) => {
      for (let i = 0; i < weight; i++) {
        weightedNumbers.push(num);
      }
    });

    // 執行模擬
    for (let i = 0; i < simulations; i++) {
      const simulatedDraw = new Set<number>();

      // 選出指定數量的號碼
      while (simulatedDraw.size < this.NUMBERS_PER_DRAW) {
        const randomIndex = Math.floor(Math.random() * weightedNumbers.length);
        simulatedDraw.add(weightedNumbers[randomIndex]);
      }

      // 統計結果
      simulatedDraw.forEach((num) => {
        results.set(num, (results.get(num) || 0) + 1);
      });
    }

    return results;
  }

  /**
   * 計算預測結果的信心度
   */
  private calculateConfidence(
    numbers: number[],
    simulationResults: Map<number, number>,
    totalSimulations: number
  ): number[] {
    return numbers.map((num) => {
      const simCount = simulationResults.get(num) || 0;
      return (simCount / totalSimulations) * 100;
    });
  }

  /**
   * 執行預測
   * @param simulations 模擬次數
   * @param recentDraws 考慮最近幾期的數據
   */
  async predict(
    simulations: number = 100000,
    recentDraws: number = 100
  ): Promise<SimulationResult> {
    // 獲取歷史數據
    const allHistory = await this.fetchData();
    const history = allHistory.slice(-recentDraws);

    // 計算統計資料
    const stats = this.calculateNumberStats(history);

    // 計算權重
    const weights = this.calculateWeights(stats, history.length);

    // 執行蒙特卡洛模擬
    const simulationResults = this.monteCarloSimulation(weights, simulations);

    // 選出預測號碼（取模擬中出現頻率最高的號碼）
    const predictedNumbers = [...simulationResults.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);

    // 計算信心度
    const confidence = this.calculateConfidence(
      predictedNumbers,
      simulationResults,
      simulations
    );

    return {
      predictedNumbers,
      confidence,
      stats,
      rawSimulationData: simulationResults,
    };
  }
}

export default LotteryPredictor02;
