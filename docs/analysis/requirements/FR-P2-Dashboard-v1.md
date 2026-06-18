# FR-P2-Dashboard-v1.md
# Phase 2：儀表板 Treemap — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase2-Integration-v1.md](./SA-Phase2-Integration-v1.md)  
**涵蓋服務：** 儀表板 BFF API（portfolio-service 或獨立）、前端 Treemap + Bento Grid  
**任務 ID：** P2-D-01 ~ P2-D-06  

---

## 1. 儀表板聚合 API（BFF）（P2-D-01）

### 1.1 設計原則

儀表板需要整合多個服務的資料：
- `portfolio-service`：使用者持倉資料
- `market-data-service`：批量即時報價
- `sector-service`：版塊分組資訊

為避免前端多次 API 請求（N+1 問題），設計 **BFF（Backend for Frontend）** 聚合端點，一次呼叫返回儀表板所需的全部資料。

**BFF 位置決策：**

| 選項 | 優點 | 缺點 |
|---|---|---|
| portfolio-service 擴充 | 不需新增服務 | portfolio-service 職責擴大 |
| 獨立 dashboard-service | 職責清晰 | 多一個服務 |
| Gateway 層聚合 | 無需新服務 | Gateway 職責混雜 |

**決策：Phase 2 在 portfolio-service 中新增 `/dashboard` 路由**（避免過早服務拆分）

---

### 1.2 聚合 API 規格

#### GET /dashboard（portfolio-service 內）

| 項目 | 說明 |
|---|---|
| 角色 | USER / ADMIN（已登入） |
| Query 參數 | `market=US\|TW`（依 Switch Tag），`sectorId`（可選，若未指定則返回所有版塊） |
| 業務邏輯 | 1. 取使用者持倉（依 market）2. 批量取得所有持倉股票現價（market-data-service）3. 取版塊資訊（sector-service）4. 聚合計算並返回 DashboardDto |

**DashboardDto 結構：**
```json
{
  "market": "US",
  "summary": {
    "totalMarketValue": 50000.00,
    "totalCost": 42000.00,
    "totalUnrealizedPnL": 8000.00,
    "totalUnrealizedPnLPercent": 19.05,
    "todayPnL": 1200.00,
    "todayPnLPercent": 2.45,
    "topGainer": { "ticker": "NVDA", "changePercent": 5.2 },
    "topLoser": { "ticker": "TSLA", "changePercent": -2.1 }
  },
  "sectorTreemap": [
    {
      "sectorId": "uuid",
      "sectorName": "Technology",
      "marketValue": 30000.00,
      "pnLPercent": 22.5,
      "stocks": [
        {
          "ticker": "AAPL",
          "name": "Apple Inc.",
          "shares": 10,
          "marketValue": 1755.00,
          "changePercent": 1.2,
          "changeToday": 20.50
        }
      ]
    }
  ],
  "marketIndex": {
    "symbol": "SPX",
    "name": "S&P 500",
    "price": 5200.00,
    "changePercent": 0.8
  },
  "dataUpdatedAt": "2026-06-18T10:30:00Z"
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-D-01 | BFF 端點一次呼叫，前端無需多次串聯請求 |
| FR-P2-D-02 | 批量報價使用 parallel CompletableFuture 呼叫（非串列），降低等待時間 |
| FR-P2-D-03 | 個股報價失敗不中斷整體回應（標記 `currentPrice: null`，`changePercent: null`） |
| FR-P2-D-04 | 今日損益（`todayPnL`）= Σ（持倉股數 × 個股今日漲跌金額） |
| FR-P2-D-05 | 最大漲跌幅個股：取持倉股票中 `changePercent` 最大/最小值 |
| FR-P2-D-06 | BFF API 回應時間目標：< 2 秒（含批量報價呼叫） |

---

## 2. 前端 Treemap 元件（P2-D-02）

### 2.1 Treemap 規格

**使用函式庫：** Recharts 3.x `Treemap` 元件

| 項目 | 規格 |
|---|---|
| 面積映射 | 持倉市值（`marketValue`）→ 方格面積 |
| 顏色映射 | 漲跌幅（`changePercent`）→ 方格顏色 |
| 顏色範圍 | 漲 > 3%：深綠（#22c55e）；0~3%：淺綠（#86efac）；-3%~0%：淺紅（#fca5a5）；跌 > 3%：深紅（#ef4444） |
| 顯示上限 | 每個版塊最多顯示 50 支個股（避免渲染效能問題） |
| 最小方格 | market value < 1% 的個股合併顯示為 "Others" |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-D-07 | 使用 Recharts `<Treemap>` 元件渲染版塊持倉資料 |
| FR-P2-D-08 | 每個方格顯示：Ticker、今日漲跌幅（%）、持倉市值 |
| FR-P2-D-09 | 方格顏色依今日漲跌幅動態計算（4 個顏色等級） |
| FR-P2-D-10 | Hover 時顯示 Tooltip：公司名稱、現價、漲跌金額、持倉市值、持有股數 |
| FR-P2-D-11 | 點擊個股方格跳轉至個股詳細頁（`/stocks/{ticker}`） |
| FR-P2-D-12 | Recharts Treemap 使用 `memo` 優化，只在資料變更時重新渲染 |
| FR-P2-D-13 | 持倉資料為空時顯示空狀態：`還沒有持倉，點擊新增個股至版塊` |

**Treemap 元件實作參考：**
```tsx
// src/components/dashboard/PortfolioTreemap.tsx
import { Treemap, ResponsiveContainer } from 'recharts';

