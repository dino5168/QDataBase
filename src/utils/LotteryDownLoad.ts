import axios from "axios";
import cheerio from "cheerio";

const url =
  "https://www.pilio.idv.tw/lto539/list.asp?indexpage=200&orderby=new";

async function fetchData() {
  try {
    // 發送 GET 請求
    const response = await axios.get(url);
    const html = response.data;

    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(html);

    // 選擇需要的 table，並抓取所有資料
    const rows = $("#ltotable tr");

    rows.each((i, row) => {
      // 解析每一行的資料
      const cells = $(row).find("td");
      const data = cells.map((index, cell) => $(cell).text().trim()).get();

      // 輸出每行的資料
      if (data.length > 0) {
        console.log(data);
      }
    });
  } catch (error) {
    console.error("Error fetching the data:", error);
  }
}

fetchData();
