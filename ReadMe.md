### QDataBase : 資料庫管理模組。

### 套件安裝

```sh
npm install --save-dev typescript

npm install express

npm install dotenv

npm install cors

npm install --save-dev @types/express @types/cors @types/node

npm install --save-dev nodemon

```

### 建立 tsconfig.json

```sh
npx tsc --init
```

### 上傳到 Github

```sh
git add .
git commit -m ""
git push
```

### 別名問題

TypeScript 轉譯後的問題
TypeScript 不會自動處理 paths，需要 tsconfig-paths 來幫助 Node.js 正確解析模組。

安裝 tsconfig-paths：

```sh


npm install tsconfig-paths --save
//然後，在 server.ts 或 index.ts 入口文件的最上方加上：

import 'tsconfig-paths/register';

```

這樣，當 Node.js 運行時，它可以解析 TypeScript 設定的 paths。
