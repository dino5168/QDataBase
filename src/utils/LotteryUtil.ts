import {QueryResult} from "@lib/QDataBase/types";
import {GetDB} from "QDBService";
import {LotteryMath} from "@utils/math/LotteryMath";
import LotteryLSTM from "@utils/LotteryLSTM";

interface PredictResult {
  avrConfidence: number;
  numbers: number[];
}

export interface LotteryData {
  ID: number;
  Period: number;
  OpenDate: string;
  NO_1: string;
  NO_2: string;
  NO_3: string;
  NO_4: string;
  NO_5: string;
}

export interface TableData {
  header: string[];
  rows: Record<string, string | number>[];
}
export interface FindMatch {
  PredictNumber: number;
  CompareNumber: number;
  FirstPos: number; //第一次出現的位置
  Result: number[][];
}

//比較結果定義
export interface RelationPredictCompare {
  predictNumber: number; //預測號碼
  compareNumber: number; //比較的號碼
  firstPos: number; //比較號碼第一次出現位置
  result: number[][]; //比較結果
}
export interface NumberCounter {
  num: number;
  counter: number;
}

export class LotteryUtil {
  //產生一個 x *  y 的 2D
  public static ZeroArray = (xsize: number, ysize: number): number[][] => {
    let result: number[][] = Array.from({length: ysize}, () =>
      Array(xsize).fill(0)
    );
    return result;
  };

  public static ZeroOneArray = (
    size: number,
    fillNumber: number = 0
  ): number[] => {
    return Array(size).fill(fillNumber);
  };

  public static MappingY = (ysize: number, y: number) => {
    return ysize - y;
  };
  //  將開獎號碼填入相應位置。 1
  public static fillPrediction = (
    arr: number[],
    numbers: string[]
  ): number[] => {
    numbers.forEach((num) => {
      const index = parseInt(num, 10) - 1; // Convert string "01" to index 0, "03" to index 2, etc.
      if (index >= 0 && index < arr.length) {
        arr[index] = 1;
      }
    });
    return arr; // Return the modified arr instead of numbers
  };

  //
  public static NumberArray = (
    size: number,
    fitNumbers: number[] | undefined //如果有要移除的數字 加入這個參數
  ) => {
    //const array: number[] = new Array(size); // 建立長度為 size 的陣列，初始值為 undefined
    const array: number[] = Array.from({length: size}, (_, index) => index + 1);

    if (fitNumbers) {
      const filteredArray = array.filter((num) => !fitNumbers.includes(num));
      return filteredArray;
    }

    return array;
  };

  //取得Lottery Data 參數: 取得筆數
  public static async getLotteryData(
    selectNumber: string
  ): Promise<LotteryData[]> {
    try {
      const result: QueryResult<Record<string, any>[]> = await GetDB(
        "Lottery"
      ).query(`SELECT TOP  ${selectNumber} * FROM L539 ORDER BY Period DESC`);

      if (!result.success || !Array.isArray(result.data)) {
        console.error("Query failed:", result.error);
        return [];
      }

      return result.data.map((item) => ({
        ID: Number(item.ID),
        Period: Number(item.Period),
        OpenDate: String(item.OpenDate),
        NO_1: String(item.NO_1),
        NO_2: String(item.NO_2),
        NO_3: String(item.NO_3),
        NO_4: String(item.NO_4),
        NO_5: String(item.NO_5),
      }));
    } catch (error) {
      console.error("Failed to fetch lottery data:", error);
      return [];
    }
  }
  //使用樂透資料產生 Table
  public static generateTable(data: LotteryData[]): TableData {
    // 生成表頭
    const header = [
      "Period",
      ...Array.from({length: 39}, (_, i) =>
        (i + 1).toString().padStart(2, "0")
      ),
    ];

    // 生成資料列
    const rows = data.map((entry) => {
      // 將中獎號碼轉換為數字集合，方便查詢
      const numbers = new Set(
        [entry.NO_1, entry.NO_2, entry.NO_3, entry.NO_4, entry.NO_5].map(
          (num) => parseInt(num, 10)
        )
      );

      // 創建一個新的物件，以期號開始
      const unsortedRow: {[key: string]: number | string} = {
        Period: entry.Period,
      };

      // 將每個號碼填充到 unsortedRow
      for (let i = 1; i <= 39; i++) {
        const numStr = i.toString().padStart(2, "0");
        unsortedRow[numStr] = numbers.has(i) ? 1 : 0;
      }

      // 創建一個空的 sortedRow 並按照 header 的順序填充
      const sortedRow: {[key: string]: number | string} = {
        Period: unsortedRow.Period,
      };

      // 確保 sortedRow 的順序與 header 順序一致
      header.slice(1).forEach((numStr) => {
        console.log(numStr);
        sortedRow[numStr] = unsortedRow[numStr];
      });
      console.log(sortedRow);

      return sortedRow;
    });

    // 依照期號排序
    rows.sort((a, b) => {
      return a.Period.toString().localeCompare(b.Period.toString());
    });

    return {header, rows};
  }

