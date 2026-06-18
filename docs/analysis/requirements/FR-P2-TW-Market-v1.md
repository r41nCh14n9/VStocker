# FR-P2-TW-Market-v1.md
# Phase 2：台股 + 行情服務 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase2-Integration-v1.md](./SA-Phase2-Integration-v1.md)  
**涵蓋服務：** `stock-service`（台股擴充）、`market-data-service`（台股 Adapter）、`portfolio-service`（台股持倉）  
**任務 ID：** P2-S-01~02、P2-M-01~03、P2-Port-01~02  

---

## 1. 台股個股擴充（stock-service）

### 1.1 股票模型擴充（P2-S-01）

**stock-service 擴充欄位：**

| 欄位 | 類型 | 說明 |
|---|---|---|
| `market` | `Market` enum | 現在支援 `US` 和 `TW` |
| `exchange` | String | 台股：`TWSE`（上市）、`TPEx`（上櫃） |
| `twseCode` | String?（nullable） | TWSE 股票代號（e.g., `2330`），`market=TW` 時為必填 |

**台股 sector 對照（TWSE 分類）：**

| TWSE 產業 | 英文名稱（系統使用） |
|---|---|
| 半導體業 | Semiconductors |
| 電子零組件業 | Electronic Components |
| 電腦及週邊設備業 | Computer Hardware |
| 光電業 | Optoelectronics |
| 電信業 | Telecommunications |
| 金融保險業 | Financials |
| 建材營造業 | Construction |
| 食品工業 | Food & Beverage |
| 鋼鐵工業 | Steel |
| 塑膠工業 | Plastics |
| 其他 | Other |

### 1.2 台股個股 CRUD（P2-S-01）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-TW-01 | `POST /stocks` 新增台股時，`market=TW`、`twseCode` 必填（BR-STK-TW-01） |
| FR-P2-TW-02 | `GET /stocks?market=TW` 返回所有台股個股 |
| FR-P2-TW-03 | `GET /stocks?market=TW&sector=Semiconductors` 返回台股半導體個股 |
| FR-P2-TW-04 | 台股 `exchange` 只允許 `TWSE` 或 `TPEx` |
| FR-P2-TW-05 | `twseCode` 在 `market=TW` 的個股中唯一（不同個股不允許相同 TWSE 代號） |
| FR-P2-TW-06 | 台股 `ticker` 格式：`TW:{twseCode}`（e.g., `TW:2330`），確保全系統 ticker 不衝突 |

**業務規則補充：**

| 規則編號 | 規則描述 |
|---|---|
| BR-STK-TW-01 | 台股新增時 `twseCode` 必填，且格式為 4-6 位數字 |
| BR-STK-TW-02 | 台股 ticker 採用 `TW:{twseCode}` 格式，與美股 ticker 區分 |
| BR-STK-TW-03 | 刪除保護邏輯與美股相同（持倉存在時拒絕刪除） |

### 1.3 台股初始資料 Seed（P2-S-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-TW-07 | 提供台灣 50（TWSE 0050 成分股）基本清單 Seed |
| FR-P2-TW-08 | 提供中型 100 代表性個股（至少 20 支）基本清單 |
| FR-P2-TW-09 | Seed 資料格式：twseCode、name（中英文）、sector（TWSE 分類）、exchange |

---

## 2. 行情服務台股擴充（market-data-service）

### 2.1 TWSE Open API Adapter（P2-M-01）

**TWSE API 端點說明：**

