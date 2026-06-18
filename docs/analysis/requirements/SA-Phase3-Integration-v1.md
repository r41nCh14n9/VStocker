# SA-Phase3-Integration-v1.md
# Phase 3：AI 個股分析與進階功能 — 統整系統分析文件

**版本：** v1.0  
**建立日期：** 2026-06-18  
**所屬計畫：** [PLAN-VStocker-v4.md](../../plans/active/PLAN-VStocker-v4.md)  
**里程碑：** M3（目標：2026-11-15，滾動）  
**前置依賴：** Phase 2 完成（M2 驗收通過，k8s 生產環境穩定運行）  
**負責人：** Roy Chiang  

---

## 1. 階段概述

Phase 3 在 VStocker 已建立的完整雙軌（美股/台股）基礎上，新增三個方向的能力：

### 方向 A：AI 個股深度分析（核心差異化功能）

整合 **Anthropic Claude API** 至新建的 `ai-service` 微服務，提供：
- 個股 AI 深度分析報告（透過 SSE 串流即時輸出）
- 持倉整體風險評分

### 方向 B：技術分析圖表

強化個股詳細頁的技術分析能力：
- K 線圖（日/週/月線）
- 技術指標（MA20/MA60、RSI、MACD）

### 方向 C：體驗優化

提升系統整體使用體驗：
- 市場新聞整合（個人化）
- 財報日曆磁貼
- 命令面板（⌘K 快速搜尋）
- 暗色/亮色主題切換
- 效能優化
- k8s HPA 自動擴縮容

---

## 2. 範疇界定

### 2.1 納入範疇（In Scope）

| 方向 | 項目 | 優先級 |
|---|---|---|
| **AI** | ai-service 模組（Spring Boot + Claude API Adapter） | P0 |
| **AI** | StockAnalysis Domain（分析請求、結果快取 24h） | P0 |
| **AI** | POST /ai/stocks/{ticker}/analysis（SSE 串流） | P0 |
| **AI** | 持倉風險評分 API | P1 |
| **AI** | ai-service Helm Chart + k8s 部署（含 Resource Limit） | P0 |
| **圖表** | 個股 K 線圖（Recharts ComposedChart） | P0 |
| **圖表** | 技術指標（MA20/MA60、RSI、MACD） | P0 |
| **圖表** | 前端 AI 分析面板（SSE 串流顯示） | P0 |
| **體驗** | 市場新聞整合（NewsAPI/RSS，按持倉過濾） | P1 |
| **體驗** | 財報日曆磁貼 | P1 |
| **體驗** | 命令面板（⌘K） | P2 |
| **體驗** | 暗色/亮色主題切換 | P1 |
| **體驗** | 效能優化（Query 快取、Recharts 虛擬化） | P1 |
| **體驗** | k8s HPA（market-data, ai-service） | P1 |

### 2.2 排除範疇（Out of Scope）

- 實際下單 / 券商 API 串接
- 社群功能（分享持倉、投資社群）
- 行動端 APP
- 加密貨幣、衍生品分析
- 自訓練 AI 模型（使用 Claude API 現有能力）

---

## 3. 涉及角色（Actors）

| 角色 | 說明 | Phase 3 新增能力 |
|---|---|---|
| USER | 一般使用者 | 觸發 AI 分析、查看 K 線圖、接收技術指標、快速搜尋股票 |
| ADMIN | 管理員 | 同 USER，額外可查看 AI 使用統計（未來擴充） |
| Claude API（Anthropic） | AI 分析提供者 | 接收個股資料、財報摘要，返回分析文字 |
| NewsAPI / RSS | 新聞提供者 | 提供市場新聞（按股票過濾） |
| k8s HPA Controller | 自動擴縮容 | 根據 CPU/記憶體自動調整 ai-service、market-data Pod 數量 |

---

## 4. 核心用例一覽

### 4.1 AI 分析用例群

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P3-AI-01 | 觸發個股 AI 深度分析 | USER | P0 |
| UC-P3-AI-02 | 即時接收 SSE 串流分析結果 | USER | P0 |
| UC-P3-AI-03 | 查詢已快取的分析結果（24h 內不重新分析） | USER | P0 |
| UC-P3-AI-04 | 查看持倉整體風險評分 | USER | P1 |
| UC-P3-AI-05 | ai-service Pod 自動水平擴展（HPA） | k8s HPA | P1 |

