# MILESTONE-TRACKER-v3.md
# VStocker 里程碑與任務追蹤

**最後更新：** 2026-06-17  
**關聯計畫：** [PLAN-VStocker-v3.md](./PLAN-VStocker-v3.md)

---

## 里程碑狀態總覽

| 里程碑 | 目標日期 | 狀態 | 完成度 |
|---|---|---|---|
| M0 環境建置 | 2026-06-28 | 未開始 | 0% |
| M1 Auth + 美股核心 | 2026-08-09 | 未開始 | 0% |
| M2 台股 + Switch + 版塊 + 儀表板 | 2026-09-20 | 未開始 | 0% |
| M3 AI 個股分析 | 2026-11-01 | 未開始 | 0% |

---

## Phase 0：環境建置與技術驗證

### 前端

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P0-F-01 | Next.js 15 + TypeScript 專案骨架（App Router） | 待辦 | - | |
| P0-F-02 | shadcn/ui + Tailwind CSS v4 整合 | 待辦 | - | |
| P0-F-03 | Zustand + TanStack Query 基礎結構 | 待辦 | - | |

### 後端

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P0-B-01 | Gradle Multi-Module 骨架（gateway, auth, stock, portfolio, sector, market-data） | 待辦 | - | |
| P0-B-02 | Docker Compose（PostgreSQL×5, Redis, Kafka, Eureka, Config Server） | 待辦 | - | |
| P0-B-03 | Spring Cloud Gateway + Eureka 基本配置 | 待辦 | - | |
| P0-B-04 | JWT 流程驗證（gateway 驗證 → User Context 轉發） | 待辦 | - | |
| P0-B-05 | Alpha Vantage API Adapter POC | 待辦 | - | 需申請 API Key |
| P0-B-06 | TWSE Open API Adapter POC | 待辦 | - | 免費，免申請 |
| P0-B-07 | 統一 API Response 格式 + Error Code 規範 | 待辦 | - | |

---

## Phase 1：Auth + 美股個股 + 美股持倉

### P1-Auth：auth-service

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-A-01 | User Aggregate 設計（User, Role, Credential） | 待辦 | - | DDD 分層 |
| P1-A-02 | POST /auth/register、POST /auth/login（JWT 發行） | 待辦 | - | |
| P1-A-03 | Spring Security + bcrypt + Stateless JWT | 待辦 | - | |
| P1-A-04 | ADMIN / USER 角色設計 + Route 授權規則 | 待辦 | - | |
| P1-A-05 | GET /users（Admin）、PATCH /users/{id}/status | 待辦 | - | P1 優先級 |
| P1-A-06 | PUT /users/me/preferences（marketMode 偏好） | 待辦 | - | P1 優先級 |

### P1-FA：前端登入

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-FA-01 | 登入頁面（email + password，JWT 存 cookie） | 待辦 | - | |
| P1-FA-02 | Next.js middleware.ts Route 保護 | 待辦 | - | |
| P1-FA-03 | Zustand auth store | 待辦 | - | |

### P1-S：stock-service（美股）

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-S-01 | Stock Aggregate 設計 | 待辦 | - | DDD 分層 |
| P1-S-02 | CRUD API（GET list, GET by ticker, POST, PUT, DELETE） | 待辦 | - | |
| P1-S-03 | 市場篩選（?market=US&sector=） | 待辦 | - | |
| P1-S-04 | 刪除保護（有持倉時拒絕） | 待辦 | - | P1 優先級 |
| P1-S-05 | 初始美股資料 Seed | 待辦 | - | P1 優先級 |

### P1-FS：前端美股管理

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-FS-01 | 美股個股列表頁（搜尋、篩選、分頁） | 待辦 | - | |
| P1-FS-02 | 個股詳細頁（資料 + 報價 + 走勢圖） | 待辦 | - | |
| P1-FS-03 | 個股新增 / 編輯 Modal（Admin） | 待辦 | - | |
| P1-FS-04 | 個股刪除確認 | 待辦 | - | |

### P1-P：portfolio-service（美股持倉）

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-P-01 | Portfolio Aggregate + Position Entity | 待辦 | - | DDD 分層 |
| P1-P-02 | CRUD API（GET /portfolios/me, POST, PUT, DELETE /positions） | 待辦 | - | |
| P1-P-03 | 損益計算 Domain Service（呼叫 market-data-service） | 待辦 | - | |
| P1-P-04 | 依版塊分組查詢（?groupBy=sector） | 待辦 | - | P1 優先級 |

### P1-FP：前端美股持倉

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P1-FP-01 | 持倉列表頁（版塊分組、損益顯示） | 待辦 | - | |
| P1-FP-02 | 持倉新增 Modal | 待辦 | - | |
| P1-FP-03 | 持倉編輯 / 刪除 | 待辦 | - | |