| API | URL | 說明 |
|---|---|---|
| 收盤行情 | `https://www.twse.com.tw/exchangeReport/STOCK_DAY?stockNo={code}&response=json` | 月度每日收盤 |
| 盤中行情 | `https://www.twse.com.tw/fund/T86?response=json&date={date}&selectType=ALL` | 全市場盤中彙總 |
| 個股即時 | `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_{code}.tw` | 盤中即時 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-M-01 | 建立 `TwseAdapter` 實作 `MarketDataAdapter` 介面 |
| FR-P2-M-02 | 實作 `getQuote(twseCode)` 方法：盤中呼叫即時 API，收盤後取收盤資料 |
| FR-P2-M-03 | 台股即時資料解析：成交價、漲跌幅、成交量、最高/最低價 |
| FR-P2-M-04 | 台股 API 不穩定時（5xx）自動 retry 1 次（delay 500ms）後 fallback 至 Fugle Adapter |
| FR-P2-M-05 | `GET /market-data/tw/quotes?symbols={csv}` 批量台股報價端點 |
| FR-P2-M-06 | TWSE API 無需 API Key，直接呼叫（注意 Rate Limit：不超過 1 req/s） |
| FR-P2-M-07 | 返回 `TwQuoteDto`：`{ symbol, price, change, changePercent, volume, date, isMarketOpen }` |

**盤中/盤後判斷邏輯：**
```
台股交易時間：週一至週五 09:00 ~ 13:30（台北時間）
isMarketOpen():
  - 取得台北時間（Asia/Taipei）
  - 檢查是否為工作日（排除台灣假期 TODO：接入假期 API）
  - 時間在 09:00 ~ 13:30 之間
```

---

### 2.2 Fugle API Adapter（P2-M-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-M-08 | 建立 `FugleAdapter` 實作 `MarketDataAdapter` 介面，作為 TWSE 的備援 |
| FR-P2-M-09 | Fugle API Key 從環境變數 `FUGLE_API_KEY` 讀取 |
| FR-P2-M-10 | 實作 `getQuote(twseCode)` 呼叫 Fugle Market Data API |
| FR-P2-M-11 | TWSE Adapter 呼叫失敗時，`market-data-service` 自動切換至 Fugle Adapter |
| FR-P2-M-12 | 兩個 Adapter 均失敗時，返回 50002（外部 API 不可用），前端顯示 `--` |

**Adapter 設計模式：**
```java
interface MarketDataAdapter {
    QuoteDto getQuote(String symbol);
    Map<String, QuoteDto> getBatchQuotes(List<String> symbols);
}

@Service
class TwMarketDataService {
    private final TwseAdapter primary;
    private final FugleAdapter fallback;
    
    QuoteDto getQuote(String symbol) {
        try {
            return primary.getQuote(symbol);
        } catch (ExternalApiException e) {
            log.warn("TWSE failed, fallback to Fugle: {}", e.getMessage());
            return fallback.getQuote(symbol);
        }
    }
}
```

---

### 2.3 Redis 差異化快取策略（P2-M-03）

| 市場 | 快取 Key | TTL |
|---|---|---|
| 美股（盤中） | `quote:US:{ticker}` | 60s |
| 台股（盤中 09:00~13:30） | `quote:TW:{twseCode}` | 10s |
| 台股（盤後） | `quote:TW:{twseCode}` | 300s（5 分鐘） |
| 匯率 USD/TWD | `fx:USD:TWD` | 3600s（1 小時） |
| 台股指數 | `index:TWSE` | 30s（盤中）/ 300s（盤後） |
| 美股指數 | `index:SPX` | 60s |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-M-13 | Redis Cache 設定動態 TTL（依市場狀態決定） |
| FR-P2-M-14 | `market-data-service` 在快取前先確認市場開盤狀態，選擇對應 TTL |
| FR-P2-M-15 | Redis 快取 Miss 時呼叫外部 API，Hit 時直接返回快取（Log 記錄 Cache HIT/MISS） |
| FR-P2-M-16 | 批量報價優化：多個 ticker 查詢先批量 GET Redis，僅對 Miss 的 ticker 呼叫外部 API |

---

## 3. 台股持倉擴充（portfolio-service）

### 3.1 台股持倉 CRUD（P2-Port-01）

**Portfolio 擴充：**