### 4.2 圖表用例群

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P3-C-01 | 查看個股日線 K 線圖 | USER | P0 |
| UC-P3-C-02 | 切換 K 線時間週期（日/週/月） | USER | P0 |
| UC-P3-C-03 | 疊加 MA20/MA60 移動平均線 | USER | P0 |
| UC-P3-C-04 | 查看 RSI 指標面板 | USER | P0 |
| UC-P3-C-05 | 查看 MACD 指標面板 | USER | P0 |

### 4.3 體驗優化用例群

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P3-X-01 | 查看個人化市場新聞（按持倉股票過濾） | USER | P1 |
| UC-P3-X-02 | 查看財報日曆（美股 Earnings / 台股法說） | USER | P1 |
| UC-P3-X-03 | 使用 ⌘K 命令面板快速搜尋股票 | USER | P2 |
| UC-P3-X-04 | 切換暗色/亮色主題 | USER | P1 |

---

## 5. 服務架構概覽

### 5.1 ai-service 架構

```
ai-service（新增微服務）
    │
    ├── Interface Layer
    │   └── POST /ai/stocks/{ticker}/analysis（SSE Response）
    │   └── POST /ai/portfolios/me/risk-score
    │
    ├── Application Layer
    │   └── StockAnalysisApplicationService
    │       ├── 檢查快取（Redis，key: ai:analysis:{ticker}，TTL 24h）
    │       ├── 若快取無效 → 呼叫 Claude API
    │       └── 以 SSE 串流返回分析結果
    │
    ├── Domain Layer
    │   ├── StockAnalysis（Aggregate Root）
    │   │   ├── id, ticker, analysisContent, generatedAt
    │   │   └── isExpired(): boolean（24h 判斷）
    │   └── AnalysisPromptBuilder（Domain Service）
    │       └── 組裝個股基本資料 + 最新行情 → Claude Prompt
    │
    └── Infrastructure Layer
        ├── ClaudeApiAdapter（呼叫 Anthropic Claude API）
        │   ├── 使用 claude-sonnet-4-6 或最新可用模型
        │   └── Streaming 支援（messages.stream()）
        ├── MarketDataClient（OpenFeign → market-data-service）
        └── StockClient（OpenFeign → stock-service）
```

### 5.2 前端 AI 分析面板

```
前端個股詳細頁
    │
    ├── [K 線圖區塊]
    │   └── Recharts ComposedChart（Candlestick + Volume + MA）
    │
    ├── [技術指標區塊]
    │   ├── RSI 面板（Recharts LineChart）
    │   └── MACD 面板（Recharts ComposedChart）
    │
    └── [AI 分析區塊]
        ├── "生成 AI 分析" 按鈕
        ├── 分析中：SSE 串流文字逐字顯示
        └── 完成：完整分析報告（Markdown 渲染）
```

---

## 6. AI 整合設計要點

### 6.1 Claude API 呼叫規格

| 項目 | 規格 |
|---|---|
| 模型 | `claude-sonnet-4-6`（或最新 Sonnet 系列） |
| 呼叫方式 | Messages API Streaming（SSE） |
| 輸入 Prompt | 個股基本資料 + 最近 30 日行情摘要 + 財務指標（若有） |
| 輸出 | 繁體中文分析報告（多個分析維度） |
| 快取 | Redis，key: `ai:analysis:{ticker}`，TTL 86400s（24h） |
| 限流 | 每個使用者每小時最多觸發 10 次分析請求 |
| 錯誤處理 | Claude API 超時（30s）→ 返回部分結果 + 提示使用者 |

### 6.2 分析 Prompt 結構

```
系統角色：你是一位專業的股票分析師，提供客觀的個股基本面分析。

使用者輸入：
- 股票代碼：{ticker}，公司名稱：{name}
- 所屬版塊：{sector}，交易所：{exchange}
- 最新收盤價：{lastPrice}，52週高/低：{high52w}/{low52w}
- 最近 30 日漲跌幅：{priceChange30d}%

請從以下維度分析並給出投資參考：
1. 公司基本面簡介
2. 近期股價走勢分析
3. 版塊競爭地位
4. 主要風險因素
5. 技術面觀察重點

免責聲明：本分析僅供參考，不構成投資建議。
```

---

## 7. 技術指標計算規格

| 指標 | 計算來源 | 計算位置 | 說明 |
|---|---|---|---|
| MA20 / MA60 | 歷史收盤價 | 前端（由行情資料計算） | 簡單移動平均 |
| RSI | 歷史收盤價 | 前端（14 日 RSI） | Wilder's RSI |
| MACD | 歷史收盤價 | 前端 | EMA12 - EMA26，Signal EMA9 |
| K 線資料來源 | market-data-service | 後端提供歷史 OHLCV | 呼叫 Alpha Vantage TIME_SERIES_DAILY |

