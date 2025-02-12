express.Router() 是 Express 提供的一種方式，用來模組化和組織路由。你可以使用它來定義一組相關的路由，然後將它掛載到主應用程式中，使程式碼更有結構且易於維護。

```ts
import express from "express";

const app = express();
const router = express.Router();

// 定義一個 GET 路由
router.get("/hello", (req, res) => {
  res.send("Hello, Express Router!");
});

// 掛載路由到主應用程式
app.use("/api", router);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```
