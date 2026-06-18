# FR-P1-Stock-v1.md
# Phase 1：美股個股管理 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase1-Integration-v1.md](./SA-Phase1-Integration-v1.md)  
**涵蓋服務：** `stock-service`（後端）、前端美股管理頁面  
**任務 ID：** P1-S-01 ~ P1-S-05、P1-FS-01 ~ P1-FS-04  

---

## 1. 領域模型（Domain Model）

### 1.1 Stock Aggregate（P1-S-01）

```
Stock (Aggregate Root)
├── id: UUID                      主鍵，系統生成
├── ticker: String                股票代碼（大寫，e.g., "AAPL"），唯一
├── name: String                  公司名稱（e.g., "Apple Inc."）
├── market: Market                'US'（Phase 1 固定），Phase 2 擴充 'TW'
├── exchange: String              "NASDAQ" | "NYSE" | "AMEX"
├── sector: String                "Technology" | "Healthcare" | ...
├── industry: String?             更細分的行業（可空）
├── description: String?          公司簡介（可空）
├── createdAt: Instant
└── updatedAt: Instant

Market: enum { US, TW }
```

### 1.2 業務規則

| 規則編號 | 規則描述 |
|---|---|
| BR-STK-01 | `ticker` 全系統唯一，大小寫不敏感（儲存時轉大寫） |
| BR-STK-02 | Phase 1 所有個股 `market` 固定為 `US` |
| BR-STK-03 | 刪除個股前，必須確認該 ticker 在 `portfolio-service` 中無任何持倉（刪除保護） |
| BR-STK-04 | `sector` 欄位值必須在系統定義的 S&P 500 版塊列表內（Phase 1 軟性驗證，非強制 FK） |
| BR-STK-05 | `exchange` 只允許：`NASDAQ`、`NYSE`、`AMEX`（Phase 1 美股） |
| BR-STK-06 | 更新 ticker 欄位不允許（ticker 是業務主鍵，不可修改） |

---

## 2. 後端 stock-service 需求

### 2.1 個股 CRUD API（P1-S-02）

#### GET /stocks

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN（需 JWT） |
| Query 參數 | `market`（預設 US）、`sector`、`exchange`、`search`（ticker 或 name 模糊搜尋）、`page`（預設 0）、`size`（預設 20）、`sort`（預設 `ticker,asc`） |
| 回應 | `ApiResponse<Page<StockSummaryDto>>` |

**StockSummaryDto：**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "market": "US",
  "exchange": "NASDAQ",
  "sector": "Technology"
}
```

#### GET /stocks/{ticker}

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN（需 JWT） |
| 路徑參數 | `ticker`（大小寫不敏感，自動轉大寫） |
| 回應 | `ApiResponse<StockDetailDto>`（含完整欄位 + 即時報價呼叫可選） |
| 錯誤 | 40401（ticker 不存在） |

**StockDetailDto：**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "market": "US",
  "exchange": "NASDAQ",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "description": "Apple Inc. designs..."
}
```

#### POST /stocks（ADMIN Only）

| 項目 | 說明 |
|---|---|
| 角色限制 | ADMIN |
| 請求 Body | `StockCreateDto`（ticker, name, market, exchange, sector, industry?, description?） |
| 驗證 | ticker 非空、長度 1-10、大寫字母+數字；name 非空、長度 1-200；exchange 在白名單內 |
| 業務邏輯 | 1. ticker 轉大寫 2. 檢查 ticker 唯一性（BR-STK-01）3. 建立 Stock Entity 4. 返回 StockDetailDto |
| 成功回應 | 201 Created |
| 錯誤 | 40901（ticker 已存在）、42201（驗證失敗）、40301（非 ADMIN） |

#### PUT /stocks/{ticker}（ADMIN Only）

| 項目 | 說明 |
|---|---|
| 角色限制 | ADMIN |
| 請求 Body | `StockUpdateDto`（name, exchange, sector, industry?, description?）—不含 ticker |
| 業務邏輯 | 更新欄位（ticker 不可修改，BR-STK-06）；返回更新後 StockDetailDto |
| 錯誤 | 40401（ticker 不存在）、42201（驗證失敗） |

#### DELETE /stocks/{ticker}（ADMIN Only）

