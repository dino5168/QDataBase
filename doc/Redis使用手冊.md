# Redis 使用手冊

### 安裝

https://github.com/microsoftarchive/redis/releases

### 設定環境變數 Path:

```sh
win + R
如果安裝在 C:\Program Files\Redis\
add Path  C:\Program Files\Redis\

測試 redis 是否運行 redis-cli
redis-cli ping
如果回應 Pong 表示 redis-server 已經運行不需要執行 redis-server
redis 預設的 Port 是 : 6379
```

### Node.js 使用 redis 

```sh
npm install redis

npm install --save-dev @types/redis


```
