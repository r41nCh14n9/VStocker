# FR-P1-Portfolio-v1.md
# Phase 1：美股持倉管理 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase1-Integration-v1.md](./SA-Phase1-Integration-v1.md)  
**涵蓋服務：** `portfolio-service`（後端）、前端美股持倉頁面  
**任務 ID：** P1-P-01 ~ P1-P-04、P1-FP-01 ~ P1-FP-03  

---

## 1. 領域模型（Domain Model）

### 1.1 Portfolio Aggregate（P1-P-01）

```
Portfolio (Aggregate Root)
├── id: UUID                      主鍵
├── userId: UUID                  關聯 auth-service User（非 FK，服務間解耦）
├── currency: Currency            'USD'（Phase 1 固定），Phase 2 擴充 'TWD'
├── createdAt: Instant
└── updatedAt: Instant

Position (Entity，屬於 Portfolio Aggregate)
├── id: UUID                      主鍵
├── portfolioId: UUID             FK → Portfolio.id
├── ticker: String                股票代碼（references stock-service，邏輯關聯）
├── shares: BigDecimal            持有股數（允許小數，支援美股零股）
├── avgCostPrice: BigDecimal      平均成本價（USD，Phase 1）
├── createdAt: Instant
└── updatedAt: Instant

Currency: enum { USD, TWD }
```

### 1.2 業務規則

| 規則編號 | 規則描述 |
|---|---|
| BR-PORT-01 | 每個 User 只有一個 Portfolio（one-to-one 關係，首次操作時自動建立） |
| BR-PORT-02 | 同一個 Portfolio 不允許重複的 ticker（已存在 ticker 的持倉應更新，而非新增第二筆） |
| BR-PORT-03 | `shares` 必須為正數（> 0），不允許 0 或負數 |
| BR-PORT-04 | `avgCostPrice` 必須為非負數（>= 0） |
| BR-PORT-05 | 刪除持倉（Position）時，若 Portfolio 中仍有其他 Position，Portfolio 本身不刪除 |
| BR-PORT-06 | 使用者只能操作自己的 Portfolio（依據 `X-User-Id` Header） |
| BR-PORT-07 | ADMIN 不能操作其他使用者的 Portfolio（Portfolio 是純個人資產，不存在跨使用者管理） |
| BR-PORT-08 | Phase 1 所有 Position 幣別固定為 USD |

---

## 2. 後端 portfolio-service 需求

### 2.1 持倉 CRUD API（P1-P-02）

#### GET /portfolios/me

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN（已登入） |
| 業務邏輯 | 1. 從 `X-User-Id` 取得使用者 ID 2. 若 Portfolio 不存在，自動建立空的 Portfolio 3. 批次呼叫 market-data-service 取得所有持倉個股現價 4. 計算每筆 Position 未實現損益 5. 組裝並返回 PortfolioDto |
| Query 參數 | `groupBy=sector`（可選，P1-P-04） |
| 回應 | `ApiResponse<PortfolioDto>` |

**PortfolioDto（不分組）：**
```json
{
  "id": "uuid",
  "currency": "USD",
  "positions": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "stockName": "Apple Inc.",
      "sector": "Technology",
      "shares": 10,
      "avgCostPrice": 150.00,
      "currentPrice": 175.50,
      "marketValue": 1755.00,
      "unrealizedPnL": 255.00,
      "unrealizedPnLPercent": 17.00
    }
  ],
  "summary": {
    "totalMarketValue": 5000.00,
    "totalCost": 4200.00,
    "totalUnrealizedPnL": 800.00,
    "totalUnrealizedPnLPercent": 19.05
  }
}
```

#### POST /positions

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN |
| 請求 Body | `{ "ticker": "AAPL", "shares": 10, "avgCostPrice": 150.00 }` |
| 業務邏輯 | 1. 驗證 ticker 存在於 stock-service（呼叫 `GET /internal/stocks/{ticker}/exists`）2. 確認 Portfolio 存在（否則自動建立）3. 檢查 ticker 是否已在 Portfolio 中（BR-PORT-02）：已存在則返回 40901 建議用 PUT 更新 4. 建立 Position |
| 成功回應 | 201 Created，`ApiResponse<PositionDto>` |
| 錯誤 | 40401（ticker 不存在於 stock-service）、40901（ticker 已在持倉中）、42201（驗證失敗） |