```
Portfolio（擴充）
├── currency: Currency      'USD' 或 'TWD'
└── （一個使用者可有多個 Portfolio，Phase 2 起）

實際設計：
- 使用者有一個「美股 Portfolio」（currency=USD）
- 使用者有一個「台股 Portfolio」（currency=TWD）
- 前端依 Switch Tag 切換顯示對應 Portfolio
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-PORT-01 | `portfolio-service` 允許使用者有多個 Portfolio（區分 currency） |
| FR-P2-PORT-02 | `GET /portfolios/me?market=TW` 返回台股 Portfolio（TWD 幣別） |
| FR-P2-PORT-03 | `POST /positions?market=TW` 新增台股持倉，ticker 格式為 `TW:{twseCode}` |
| FR-P2-PORT-04 | 台股損益計算：呼叫 `market-data-service` 取台股現價（TWD）計算 TWD 損益 |
| FR-P2-PORT-05 | 台股 `shares` 單位：張（1 張 = 1000 股），允許零股（小數 3 位） |
| FR-P2-PORT-06 | 台股 `avgCostPrice` 單位：TWD / 股（非 TWD / 張） |

**台股持倉 API 擴充：**

```
GET /portfolios/me?market=TW              台股 Portfolio
GET /portfolios/me?market=US              美股 Portfolio（原有）
POST /positions（body 含 market 欄位）    新增持倉（依 market 決定 Portfolio）
```

---

### 3.2 USD → TWD 損益換算（P2-Port-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-PORT-07 | `GET /portfolios/me?market=US&currency=TWD` 返回美股持倉，損益換算為 TWD |
| FR-P2-PORT-08 | 呼叫 `market-data-service GET /market-data/fx/rates?base=USD&target=TWD` 取匯率 |
| FR-P2-PORT-09 | 匯率快取 1 小時（不需每筆請求呼叫外部 API） |
| FR-P2-PORT-10 | PortfolioDto 新增欄位：`twdEquivalent`（USD 市值換算 TWD）、`exchangeRate`（使用匯率） |
| FR-P2-PORT-11 | 換算公式：`twdEquivalent = marketValueUSD × exchangeRate` |

**匯率 API：**

```
GET /market-data/fx/rates?base=USD&target=TWD
回應：{ "base": "USD", "target": "TWD", "rate": 32.15, "updatedAt": "2026-06-18T..." }
外部來源：Exchangerate-API（免費，500 req/month）
```

---

## 4. 前端台股整合

### 4.1 美股列表頁擴充

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-FE-01 | 美股個股列表頁在 Switch Tag 切換後自動顯示台股列表（`?market=TW`） |
| FR-P2-FE-02 | 台股列表額外顯示「TWSE 代號」欄位（e.g., 2330） |
| FR-P2-FE-03 | 版塊篩選依市場動態切換（US 版塊 vs 台股 TWSE 產業分類） |

### 4.2 持倉頁擴充

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-FE-04 | 持倉列表頁依 Switch Tag 顯示美股或台股持倉 |
| FR-P2-FE-05 | 台股持倉顯示 TWD 金額（不顯示 USD） |
| FR-P2-FE-06 | 美股持倉可選擇顯示 TWD 換算金額（切換按鈕：USD / TWD 等值顯示） |
| FR-P2-FE-07 | 新增持倉 Modal 依市場顯示對應搜尋範圍（US market vs TW market） |

---

## 5. 驗收標準

| 情境 | 通過條件 |
|---|---|
| 台股個股新增 | Admin 新增 TW:2330（台積電），成功建立 |
| 台股搜尋 | 搜尋 "2330" 或 "台積電" 找到對應個股 |
| 台股報價 | `GET /market-data/tw/quotes?symbols=TW:2330` 返回台積電報價 |
| 盤後快取 | 收盤後（13:30 後）台股報價快取 5 分鐘 |
| Fugle 備援 | 模擬 TWSE API 失敗，自動切換至 Fugle 返回報價 |
| 台股持倉損益 | 新增 TW:2330 台股持倉，查看列表顯示 TWD 損益 |
| USD→TWD 換算 | 美股持倉頁可切換顯示 TWD 等值，換算匯率標注於頁面 |
| 台灣 50 Seed | 系統啟動後 50 支台股個股已存在 |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