  //產生 1~39 對應的 Array 有開的 填入1 ,沒開的填入 0
  //產生開獎圖表
  public static createArrayMap(
    lotteryData: LotteryData[],
    zeroArr: number[][]
  ): number[][] {
    // Fill in the corresponding numbers with 1
    lotteryData.forEach((data, index) => {
      [data.NO_1, data.NO_2, data.NO_3, data.NO_4, data.NO_5].forEach((no) => {
        const number = parseInt(no, 10) - 1; // Convert to 0-based index
        zeroArr[index][number] = 1; // Set the corresponding number's position to 1
      });
    });

    return zeroArr.reverse(); //反轉 由舊的日期排到 新的日期
  }

  public static GetRow(z0: number[][], index: number) {
    return z0.map((row) => row[index - 1]); //convert base 0
  }
  // 找第一個出現的數字。
  public static FindNumber(arr: number[]) {
    const firstIndex = arr.findIndex((value) => value === 1);
    return firstIndex + 1; //Base 1;
  }

  public static FindIndex(arr: number[]) {
    // 取得所有 1 的索引（轉換為 Base 1）
    const oneIndexes = arr
      .map((value, index) => (value === 1 ? index + 1 : -1)) // Base 1 索引
      .filter((index) => index !== -1); // 過濾掉 -1
    return oneIndexes;
  }

  public static findMatchingPairs(
    array01: number[],
    array02: number[],
    distance: number
  ): FindMatch {
    const result: number[][] = [];
    let matchObject: FindMatch = {
      PredictNumber: 0, // 或者根據需要設置一個初始值
      CompareNumber: 0, // 同上
      FirstPos: 0,
      Result: [], // 初始為空陣列，根據需求可以填充
    };

    // 遍歷 Array01 中的每個元素
    for (let num1 of array01) {
      // 遍歷 Array02 中的每個元素
      for (let num2 of array02) {
        // 檢查 num2 是否比 num1 大 distance 個單位
        if (num2 - num1 === distance) {
          result.push([num1, num2]);
        }
      }
    }
    matchObject.Result = result;
    return matchObject;
  }
  //
  public static filterFunction = async (
    lotteryData: LotteryData[],
    predictNumber: number
  ): Promise<RelationPredictCompare[]> => {
    const zeroArr = LotteryUtil.ZeroArray(39, 25);
    // 1~39 移除預測號碼
    const numArr = LotteryUtil.NumberArray(39, [predictNumber]);
    //產生 1~39 對應的 Array 有開的 填入1
    const z0 = LotteryUtil.createArrayMap(lotteryData, zeroArr);
    const rowPredict = LotteryUtil.GetRow(z0, predictNumber).reverse(); //由新往舊排

    // asnArray 是二維數字陣列
    const asnArray: number[][][] = []; // 修正為三維陣列以符合多個子陣列
    //
    const emptyCompareResults: RelationPredictCompare[] = [];

    numArr.forEach((indexNumber) => {
      const rowCompare = LotteryUtil.GetRow(z0, indexNumber).reverse();

      const predictIndex = LotteryUtil.FindIndex(rowPredict); //預測號碼
      const compareIndex = LotteryUtil.FindIndex(rowCompare); //比較的號碼

      const distance = compareIndex[0]; //
      //尋找符合的點
      const ans = LotteryUtil.findMatchingPairs(
        predictIndex,
        compareIndex,
        distance
      );
      if (ans.Result.length > 0) {
        const emptyCompareResult: RelationPredictCompare = {
          predictNumber: 0, // 或者用 NaN 表示無效值
          compareNumber: 0,
          firstPos: 0,
          result: [], // 空的三維陣列
        };
        emptyCompareResult.predictNumber = predictNumber;
        emptyCompareResult.compareNumber = indexNumber;
        emptyCompareResult.firstPos = distance;
        emptyCompareResult.result = ans.Result;
        emptyCompareResults.push(emptyCompareResult);
      } //asnArray.push(ans.Result);
    });

    return emptyCompareResults;
  };

  //計算數字之間的關聯表
  public static computeRelationTable = async (
    lotteryData: LotteryData[],
    predicNumber: number
  ): Promise<RelationPredictCompare[][]> => {
    let predictNumbers = [predicNumber];
    //const lotteryData = await LotteryUtil.getLotteryData("25");
    //
    const RelationTable: Array<RelationPredictCompare[]> = [];
    for (const num of predictNumbers) {
      console.log("predict num:", num);
      const aa = (await LotteryUtil.filterFunction(
        lotteryData,
        num
      )) as RelationPredictCompare[];
      RelationTable.push(aa);
    }
    return RelationTable;
  };

  //計算 1D 陣列,數字出現的次數。
  public static countOccurrences = (numbers: number[]): NumberCounter[] => {
    const countMap = new Map<number, number>();

    for (const num of numbers) {
      countMap.set(num, (countMap.get(num) || 0) + 1);
    }

    return Array.from(countMap.entries()).map(([num, counter]) => ({
      num,
      counter,
    }));
  };

  public static sortByCounter = (data: NumberCounter[]): NumberCounter[] => {
    return data.sort((a, b) => b.counter - a.counter);
  };

  //LSTM
  public static predictLSTM = async (
    dataNumbers: string
  ): Promise<PredictResult | undefined> => {
    const predictor = new LotteryLSTM();

    try {
      // 訓練並預測樂透號碼
      const predictionResult = await predictor.predict(200, dataNumbers);
      // 輸出預測結果
      console.log("預測樂透號碼：", predictionResult.predictedNumbers);

      console.log("預測信心度：", predictionResult.probability);
      const avrConfidence = LotteryMath.Average(predictionResult.probability);
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
  };
}