#### PUT /positions/{id}

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN |
| 請求 Body | `{ "shares": 15, "avgCostPrice": 155.00 }`（不含 ticker） |
| 業務邏輯 | 1. 確認 Position 屬於當前使用者（BR-PORT-06）2. 更新 shares 及 avgCostPrice |
| 成功回應 | 200 OK，`ApiResponse<PositionDto>` |
| 錯誤 | 40401（Position 不存在）、40301（非本人持倉）、42201（驗證失敗） |

#### DELETE /positions/{id}

| 項目 | 說明 |
|---|---|
| 角色限制 | USER / ADMIN |
| 業務邏輯 | 1. 確認 Position 屬於當前使用者（BR-PORT-06）2. 刪除 Position |
| 成功回應 | 204 No Content |
| 錯誤 | 40401（Position 不存在）、40301（非本人持倉） |

#### GET /internal/portfolios/has-position?ticker={ticker}

| 項目 | 說明 |
|---|---|
| 用途 | 供 stock-service 呼叫，確認是否有任何使用者持有此 ticker |
| 角色限制 | 無（服務間內部呼叫，不走 Gateway） |
| 回應 | `{ "hasPosition": true/false }` |

---

### 2.2 損益計算 Domain Service（P1-P-03）

**計算邏輯：**

