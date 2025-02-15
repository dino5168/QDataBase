import "tsconfig-paths/register";
import axios from "axios";
import dotenv from "dotenv";
import {promises as fs} from "fs"; // 使用 fs.promises
import path from "path"; // 引入 path 模組
import {parseDocument} from "htmlparser2";
import {DomHandler, Element} from "domhandler";

import {selectOne, selectAll} from "css-select";

import * as DomUtils from "domutils";
import {GetDB} from "./QDBService";

//使用 dotenv  載入環境變數
dotenv.config();
const baseUrl =
  "https://www.pilio.idv.tw/lto539/list.asp?indexpage=200&orderby=new";

// 抓取網站資料
async function fetchData(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching the data:", error);
    throw error; // 如果抓取失敗，拋出錯誤以便後續處理
  }
}

// 寫入資料到檔案
const writetoFile = async (fileName: string, data: string) => {
  try {
    await fs.writeFile(fileName, data);
    console.log(`File written successfully: ${fileName}`);
  } catch (error) {
    console.error("Error writing file:", error);
  }
};

// 主程式，處理每頁的抓取與寫入
const fetchAndSavePages = async () => {
  for (let i = 1; i < 251; i++) {
    const url = `https://www.pilio.idv.tw/lto539/list.asp?indexpage=${i}&orderby=new`;
    console.log(`Fetching data from: ${url}`);

    // 組裝檔案路徑
    const htmlfile = path.join("c:/temp/lotterydata", `${i}.html`);

    try {
      // 抓取網頁資料並寫入檔案
      const htmlstring = await fetchData(url);
      await writetoFile(htmlfile, htmlstring);
    } catch (error) {
      console.error(`Failed to process page ${i}:`, error);
    }
  }
};

// 開始執行
//fetchAndSavePages();
interface LotteryData {
  openDate: string;
  numbers: string;
}

const readFile = async (filePath: string): Promise<LotteryData[]> => {
  try {
    let fileContent = await fs.readFile(filePath, "utf-8");

    const dom = parseDocument(fileContent);
    const tables = selectAll("table.auto-style1, table#ltotable", dom);

    if (tables.length === 0) {
      console.log("未找到任何目標 table");
      return []; // 確保返回空陣列
    }

    let data: LotteryData[] = [];

    tables.forEach((table, index) => {
      console.log(`解析 Table ${index + 1}：`);

      const rows = selectAll("tr", table);

      rows.forEach((row, rowIndex) => {
        const tds = selectAll("td", row);
        if (tds.length >= 2) {
          const dateText = DomUtils.textContent(tds[0]).trim();
          const numbersText = DomUtils.textContent(tds[1]).trim();

          if (rowIndex === 0 && /日期|中獎號碼/.test(dateText)) {
            return; // 跳過標題列
          }

          const date = dateText.replace(/\s+/g, " ");
          const numbers = numbersText.replace(/\s+/g, " ");

          data.push({
            openDate: date,
            numbers: numbers,
          });
        }
      });

      console.log(""); // 分隔不同表格的輸出
    });

    return data;
  } catch (error) {
    console.error("讀取檔案時發生錯誤:", error);
    return []; // 如果有錯誤，也返回空陣列
  }
};

// 呼叫並等待解析
const processFile = async () => {
  console.log("getdb");
  let db = GetDB("Lottery");
  console.log("db:", db);
  for (let i = 1; i <= 250; i++) {
    let htmlFile = `C:/temp/lotterydata/${i}.html`;
    console.log("process:", htmlFile);
    const datas = await readFile(htmlFile);
    datas.forEach((data) => {
      db.insert("A539", data);
    });
  }
};

processFile();
console.log("OK");