| 項目 | 說明 |
|---|---|
| 角色限制 | ADMIN |
| 業務邏輯 | 1. 呼叫 portfolio-service（`GET /portfolios/has-position?ticker={ticker}`）確認無持倉 2. 有持倉 → 40901（刪除保護）3. 無持倉 → 刪除並返回 204 |
| 錯誤 | 40401（不存在）、40901（有持倉，刪除保護）、40301（非 ADMIN） |

---

### 2.2 市場篩選（P1-S-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-STK-01 | `GET /stocks?market=US` 返回所有美股（Phase 1 預設行為，`market` 參數預設 `US`） |
| FR-P1-STK-02 | `GET /stocks?sector=Technology` 返回科技版塊個股 |
| FR-P1-STK-03 | `GET /stocks?search=apple` 模糊搜尋 `ticker` 或 `name`（不分大小寫） |
| FR-P1-STK-04 | 支援複合過濾：`?market=US&sector=Technology&search=app` |
| FR-P1-STK-05 | 分頁使用 Spring Data Pageable；`sort` 參數格式：`{field},{direction}`（e.g., `ticker,asc`） |

---

### 2.3 刪除保護（P1-S-04）

**服務間通訊設計：**

```
DELETE /stocks/{ticker}  →  stock-service
    │
    └── 呼叫 portfolio-service
        GET /internal/portfolios/has-position?ticker={ticker}
        回應：{ "hasPosition": true/false }
        │
        ├── hasPosition = true  →  拒絕刪除，返回 40901
        └── hasPosition = false →  允許刪除，返回 204
```

**`/internal/portfolios/has-position` 端點（portfolio-service 提供）：**
- 路徑前綴 `/internal/**` 表示服務間內部呼叫
- Gateway 路由規則：`/internal/**` 不對外暴露（或設定僅允許服務間 IP 訪問）
- 此端點不需要 JWT 驗證（服務間信任模型）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-STK-06 | stock-service 刪除前呼叫 portfolio-service 確認無持倉 |
| FR-P1-STK-07 | portfolio-service 提供 `/internal/portfolios/has-position?ticker={ticker}` 端點 |
| FR-P1-STK-08 | portfolio-service 呼叫失敗（503 / timeout）時，stock-service 保守處理（拒絕刪除，返回 50003） |

---

### 2.4 初始美股資料 Seed（P1-S-05）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-STK-09 | 提供 S&P 500 基本清單 Seed（CSV 或 SQL 格式），包含：ticker、name、sector、exchange |
| FR-P1-STK-10 | Seed 資料至少涵蓋 50 支（以 S&P 500 各版塊代表性個股為主） |
| FR-P1-STK-11 | 使用 `@Sql` 或 Flyway Migration 在服務啟動時自動載入（僅當 DB 為空時執行） |
| FR-P1-STK-12 | Seed 涵蓋 GICS 11 個版塊：Technology, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Energy, Industrials, Materials, Real Estate, Utilities, Communication Services |

---

## 3. 前端美股管理頁面

### 3.1 美股個股列表頁（P1-FS-01）

**路徑：** `/stocks`（USER / ADMIN）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FS-01 | 顯示美股列表，預設按 ticker 升序排列，20 筆/頁 |
| FR-P1-FS-02 | 頂部搜尋列：輸入 ticker 或公司名稱，debounce 300ms 後觸發搜尋 |
| FR-P1-FS-03 | 版塊下拉篩選：選擇版塊後過濾列表 |
| FR-P1-FS-04 | 列表欄位：Ticker、公司名稱、版塊、交易所、即時報價（`--` 顯示若載入中） |
| FR-P1-FS-05 | 分頁控制：顯示當前頁 / 總頁數，上/下一頁按鈕 |
| FR-P1-FS-06 | ADMIN 角色顯示「新增個股」按鈕（右上角） |
| FR-P1-FS-07 | 每行顯示「查看」按鈕，點擊跳轉至個股詳細頁 |
| FR-P1-FS-08 | ADMIN 角色每行顯示「編輯」「刪除」按鈕 |
| FR-P1-FS-09 | 使用 TanStack Query 快取列表資料，staleTime: 30s |

---