---

## Phase 2：台股 + Switch Tag + 版塊 + 儀表板

### P2-S：stock-service 台股擴充

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-S-01 | 台股個股 CRUD（market=TW） | 待辦 | - | |
| P2-S-02 | 初始台股資料 Seed（台灣 50 等） | 待辦 | - | P1 優先級 |

### P2-M：market-data-service 台股

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-M-01 | TWSE Open API Adapter（盤中 + 收盤） | 待辦 | - | |
| P2-M-02 | Fugle API Adapter（即時備援） | 待辦 | - | P1 優先級 |
| P2-M-03 | Redis 快取策略（US 1min / TW 10s 盤中） | 待辦 | - | |

### P2-P：portfolio-service 台股持倉

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-P-01 | 台股持倉 CRUD（幣別 TWD） | 待辦 | - | |
| P2-P-02 | 美股損益 USD→TWD 換算 | 待辦 | - | P1 優先級 |

### P2-SW：Switch Tag（前端）

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-SW-01 | Switch Tag UI 元件（全域 Header） | 待辦 | - | |
| P2-SW-02 | Zustand marketMode store | 待辦 | - | |
| P2-SW-03 | 全頁自動 filter 對應市場 | 待辦 | - | |
| P2-SW-04 | 偏好持久化至 DB | 待辦 | - | P1 優先級 |

### P2-SEC：sector-service + 前端

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-SEC-01 | Sector Aggregate 設計 | 待辦 | - | DDD 分層 |
| P2-SEC-02 | 版塊 CRUD API（含 market 區分） | 待辦 | - | |
| P2-SEC-03 | 成分股管理 API | 待辦 | - | |
| P2-SEC-04 | 前端版塊管理頁（Admin） | 待辦 | - | |
| P2-SEC-05 | 使用者版塊選擇（currentSectorId） | 待辦 | - | |

### P2-D：儀表板 Treemap

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P2-D-01 | 儀表板聚合 API（BFF，匯整持倉+行情） | 待辦 | - | |
| P2-D-02 | 前端 Treemap（Recharts，面積=市值，顏色=漲跌幅） | 待辦 | - | 最複雜任務 |
| P2-D-03 | 版塊選擇器（切換 Treemap） | 待辦 | - | |
| P2-D-04 | 統整資訊磁貼（總市值、今日損益、最大漲/跌） | 待辦 | - | |
| P2-D-05 | 指數磁貼（配合 Switch Tag） | 待辦 | - | P1 優先級 |
| P2-D-06 | 持倉損益摘要表（依版塊分組） | 待辦 | - | P1 優先級 |

---

## Phase 3：AI 個股分析與進階功能

### P3-AI：ai-service

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P3-AI-01 | ai-service 模組建立（Spring Boot + Claude API） | 待辦 | - | |
| P3-AI-02 | StockAnalysis Domain 設計（快取 24h） | 待辦 | - | |
| P3-AI-03 | POST /ai/stocks/{ticker}/analysis（SSE 串流） | 待辦 | - | |
| P3-AI-04 | 持倉風險評分 API | 待辦 | - | P1 優先級 |

### P3-C：前端圖表

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P3-C-01 | 個股 K 線圖（Recharts，日/週/月） | 待辦 | - | |
| P3-C-02 | 技術指標（MA20/60、RSI、MACD） | 待辦 | - | |
| P3-C-03 | AI 分析面板（SSE 串流顯示） | 待辦 | - | |

### P3-X：體驗優化

| 任務 ID | 任務描述 | 狀態 | 完成日 | 備註 |
|---|---|---|---|---|
| P3-X-01 | 市場新聞整合 | 待辦 | - | P1 優先級 |
| P3-X-02 | 財報日曆磁貼 | 待辦 | - | P1 優先級 |
| P3-X-03 | 命令面板（⌘K） | 待辦 | - | P2 優先級 |
| P3-X-04 | 暗色 / 亮色主題切換 | 待辦 | - | P1 優先級 |
| P3-X-05 | 效能優化（Query 快取、Recharts 優化） | 待辦 | - | P1 優先級 |

---

## API 申請狀態

| 服務 | 申請狀態 | 備註 |
|---|---|---|
| Alpha Vantage | 待申請 | 免費版 5 req/min |
| Polygon.io | 待申請 | 免費版延遲 15 分鐘 |
| Fugle Market Data | 待申請 | 台股即時資料 |
| Anthropic Claude | 待確認 | Phase 3 AI 功能 |

---

## 更新日誌

| 日期 | 版本 | 更新內容 |
|---|---|---|
| 2026-06-17 | v1.0 | 初版 |
| 2026-06-17 | v2.0 | 重整三階段里程碑 |
| 2026-06-17 | v3.0 | 後端改為 Java DDD 微服務；前端維持 Next.js 15 |
