import "tsconfig-paths/register";
import {LotteryCanvas} from "@utils/LotteryCanvas";
import {GridImageGenerator} from "@utils/image/GridImageGenerator";
import dotenv from "dotenv";
import {
  LotteryData,
  LotteryUtil,
  RelationPredictCompare,
} from "@utils/LotteryUtil";
import {Max} from "@tensorflow/tfjs-node";
dotenv.config();

const Example = async () => {
  let predictNumberstring = [
    "12",
    "35",
    "26",
    "18",
    "19",
    "07",
    "22",
    "28",
    "38",
    "34",
    "05",
    "04",
    "08",
    "27",
  ];
  let predictNumbers: number[] = [];
  /*
  predictNumberstring.map((item) => {
    predictNumbers.push(parseInt(item));
  });
*/
  for (let i = 1; i <= 39; i++) {
    predictNumbers.push(i);
  }
  const lotteryData = await LotteryUtil.getLotteryData("25");
  //
  let numberCounters: number[] = [];
  for (const num of predictNumbers) {
    console.log("predict num:", num);
    const aa = (await LotteryUtil.filterFunction(
      lotteryData,
      num
    )) as RelationPredictCompare[];

    console.log(aa);
    //數字關聯圖。

    aa.forEach((item) => {
      if (item.result.length > 1) {
        console.log("預測號碼:", item.predictNumber);
        console.log("比較號碼:", item.compareNumber);
        console.log("比較號碼第一次出現位置:", item.firstPos);
        console.log("結果:", item.result);
        console.log("====================================");
        numberCounters.push(item.predictNumber);
      }
    });
  }
  const counter = LotteryUtil.countOccurrences(numberCounters);
  console.log(LotteryUtil.sortByCounter(counter));
};

Example();
/*
     // const max = Math.max(...asnLengths);
    console.log("predictNumber:", predictNumber);
    let arrAnsLength: number[] = [];
    console.log("==================================");
    asnArray.forEach((ans) => {
      arrAnsLength.push(ans.length);
      //console.log(ans.length);
    });
    const max = Math.max(...arrAnsLength);
    console.log(max);

*/