const colorScale = (changePercent: number) => {
  if (changePercent >= 3) return '#22c55e';
  if (changePercent >= 0) return '#86efac';
  if (changePercent >= -3) return '#fca5a5';
  return '#ef4444';
};

export function PortfolioTreemap({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={data}
        dataKey="marketValue"
        content={<CustomTreemapContent />}
      />
    </ResponsiveContainer>
  );
}
```

---

## 3. 版塊選擇器（P2-D-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-D-14 | 儀表板頂部顯示版塊選擇器（Tab 或 Select 元件），列出使用者持倉所屬版塊 |
| FR-P2-D-15 | 預設選中版塊：使用者的 `currentSectorId`（若無則顯示全部版塊） |
| FR-P2-D-16 | 選擇版塊後：Treemap 立即過濾顯示該版塊的持倉（前端過濾，不重新 fetch） |
| FR-P2-D-17 | 版塊選擇切換時更新 Zustand sector store，並異步同步至後端偏好 |
| FR-P2-D-18 | 版塊選擇器顯示每個版塊的持倉市值佔比（%）作為標籤 |

---

## 4. 統整資訊磁貼 Bento Grid（P2-D-04）

### 4.1 Bento Grid 布局

```
┌─────────────────────────────────────────────────────────┐
│  [Treemap（主要區塊，佔 2/3 寬度）]  [版塊選擇器]       │
│                                                          │
│  [總持倉市值]  [今日損益]  [最大漲幅個股]  [最大跌幅個股]│
│                                                          │
│  [指數磁貼（S&P 500 或 加權指數）]  [持倉損益摘要表]    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 磁貼規格

| 需求編號 | 磁貼名稱 | 內容 |
|---|---|---|
| FR-P2-D-19 | 總持倉市值磁貼 | 以大字顯示當前市場總持倉市值（USD 或 TWD），副文字顯示總成本 |
| FR-P2-D-20 | 今日損益磁貼 | 今日損益金額（含 + 或 - 符號）、損益百分比（%）、顏色區分正負 |
| FR-P2-D-21 | 最大漲幅個股磁貼 | 今日漲幅最大的持倉個股：Ticker、公司名、漲幅%（綠色） |
| FR-P2-D-22 | 最大跌幅個股磁貼 | 今日跌幅最大的持倉個股：Ticker、公司名、跌幅%（紅色） |
| FR-P2-D-23 | 各磁貼使用 Framer Motion 進入動畫（stagger 效果，依序出現） |
| FR-P2-D-24 | 磁貼使用 shadcn/ui Card 元件實作，支援 Hover 效果 |

