import "tsconfig-paths/register";
import dotenv from "dotenv";
import {Get539Data} from "@utils/UtilLottery";
import {GetDB} from "QDBService";

dotenv.config();

interface LottoDraw {
  drawNumber: number;
  numbers: number[];
  openDate?: string; // 添加開獎日期
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
  number: number;
  frequency: number;
  lastAppearance: number;
  hotStreak: number;
}

class LotteryPredictor {
  private readonly MAX_NUMBER = 39; // 539樂透最大號碼
  private readonly NUMBERS_PER_DRAW = 5; // 每期開出號碼數

  private transformLottoData(data: LottoDBRecord): LottoDraw | null {
    const drawNumber = parseInt(data.Period, 10);
    const numbers = [
      parseInt(data.NO_1, 10),
      parseInt(data.NO_2, 10),
      parseInt(data.NO_3, 10),
      parseInt(data.NO_4, 10),
      parseInt(data.NO_5, 10),
    ].sort((a, b) => a - b); // 確保號碼有序

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

  async fetchData(): Promise<LottoDraw[]> {
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
   * 計算號碼統計信息
   * @param history 歷史開獎記錄
   * @param recentDraws 考慮最近幾期的數據
   */
  private calculateNumberStats(
    history: LottoDraw[],
    recentDraws: number
  ): Map<number, NumberStats> {
    const stats = new Map<number, NumberStats>();

    // 初始化統計資料
    for (let i = 1; i <= this.MAX_NUMBER; i++) {
      stats.set(i, {
        number: i,
        frequency: 0,
        lastAppearance: 0,
        hotStreak: 0,
      });
    }

    // 只分析最近 n 期數據
    const recentHistory = history.slice(-recentDraws);

    recentHistory.forEach((draw, index) => {
      draw.numbers.forEach((num) => {
        const stat = stats.get(num)!;
        stat.frequency++;
        stat.lastAppearance = index;

        // 計算熱度（連續出現的次數）
        if (index > 0 && recentHistory[index - 1].numbers.includes(num)) {
          stat.hotStreak++;
        } else {
          stat.hotStreak = 0;
        }
      });
    });

    return stats;
  }

  /**
   * 計算兩組號碼的相似度
   */
  private calculateSimilarity(
    numbers1: number[],
    numbers2: number[],
    stats: Map<number, NumberStats>
  ): number {
    const set1 = new Set(numbers1);
    const set2 = new Set(numbers2);

    // Jaccard 相似度
    const intersection = new Set([...set1].filter((x) => set2.has(x))).size;
    const union = new Set([...set1, ...set2]).size;
    const jaccardScore = intersection / union;

    // 考慮號碼熱度
    const heatScore =
      numbers2.reduce((sum, num) => {
        const stat = stats.get(num)!;
        return sum + (stat.frequency / stat.lastAppearance || 0);
      }, 0) / numbers2.length;

    // 綜合評分
    return jaccardScore * 0.7 + heatScore * 0.3;
  }

  /**
   * 使用改進的算法預測下一期號碼
   * @param history 歷史開獎記錄
   * @param k 參考的相似期數
   * @param recentDraws 考慮最近幾期的數據
   */
  predictLottoNumbers(
    history: LottoDraw[],
    k: number = 5,
    recentDraws: number = 100
  ): number[] {
    if (history.length < k) {
      throw new Error("歷史數據不足以進行預測");
    }

    // 計算號碼統計信息
    const stats = this.calculateNumberStats(history, recentDraws);

    // 取得最新一期的號碼
    const latestDraw = history[history.length - 1];

    // 計算與歷史期數的相似度
    const similarities = history.slice(0, -1).map((draw) => ({
      drawNumber: draw.drawNumber,
      numbers: draw.numbers,
      similarity: this.calculateSimilarity(
        latestDraw.numbers,
        draw.numbers,
        stats
      ),
    }));

    // 選擇最相似的 k 期
    similarities.sort((a, b) => b.similarity - a.similarity);
    const nearestNeighbors = similarities.slice(0, k);

    // 統計號碼出現頻率並考慮統計信息
    const scoreMap = new Map<number, number>();

    for (let i = 1; i <= this.MAX_NUMBER; i++) {
      const stat = stats.get(i)!;
      let score = 0;

      // 基礎分數：在相似期數中的出現次數
      nearestNeighbors.forEach((neighbor) => {
        if (neighbor.numbers.includes(i)) {
          score += neighbor.similarity;
        }
      });

      // 考慮統計特徵
      score *= 1 + stat.frequency / recentDraws; // 考慮整體出現頻率
      score *= 1 + 1 / (stat.lastAppearance + 1); // 考慮最近出現時間
      score *= 1 + stat.hotStreak * 0.1; // 考慮連續出現次數

      scoreMap.set(i, score);
    }

    // 根據綜合評分選擇號碼
    return [...scoreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);
  }

  /**
   * 執行預測並返回詳細分析
   */
  async predict(
    k: number = 25,
    recentDraws: number = 100
  ): Promise<{
    predictedNumbers: number[];
    stats: Map<number, NumberStats>;
  }> {
    const lotteryData = await this.fetchData();
    lotteryData.reverse();

    const stats = this.calculateNumberStats(lotteryData, recentDraws);
    const predictedNumbers = this.predictLottoNumbers(
      lotteryData,
      k,
      recentDraws
    );

    return {
      predictedNumbers,
      stats,
    };
  }
}

export default LotteryPredictor;
