import "tsconfig-paths/register";
import {LotteryCanvas} from "@utils/LotteryCanvas";
import {GridImageGenerator} from "@utils/image/GridImageGenerator";
import dotenv from "dotenv";
import {LotteryUtil} from "@utils/LotteryUtil";
import type {RelationPredictCompare} from "@utils/LotteryUtil";
import {UtilData} from "@utils/data/UtilData";
import {LotteryMath} from "@utils/math/LotteryMath";
dotenv.config();

const ExImage = async () => {
  let result = LotteryUtil.ZeroArray(39, parseInt("25"));
  //需第四象限轉第一象限
  //result[0][0] = 1;
  //result[17][0] = 1;

  const inputPredicNumber = 15;
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
        //標註 預測號
        result[yPredicPos][6 - 1] = 1;
        result[yComparePos][relation.compareNumber - 1] = 1; // ?
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

const predict_nums = [
  "14",
  "18",
  "01",
  "06",
  "05",
  "15",
  "27",
  "39",
  "02",
  "12",
  "19",
  "20",
  "09",
  "13",
];

//UtilData.CreateLotteryImage("C:/temp/539_.png", predict_nums);

const test = async () => {
  let zeroOne = LotteryUtil.ZeroOneArray(39);
  const predictRow = LotteryUtil.fillPrediction(zeroOne, predict_nums);
  console.log(predictRow);
  const decodeRow = LotteryMath.OneHotDecodeSource(predictRow);
  console.log(decodeRow);

  //console.log(result);
  /*
  const data = await UtilData.getLotteryMap_0("25");
  decodeRow.forEach((num) => {
    UtilData.clearColumn(data, num - 1);
  });
*/
  //console.log(data);
  const data = await UtilData.getLotteryMap_0("25");
  //let data = LotteryUtil.ZeroArray(39, parseInt("25"));
  //需第四象限轉第一象限
  //result[0][0] = 1;
  //result[17][0] = 1;

  const inputPredicNumber = 39;
  const selectDataNumbers = "25";
  const ipputDataLenght = parseInt(selectDataNumbers);

  const oneRow = LotteryUtil.ZeroOneArray(39, 0);
  //result.push(oneRow);
  const lotteryData = await LotteryUtil.getLotteryData(selectDataNumbers);

  const relationTable: Array<RelationPredictCompare[]> =
    await LotteryUtil.computeRelationTable(lotteryData, inputPredicNumber);
  console.log(relationTable);
  console.log("===============");

  const filterNumbers: number[] = [];
  filterNumbers.push(inputPredicNumber);

  Object.entries(relationTable[0]).forEach(([key, value]) => {
    //console.log(`Key: ${key}, Value: ${value}`);
    console.log("value.compareNumber:", value.compareNumber);

    filterNumbers.push(value.compareNumber);
  });

  //
  //filterNumbers.push(inputPredicNumber);

  const comFilters = LotteryMath.getComplementNumbers(filterNumbers);
  comFilters.forEach((num) => {
    console.log("num:", num);
    UtilData.clearColumn(data, num - 1);
  });

  // 填入預測號碼 Base 0
  oneRow[inputPredicNumber - 1] = 1;
  data.push(oneRow);

  //console.log(oneRow);
  //UtilData.clearColumn()

  const imageGenerator = new GridImageGenerator(data, "C:/temp/539_01.png", {
    cellSize: 25,
    activeColor: "#f5756e",
    inactiveColor: "#FFFFFF",
    gridLineColor: "#B0B0B0",
    lineWidth: 1,
  });
  imageGenerator.generateImage();
};

test();

//ExImage();