**磁貼元件結構：**
```tsx
// src/components/dashboard/SummaryCard.tsx
interface SummaryCardProps {
  title: string;
  value: string | number;
  subvalue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
}
```

---

## 5. 指數磁貼（P2-D-05）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-D-25 | 依當前 Switch Tag 市場顯示對應指數：US → S&P 500（SPX）；TW → 加權指數（TWSE） |
| FR-P2-D-26 | 指數磁貼顯示：指數名稱、當前指數點數、今日漲跌點數、漲跌幅（%） |
| FR-P2-D-27 | Switch Tag 切換時，指數磁貼自動更新顯示對應市場指數 |
| FR-P2-D-28 | 指數資料由 `GET /market-data/indices?symbols=SPX,TWSE` 提供 |
| FR-P2-D-29 | 指數資料每 60 秒自動刷新（TanStack Query refetchInterval） |

**market-data-service 指數端點（新增）：**
```
GET /market-data/indices?symbols=SPX,TWSE
回應：{ 
  "SPX": { "name": "S&P 500", "price": 5200.00, "changePercent": 0.8 },
  "TWSE": { "name": "加權指數", "price": 21000.00, "changePercent": -0.3 }
}
資料來源：Alpha Vantage（SPX）/ TWSE API（加權指數）
```

---

## 6. 持倉損益摘要表（P2-D-06）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-D-30 | 儀表板下方顯示簡化的持倉損益表格，依版塊分組快覽 |
| FR-P2-D-31 | 表格欄位：版塊、持倉市值、今日損益（%）、總未實現損益（%）、前 3 支個股 |
| FR-P2-D-32 | 點擊版塊行 → 跳轉至持倉列表（`/portfolio?sector={sectorName}`） |
| FR-P2-D-33 | 表格顯示每版塊前 3 大市值個股（超過顯示 "+N more"） |

---

## 7. 資料刷新策略

| 資料類型 | 刷新頻率 | 說明 |
|---|---|---|
| 儀表板聚合資料 | 60s auto-refetch | `refetchInterval: 60000` |
| 指數磁貼 | 60s auto-refetch | 與主資料同步刷新 |
| 版塊選擇器 | 按需（使用者切換） | 不自動刷新 |
| 今日損益 | 依主資料更新 | 跟隨報價更新 |

---

## 8. 效能需求

| 需求 | 目標 |
|---|---|
| Treemap 首次渲染 | < 500ms（資料已載入後） |
| BFF API 回應 | < 2 秒 |
| 版塊切換響應 | < 200ms（前端過濾，無 API 呼叫） |
| 每版塊最大個股數 | 50 支（超過截斷，避免渲染效能問題） |

---

## 9. 驗收標準

| 情境 | 通過條件 |
|---|---|
| 儀表板載入 | 登入後首頁顯示完整 Bento Grid，Treemap 正確渲染 |
| 無持倉狀態 | 空持倉時顯示引導訊息，不渲染空 Treemap |
| Treemap 顏色 | AAPL +2% 顯示淺綠色，TSLA -4% 顯示深紅色 |
| Hover Tooltip | Hover 方格顯示個股詳細資訊 |
| 點擊跳轉 | 點擊 AAPL 方格跳轉至 `/stocks/AAPL` |
| 版塊選擇器切換 | 選擇 "Technology" 後 Treemap 僅顯示科技版塊持倉 |
| Switch Tag 聯動 | 切換 US→TW 後，Treemap 顯示台股持倉，指數磁貼換為加權指數 |
| 損益摘要 | 摘要磁貼顯示正確的總市值、今日損益 |
| 60s 刷新 | 等待 60s 後報價和損益自動更新 |
| Framer Motion | 頁面載入時磁貼依序出現（stagger 動畫） |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
