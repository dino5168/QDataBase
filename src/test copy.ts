import "tsconfig-paths/register";
import {LotteryCanvas} from "@utils/LotteryCanvas";
import {GridImageGenerator} from "@utils/image/GridImageGenerator";
import dotenv from "dotenv";
import {LotteryUtil} from "@utils/LotteryUtil";
import type {RelationPredictCompare} from "@utils/LotteryUtil";
dotenv.config();
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
    //const drawChart = await LotteryCanvas.create("25");
    const lotteryData = await LotteryUtil.getLotteryData("25");
    let result = LotteryUtil.ZeroArray(39, parseInt("25"));
    console.log(lotteryData);

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
    let predictNumbers = ["12", "35", "27"];

    let fitNumbers = fillPrediction(arr5391D, predictNumbers);
    result.push(fitNumbers);

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

const ExImage = async () => {
  let result = LotteryUtil.ZeroArray(39, parseInt("25"));
  //需第四象限轉第一象限
  //result[0][0] = 1;
  //result[17][0] = 1;

  const inputPredicNumber = 1;
  const selectDataNumbers = "25";
  const ipputDataLenght = parseInt(selectDataNumbers);

  const oneRow = LotteryUtil.ZeroOneArray(39, 0);
  result.push(oneRow);
  const lotteryData = await LotteryUtil.getLotteryData(selectDataNumbers);

  const relationTable: Array<RelationPredictCompare[]> =
    await LotteryUtil.computeRelationTable(lotteryData, inputPredicNumber);
  console.log(relationTable);

  const ySize = result.length; //資料表格 高度

  const predicNumberPos = LotteryUtil.MappingY(ySize, 1);
  for (const row of relationTable) {
    // 遍歷 relationTable 的每一列 (RelationPredictCompare[])
    for (const relation of row) {
      console.log("relation.predictNumber:", relation.predictNumber);
      console.log("compareNumber:", relation.compareNumber);

      console.log("relation.result", relation.result);
      // 遍歷 RelationPredictCompare[] 的每個元素
      const predicNumber = LotteryUtil.MappingY(
        ySize,
        0 + relation.predictNumber
      );
      const compareNumber = LotteryUtil.MappingY(ySize, relation.firstPos + 1);

      //result[predicNumber][0] = 1;
      //result[compareNumber][relation.compareNumber - 1] = 1;
      result[ipputDataLenght][inputPredicNumber - 1] = 1; //2 /3 推薦行 x,y 第一象限

      relation.result.forEach((item) => {
        const predictPos = item[0];
        const comparePos = item[1];
        const yPredicPos = LotteryUtil.MappingY(ySize, predictPos + 1);
        const yComparePos = LotteryUtil.MappingY(ySize, comparePos + 1);
        //result[2][2] = 1; //2 /3 推薦行 x,y 第一象限
        result[yComparePos][relation.compareNumber - 1] = 1;
      });

      //result[compareNumber][0] = 1;
      //result[yIndex17][0] = 1; //base 0
    }
  }

  const imageGenerator = new GridImageGenerator(result, "C:/temp/539_g.png", {
    cellSize: 25,
    activeColor: "#FF6347",
    inactiveColor: "#F0F0F0",
    gridLineColor: "#B0B0B0",
    lineWidth: 1,
  });
  imageGenerator.generateImage();
};
//example();
ExImage();
