### 1. .env 設定檔 使用 dotenv .config() 讀取

```ini
PORT=3080
##DatabaseConfig
# 啟用 MSSQL
MSSQL_ENABLED=true

# 連線資訊
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USER=sa
MSSQL_PASSWORD=your-db-password
MSSQL_DATABASE=Lottery
# 進階選項
MSSQL_ENCRYPT=true                # 是否加密連線 (預設 true)
MSSQL_TRUST_SERVER_CERT=false       # 信任自簽

#### SQL

SQL_SETTING=C:/Work_Base/QDataBase/SQL_SETTING.ini

### ROUTER
ROUTE_CONFIG=C:/Work_Base/QDataBase/ROUTE_CONFIG.json
```

### DATABASE_CONFIG.json

```json
{
  "databases": [
    {
      "type": "postgres",
      "config": {
        "server": "localhost",
        "port": 5432,
        "user": "postgres",
        "password": "",
        "database": "postgres",
        "ssl": false,
        "pool": {
          "min": 10,
          "max": 50,
          "idleTimeoutMillis": 1000
        },
        "options": {
          "encrypt": false,
          "trustServerCertificate": false,
          "connectionTimeout": 3000,
          "requestTimeout": 3000
        }
      }
    },
    {
      "type": "mongodb",
      "config": {
        "server": "localhost",
        "port": 27017,
        "user": "",
        "password": "",
        "database": "test",
        "authSource": "",
        "replicaSet": ""
      }
    },
    {
      "type": "mssql",
      "config": {
        "server": "localhost",
        "port": 1433,
        "user": "sa",
        "password": "0936284791",
        "database": "Lottery",
        "pool": {
          "min": 10,
          "max": 50,
          "idleTimeoutMillis": 600000
        },
        "options": {
          "encrypt": false,
          "trustServerCertificate": false,
          "connectionTimeout": 60000,
          "requestTimeout": 60000
        }
      }
    }
  ]
}
```
