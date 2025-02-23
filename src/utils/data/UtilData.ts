import {GridImageGenerator} from "@utils/image/GridImageGenerator";
import {LotteryUtil} from "@utils/LotteryUtil";

export class UtilData {
  //產生 空白彩卷分布圖 vaule = 0,並填入中獎位置 1
  public static async getLotteryMap_0(limits: string, num: number = 39) {
    const lotteryData = await LotteryUtil.getLotteryData(limits);
    let result = LotteryUtil.ZeroArray(num, parseInt(limits));
    return LotteryUtil.createArrayMap(lotteryData, result); //產生得獎圖表
  }

  //產製 539 分布圖填入開獎號碼,並填入預測號碼 => 1

  public static getLotteryMap_1 = async (predictNumbers: string[]) => {
    try {
      const result = await UtilData.getLotteryMap_0("25", 39); // LotteryUtil.createArrayMap(lotteryData, result); //產生得獎圖表
      //預測號碼列
      let arr5391D: number[] = Array.from({length: 39}, () => 0);
      let fitNumbers = LotteryUtil.fillPrediction(arr5391D, predictNumbers);
      result.push(fitNumbers);
      return result;
    } catch (error) {
      console.error("Error in lottery chart creation:", error);
    }
  };
  //產生樂透分布圖Image
  public static async CreateLotteryImage(
    filePath: string,
    predictNumbers: string[]
  ) {
    const result = await this.getLotteryMap_1(predictNumbers);
    if (result) {
      const imageGenerator = new GridImageGenerator(result, filePath, {
        cellSize: 25,
        activeColor: "#f5756e",
        inactiveColor: "#FFFFFF",
        gridLineColor: "#B0B0B0",
        lineWidth: 1,
      });
      imageGenerator.generateImage();
    } else {
      throw expect;
    }
  }

  //將 Column 設定為 0
  public static clearColumn(arr: number[][], columnIndex: number): void {
    // 遍歷每一列
    for (let i = 0; i < arr.length; i++) {
      // 確保 columnIndex 在該 row 的範圍內
      if (columnIndex >= 0 && columnIndex < arr[i].length) {
        // 如果值是 1，則設為 0
        if (arr[i][columnIndex] === 1) {
          arr[i][columnIndex] = 0;
        }
      }
    }
    //return arr;
  }
}