### 3.2 個股詳細頁（P1-FS-02）

**路徑：** `/stocks/{ticker}`

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FS-10 | 顯示個股完整基本資料（ticker、名稱、版塊、交易所、行業、公司簡介） |
| FR-P1-FS-11 | 即時報價磁貼：顯示現價、漲跌幅、漲跌金額（呼叫 market-data-service） |
| FR-P1-FS-12 | 走勢折線圖：近 30 日收盤價折線圖（呼叫 market-data-service 歷史資料，Phase 3 升級為 K 線圖） |
| FR-P1-FS-13 | ADMIN 角色顯示「編輯」按鈕，點擊開啟編輯 Modal |
| FR-P1-FS-14 | USER 角色顯示「加入持倉」按鈕，點擊開啟新增持倉 Modal（連動 portfolio 功能） |
| FR-P1-FS-15 | 報價載入失敗時顯示 `--`，不中斷頁面渲染 |

---

### 3.3 個股新增 / 編輯 Modal（P1-FS-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FS-16 | Modal 標題：「新增個股」或「編輯 {ticker}」 |
| FR-P1-FS-17 | 表單欄位：Ticker（新增時可填寫，編輯時唯讀）、公司名稱、版塊（下拉選單）、交易所（下拉選單）、行業（可選）、公司簡介（Textarea，可選） |
| FR-P1-FS-18 | 前端驗證：ticker 格式（1-10 位大寫字母+數字）、名稱非空 |
| FR-P1-FS-19 | 提交成功後：關閉 Modal、Invalidate `stocks` Query 快取、列表自動更新 |
| FR-P1-FS-20 | 提交失敗顯示後端錯誤訊息（e.g., ticker 已存在） |
| FR-P1-FS-21 | 編輯模式：預先填入當前個股資料 |

---

### 3.4 個股刪除確認（P1-FS-04）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FS-22 | 點擊「刪除」按鈕彈出確認對話框（shadcn/ui AlertDialog） |
| FR-P1-FS-23 | 確認對話框內容：`確認刪除 {ticker}？此操作無法復原。` |
| FR-P1-FS-24 | 確認後呼叫刪除 API，期間顯示 Loading 狀態 |
| FR-P1-FS-25 | 刪除成功：關閉對話框、返回列表頁、顯示成功 Toast |
| FR-P1-FS-26 | 刪除失敗（有持倉）：顯示錯誤訊息 `無法刪除：此個股有使用者持倉` |

---

## 4. 驗收標準

| 情境 | 通過條件 |
|---|---|
| 查詢美股列表 | 返回分頁個股列表，含 ticker、名稱、版塊 |
| 搜尋功能 | 輸入 "AAPL" 或 "apple" 均可找到蘋果公司 |
| 版塊篩選 | 選擇 Technology，僅顯示科技版塊個股 |
| Admin 新增個股 | 新增 NVDA，成功後列表出現 NVDA |
| Ticker 唯一驗證 | 新增已存在的 AAPL → 顯示錯誤 `Ticker 已存在` |
| Admin 編輯個股 | 編輯 AAPL 公司簡介，儲存後詳細頁更新 |
| 刪除保護 | 刪除有持倉的個股 → 顯示 `無法刪除：有使用者持倉` |
| 無持倉刪除 | 刪除無持倉的個股 → 成功，列表移除該個股 |
| USER 無法新增/刪除 | USER 訪問新增/刪除功能 → 403 Forbidden 或按鈕不顯示 |
| 個股詳細頁報價 | 訪問 `/stocks/AAPL`，顯示現價（若 Alpha Vantage 可用） |

---

## 5. 技術規格

| 項目 | 規格 |
|---|---|
| ORM | Spring Data JPA + Hibernate |
| 資料庫 | PostgreSQL `stock_db`，表：`stocks` |
| 查詢最佳化 | `ticker`、`market`、`sector` 欄位建立索引 |
| 服務間呼叫 | OpenFeign Client 呼叫 portfolio-service（搭配 timeout 設定：connectTimeout 2s, readTimeout 5s） |
| 前端狀態管理 | TanStack Query（stocks list key: `['stocks', filters]`，detail key: `['stocks', ticker]`） |
| 前端表單 | react-hook-form + zod schema |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