```
市場價值（Market Value）= shares × currentPrice
成本（Cost）= shares × avgCostPrice
未實現損益（Unrealized PnL）= Market Value - Cost
未實現損益%（PnL%）= (PnL / Cost) × 100

Portfolio 總計：
- totalMarketValue = Σ position.marketValue
- totalCost = Σ position.shares × position.avgCostPrice
- totalUnrealizedPnL = totalMarketValue - totalCost
- totalUnrealizedPnLPercent = (totalUnrealizedPnL / totalCost) × 100
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-PORT-01 | 建立 `PnLCalculationService`（Domain Service）封裝損益計算邏輯 |
| FR-P1-PORT-02 | 批次呼叫 market-data-service：`GET /market-data/quotes?symbols=AAPL,MSFT,GOOGL`（批量報價） |
| FR-P1-PORT-03 | market-data-service 批量報價端點：`GET /market-data/quotes?symbols={csv}`，返回 `Map<String, QuoteDto>` |
| FR-P1-PORT-04 | 若某個 ticker 報價取得失敗，該 Position 的 currentPrice 設為 null，損益顯示 `--` |
| FR-P1-PORT-05 | 批量報價呼叫超時設定：3 秒（不允許阻塞持倉頁面太久） |
| FR-P1-PORT-06 | 損益計算結果不快取（每次呼叫即時計算），確保資料新鮮度 |

---

### 2.3 版塊分組查詢（P1-P-04）

#### GET /portfolios/me?groupBy=sector

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-PORT-07 | 當 `groupBy=sector` 時，返回依版塊分組的持倉摘要 |
| FR-P1-PORT-08 | 每個版塊分組包含：版塊名稱、版塊總市值、版塊損益 |
| FR-P1-PORT-09 | `sector` 欄位來自 stock-service（呼叫 stock-service 取得 ticker 的 sector 資訊） |

**PortfolioGroupedDto（groupBy=sector 時）：**
```json
{
  "currency": "USD",
  "sectorGroups": [
    {
      "sector": "Technology",
      "positions": [ ... ],
      "groupMarketValue": 3500.00,
      "groupUnrealizedPnL": 500.00,
      "groupPnLPercent": 16.67
    }
  ],
  "summary": { ... }
}
```

---

## 3. 前端美股持倉頁面

### 3.1 持倉列表頁（P1-FP-01）

**路徑：** `/portfolio`

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FP-01 | 頁面頂部顯示持倉摘要卡片：總市值、總成本、未實現損益（金額 + 百分比） |
| FR-P1-FP-02 | 持倉列表預設按版塊分組顯示（呼叫 `?groupBy=sector`） |
| FR-P1-FP-03 | 每個版塊群組顯示：版塊名稱、版塊小計（市值、損益） |
| FR-P1-FP-04 | 每筆持倉欄位：Ticker、公司名稱、持有股數、平均成本、現價、市值、未實現損益（金額 + 百分比） |
| FR-P1-FP-05 | 損益正值顯示綠色，負值顯示紅色 |
| FR-P1-FP-06 | 頁面右上角「新增持倉」按鈕，點擊開啟新增 Modal |
| FR-P1-FP-07 | 每筆持倉行有「編輯」「刪除」操作按鈕 |
| FR-P1-FP-08 | 使用 TanStack Query 每 60 秒自動 refetch（保持損益更新），refetchOnWindowFocus: true |
| FR-P1-FP-09 | 載入中顯示骨架屏（Skeleton），報價不可用時損益欄位顯示 `--` |

---

### 3.2 持倉新增 Modal（P1-FP-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FP-10 | Modal 標題：「新增持倉」 |
| FR-P1-FP-11 | 股票搜尋欄（Combobox）：輸入 ticker 或公司名稱，即時搜尋 stock-service |
| FR-P1-FP-12 | 選取股票後顯示公司名稱與版塊確認 |
| FR-P1-FP-13 | 填寫欄位：持有股數（數字，支援小數 2 位）、平均成本價（數字，USD，小數 4 位） |
| FR-P1-FP-14 | 前端驗證：股數 > 0、成本價 >= 0 |
| FR-P1-FP-15 | 提交後：若 ticker 已在持倉中（40901），提示使用者「此個股已在持倉中，請直接編輯現有持倉」 |
| FR-P1-FP-16 | 提交成功：關閉 Modal、Invalidate portfolio Query、列表自動更新 |

---

### 3.3 持倉編輯 / 刪除（P1-FP-03）

**編輯 Modal：**

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FP-17 | 編輯 Modal 預填當前持有股數與平均成本 |
| FR-P1-FP-18 | Ticker 欄位唯讀（不可更改，BR-PORT-02 的 ticker 不可修改） |
| FR-P1-FP-19 | 修改股數或成本後儲存，即時更新損益顯示 |

**刪除確認：**

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FP-20 | 點擊刪除 → 彈出 AlertDialog 確認：`確認刪除 {ticker} 持倉？` |
| FR-P1-FP-21 | 確認刪除成功後：顯示 Toast 通知，持倉列表移除該筆 |

---

## 4. 驗收標準

| 情境 | 通過條件 |
|---|---|
| 首次訪問持倉頁 | 顯示空持倉狀態，提示「還沒有持倉，點擊新增」 |
| 新增持倉 | 選取 AAPL，填入 10 股、成本 $150，成功新增 |
| 損益計算 | AAPL 現價 $175，顯示未實現損益 $+250（+16.67%） |
| 版塊分組 | 持有 AAPL（Technology）、JPM（Financials），列表正確分組 |
| 批量報價失敗 | Alpha Vantage 不可用，損益欄位顯示 `--`，不影響頁面渲染 |
| 重複 ticker | 新增已存在的 AAPL → 提示使用者編輯現有持倉 |
| 編輯持倉 | 修改 AAPL 持有股數為 15，更新後損益重新計算 |
| 刪除持倉 | 刪除 AAPL 持倉，列表移除，摘要市值重新計算 |
| 跨使用者隔離 | User A 的持倉 User B 無法訪問（403） |
| 60s 自動刷新 | 等待 60s，損益數字自動更新 |

---

## 5. 技術規格

| 項目 | 規格 |
|---|---|
| 資料庫 | PostgreSQL `portfolio_db`，表：`portfolios`、`positions` |
| 索引 | `positions(portfolio_id, ticker)` 唯一索引（實現 BR-PORT-02） |
| 服務間呼叫 | OpenFeign 呼叫 stock-service（ticker 存在性確認）、market-data-service（批量報價） |
| 損益計算 | 後端計算（非前端），確保計算一致性 |
| 前端刷新策略 | `refetchInterval: 60000`，`refetchOnWindowFocus: true` |
| 數字精度 | `shares` 小數 4 位（BigDecimal），`price` 小數 4 位 |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