---

## 8. k8s HPA 規格

| 服務 | 觸發條件 | 最小 Pod 數 | 最大 Pod 數 |
|---|---|---|---|
| market-data-service | CPU > 70% | 1 | 5 |
| ai-service | CPU > 60% 或記憶體 > 512Mi | 1 | 3 |

---

## 9. 功能需求分組摘要

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P3-AI-01 | ai-service 模組建立 + Claude API Adapter | FR-P3-AI-Charts-v1.md §3.1 |
| FG-P3-AI-02 | StockAnalysis Domain + 快取機制 | FR-P3-AI-Charts-v1.md §3.2 |
| FG-P3-AI-03 | SSE 串流分析 API（POST + EventSource） | FR-P3-AI-Charts-v1.md §3.3 |
| FG-P3-AI-04 | 持倉風險評分 | FR-P3-AI-Charts-v1.md §3.4 |
| FG-P3-AI-05 | ai-service Helm Chart + Resource Limit | FR-P3-AI-Charts-v1.md §3.5 |
| FG-P3-C-01 | K 線圖（Recharts，OHLCV） | FR-P3-AI-Charts-v1.md §4.1 |
| FG-P3-C-02 | 技術指標（MA/RSI/MACD） | FR-P3-AI-Charts-v1.md §4.2 |
| FG-P3-C-03 | 前端 AI 分析面板（SSE + Markdown 渲染） | FR-P3-AI-Charts-v1.md §4.3 |
| FG-P3-X-01 | 市場新聞整合 | FR-P3-AI-Charts-v1.md §5.1 |
| FG-P3-X-02 | 財報日曆磁貼 | FR-P3-AI-Charts-v1.md §5.2 |
| FG-P3-X-03 | 命令面板（⌘K） | FR-P3-AI-Charts-v1.md §5.3 |
| FG-P3-X-04 | 暗色/亮色主題 | FR-P3-AI-Charts-v1.md §5.4 |
| FG-P3-X-05 | 效能優化 | FR-P3-AI-Charts-v1.md §5.5 |
| FG-P3-X-06 | k8s HPA | FR-P3-AI-Charts-v1.md §5.6 |

---

## 10. 技術約束與假設

| 類別 | 約束 / 假設 |
|---|---|
| Claude API | 需申請 Anthropic API Key；建議使用 claude-sonnet-4-6 平衡效能與費用 |
| Claude API 費用 | 設定月度預算警示（建議 $50/月上限）；節流 + 快取 24h 控制費用 |
| SSE | 前端使用 EventSource API；後端 Spring Boot 使用 SseEmitter |
| ai-service Resource Limit | requests: 256Mi memory, 100m CPU；limits: 512Mi memory, 500m CPU |
| MACD/RSI | Phase 3 初版在前端計算（避免後端複雜度），後期可移至 market-data-service |
| 歷史行情 | Alpha Vantage TIME_SERIES_DAILY（最多 100 日，免費版），快取 TTL 24h |
| NewsAPI | 免費版 100 req/day 限制；依持倉股票 ticker 過濾新聞 |

---

## 11. 里程碑驗收標準（M3）

**目標日期：** 2026-11-15（滾動，P0 項目先行）

| 驗收情境 | 通過條件 |
|---|---|
| AI 分析觸發 | 點擊「生成 AI 分析」→ SSE 連線建立，文字逐字顯示 |
| 快取命中 | 24h 內再次請求相同 ticker → 立即返回快取結果 |
| K 線圖顯示 | 個股詳細頁顯示過去 3 個月日線 K 線圖 |
| MA 指標疊加 | MA20/MA60 線正確計算並疊加於 K 線圖上 |
| HPA 生效 | 模擬高負載 → market-data Pod 數量自動增加 |
| 主題切換 | 點擊主題按鈕 → 介面即時切換暗色/亮色，狀態持久化 |
| 命令面板 | 按 ⌘K → 命令面板開啟，輸入股票代碼 → 跳轉至個股頁 |

---

## 12. 交付物清單

| 文件 / 產出物 | 類型 | 位置 |
|---|---|---|
| SA-Phase3-Integration-v1.md（本文件） | 分析文件 | docs/analysis/requirements/ |
| FR-P3-AI-Charts-v1.md（Phase 3 詳細需求） | 需求文件 | docs/analysis/requirements/ |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
