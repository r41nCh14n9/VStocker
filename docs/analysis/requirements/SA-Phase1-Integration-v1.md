# SA-Phase1-Integration-v1.md
# Phase 1：認證 + 美股個股 + 美股持倉 — 統整系統分析文件

**版本：** v1.0  
**建立日期：** 2026-06-18  
**所屬計畫：** [PLAN-VStocker-v4.md](../../plans/active/PLAN-VStocker-v4.md)  
**里程碑：** M1（目標：2026-08-09）  
**前置依賴：** Phase 0 完成（M0 驗收通過）  
**負責人：** Roy Chiang  

---

## 1. 階段概述

Phase 1 是 VStocker 的**第一個完整業務功能迭代**，交付核心使用者旅程：

> 使用者可以登入系統 → 瀏覽/管理美股個股 → 建立自己的美股持倉 → 查看未實現損益

本階段建立三個核心 Bounded Context：
- **Identity & Access**（auth-service）：使用者認證、角色授權
- **Stock Catalog**（stock-service）：美股個股資料管理
- **Portfolio**（portfolio-service）：使用者持倉管理與損益計算

以及對應的前端頁面（登入、美股管理、持倉管理）。

---

## 2. 範疇界定

### 2.1 納入範疇（In Scope）

| 領域 | 項目 |
|---|---|
| auth-service | 使用者註冊、登入、JWT 發行、ADMIN/USER 角色授權、使用者管理（Admin）、偏好設定 |
| stock-service | 美股個股 CRUD、市場/版塊篩選、刪除保護、初始資料 Seed |
| portfolio-service | 美股持倉 CRUD、未實現損益計算（整合 market-data-service）、依版塊分組查詢 |
| 前端：登入 | 登入頁面、Route 保護 Middleware、Zustand auth store |
| 前端：美股管理 | 個股列表、個股詳細頁（含報價走勢圖）、新增/編輯/刪除 Modal |
| 前端：持倉管理 | 持倉列表（版塊分組 + 損益）、新增/編輯/刪除持倉 |

### 2.2 排除範疇（Out of Scope）

- 台股功能（Phase 2）
- Switch Tag（Phase 2）
- 版塊管理（Phase 2）
- Treemap 儀表板（Phase 2）
- AI 分析（Phase 3）
- k8s 部署（Phase 2 前置）

---

## 3. 涉及角色（Actors）

| 角色 | 說明 | 主要操作 |
|---|---|---|
| 匿名使用者 | 未登入的訪客 | 僅能訪問登入頁 |
| USER | 一般已登入使用者 | 瀏覽美股、管理自己的持倉、查看損益 |
| ADMIN | 管理員 | USER 所有權限 + 美股個股 CRUD、使用者管理 |
| auth-service | 認證服務 | 發行 / 驗證 JWT |
| stock-service | 股票目錄服務 | 提供個股資料查詢 |
| portfolio-service | 持倉服務 | 管理使用者持倉、呼叫 market-data-service 計算損益 |
| market-data-service | 行情服務 | 提供即時/最新美股報價（Alpha Vantage Adapter） |

---

## 4. 核心用例一覽

### 4.1 認證用例群（Auth UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P1-A-01 | 使用者註冊 | 匿名 | P0 |
| UC-P1-A-02 | 使用者登入（取得 JWT） | 匿名 | P0 |
| UC-P1-A-03 | 受保護頁面 Route 守衛 | USER/ADMIN | P0 |
| UC-P1-A-04 | Admin 查詢使用者列表 | ADMIN | P1 |
| UC-P1-A-05 | Admin 啟用/停用使用者 | ADMIN | P1 |
| UC-P1-A-06 | 使用者更新市場偏好 | USER | P1 |

### 4.2 美股個股用例群（Stock UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P1-S-01 | 查詢美股個股列表（含篩選/分頁） | USER/ADMIN | P0 |
| UC-P1-S-02 | 查詢單一個股詳細資料 | USER/ADMIN | P0 |
| UC-P1-S-03 | 新增美股個股 | ADMIN | P0 |
| UC-P1-S-04 | 編輯美股個股資訊 | ADMIN | P0 |
| UC-P1-S-05 | 刪除美股個股（含持倉保護） | ADMIN | P0 |
| UC-P1-S-06 | 查詢美股即時報價 | USER/ADMIN | P0 |

### 4.3 美股持倉用例群（Portfolio UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P1-P-01 | 查詢我的美股持倉（含損益） | USER | P0 |
| UC-P1-P-02 | 依版塊分組查詢持倉 | USER | P1 |
| UC-P1-P-03 | 新增美股持倉部位 | USER | P0 |
| UC-P1-P-04 | 編輯持倉（成本 / 股數） | USER | P0 |
| UC-P1-P-05 | 刪除持倉部位 | USER | P0 |

---

## 5. 服務架構與元件對應

```
Phase 1 服務互動圖

Browser（Next.js 前端）
    │
    ├── /login          → 不通過 Gateway（直接或 bypass）
    │
    └── /api/**         → Gateway :8080
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         auth-service    stock-service   portfolio-service
         :8081           :8082           :8083
              │                               │
              │                               ▼
              │                      market-data-service
              │                      :8085
              │                      （取即時報價計算損益）
              ▼
         PostgreSQL
         auth_db
```

**服務間呼叫關係：**

| 呼叫方 | 被呼叫方 | 呼叫原因 |
|---|---|---|
| portfolio-service | market-data-service | 取得個股現價以計算未實現損益 |
| portfolio-service | stock-service | 驗證 ticker 存在性（可選，或依信任服務設計） |
| Gateway | auth-service（JWT Validation） | 透過 JWT Secret 驗證（無服務間呼叫，純 stateless 驗證） |

---

## 6. 功能需求分組摘要

### 6.1 FG-P1-AUTH：身份與存取控制

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P1-AUTH-01 | 使用者帳戶（註冊、登入、JWT 發行） | FR-P1-Auth-v1.md §3.1 |
| FG-P1-AUTH-02 | Spring Security 設定（bcrypt、Stateless） | FR-P1-Auth-v1.md §3.2 |
| FG-P1-AUTH-03 | 角色授權（ADMIN/USER Route 保護） | FR-P1-Auth-v1.md §3.3 |
| FG-P1-AUTH-04 | 使用者管理（Admin 功能） | FR-P1-Auth-v1.md §3.4 |
| FG-P1-AUTH-05 | 使用者偏好設定（marketMode） | FR-P1-Auth-v1.md §3.5 |
| FG-P1-AUTH-06 | 前端登入流程（JWT 存 cookie、middleware） | FR-P1-Auth-v1.md §3.6 |

### 6.2 FG-P1-STOCK：美股個股目錄

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P1-STK-01 | Stock Domain Model（DDD Aggregate） | FR-P1-Stock-v1.md §3.1 |
| FG-P1-STK-02 | 美股 CRUD API | FR-P1-Stock-v1.md §3.2 |
| FG-P1-STK-03 | 市場/版塊篩選與分頁 | FR-P1-Stock-v1.md §3.3 |
| FG-P1-STK-04 | 刪除保護邏輯 | FR-P1-Stock-v1.md §3.4 |
| FG-P1-STK-05 | 初始 S&P 500 資料 Seed | FR-P1-Stock-v1.md §3.5 |
| FG-P1-STK-06 | 前端美股管理頁面 | FR-P1-Stock-v1.md §3.6 |

### 6.3 FG-P1-PORT：美股持倉管理

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P1-PORT-01 | Portfolio / Position Domain Model | FR-P1-Portfolio-v1.md §3.1 |
| FG-P1-PORT-02 | 持倉 CRUD API | FR-P1-Portfolio-v1.md §3.2 |
| FG-P1-PORT-03 | 未實現損益計算 Domain Service | FR-P1-Portfolio-v1.md §3.3 |
| FG-P1-PORT-04 | 版塊分組查詢 | FR-P1-Portfolio-v1.md §3.4 |
| FG-P1-PORT-05 | 前端持倉管理頁面 | FR-P1-Portfolio-v1.md §3.5 |

---

## 7. 資料模型概覽

### 7.1 auth-service 主要實體

```
User
├── id (UUID)
├── email (unique)
├── passwordHash (bcrypt)
├── role (ADMIN | USER)
├── status (ACTIVE | INACTIVE)
├── marketMode ('US' | 'TW')  ← Phase 2 實際使用，此階段預留欄位
└── createdAt, updatedAt
```

### 7.2 stock-service 主要實體

```
Stock (Aggregate Root)
├── id (UUID)
├── ticker (unique, e.g., "AAPL")
├── name ("Apple Inc.")
├── market ('US')              ← Phase 1 固定 US
├── exchange ("NASDAQ")
├── sector ("Technology")
├── industry ("Consumer Electronics")
├── description (text, nullable)
└── createdAt, updatedAt
```

### 7.3 portfolio-service 主要實體

```
Portfolio (Aggregate Root)
├── id (UUID)
├── userId (UUID, from X-User-Id header)
├── currency ('USD')           ← Phase 1 固定 USD
└── createdAt, updatedAt

Position (Entity within Portfolio)
├── id (UUID)
├── portfolioId (FK)
├── ticker (String, references stock-service)
├── shares (Decimal)
├── avgCostPrice (Decimal, USD)
└── createdAt, updatedAt
```

---

## 8. API 端點總覽

| 服務 | 方法 | 路徑 | 說明 | 角色 |
|---|---|---|---|---|
| auth | POST | /auth/register | 使用者註冊 | 公開 |
| auth | POST | /auth/login | 登入取得 JWT | 公開 |
| auth | GET | /users | 使用者列表 | ADMIN |
| auth | PATCH | /users/{id}/status | 啟用/停用 | ADMIN |
| auth | PUT | /users/me/preferences | 更新偏好 | USER |
| stock | GET | /stocks | 個股列表（篩選+分頁） | USER/ADMIN |
| stock | GET | /stocks/{ticker} | 單一個股 | USER/ADMIN |
| stock | POST | /stocks | 新增個股 | ADMIN |
| stock | PUT | /stocks/{ticker} | 更新個股 | ADMIN |
| stock | DELETE | /stocks/{ticker} | 刪除個股 | ADMIN |
| portfolio | GET | /portfolios/me | 我的持倉（含損益） | USER |
| portfolio | POST | /positions | 新增持倉 | USER |
| portfolio | PUT | /positions/{id} | 編輯持倉 | USER |
| portfolio | DELETE | /positions/{id} | 刪除持倉 | USER |
| market-data | GET | /market-data/quotes | 即時報價查詢 | USER/ADMIN |

---

## 9. 跨切面需求（Cross-Cutting Concerns）

| 關注點 | Phase 1 處理方式 |
|---|---|
| 認證 | Gateway JWT 驗證；X-User-Id、X-User-Role 注入下游 Header |
| 授權 | 各服務 Spring Security 讀取 X-User-Role 進行角色判斷 |
| 錯誤格式 | 統一使用 Phase 0 建立的 ApiResponse<T> 格式 |
| 日誌 | Spring Boot 預設 Logback；Gateway 記錄每筆請求摘要 |
| 分頁 | 使用 Spring Data Page<T> + PageRequest，前端 TanStack Query 配合 |

---

## 10. 技術約束與假設

| 類別 | 約束 / 假設 |
|---|---|
| DDD 分層 | 每個服務遵循 Domain / Application / Infrastructure / Interface 分層 |
| 服務間通訊 | Phase 1 使用 RestTemplate / OpenFeign（同步），Kafka 不啟動 |
| 資料庫 | 每個服務有獨立 PostgreSQL DB，不允許跨服務 JOIN |
| JWT 生命週期 | Access Token 有效期 24h（可設定），不實作 Refresh Token（Phase 3 考慮） |
| 市場範圍 | Phase 1 僅處理 market='US'，stock-service 的 market 欄位預留給 Phase 2 |
| 幣別 | Phase 1 僅處理 USD，TWD 換算在 Phase 2 實現 |
| Alpha Vantage 限速 | 免費版 5 req/min；市場開盤時損益計算可能受限，Phase 1 接受此限制 |

---

## 11. 階段間依賴

```
Phase 1 輸出 → Phase 2 依賴

├── auth-service（使用者 + 角色體系） → Phase 2 直接沿用，新增 marketMode 偏好邏輯
├── stock-service API（GET /stocks?market=）→ Phase 2 新增 market=TW 台股支援
├── portfolio-service 架構             → Phase 2 擴充台股持倉、TWD 幣別支援
├── market-data-service Adapter 模式   → Phase 2 新增 TWSE + Fugle Adapter
└── 前端 Zustand auth store            → Phase 2 新增 marketMode store
```

---

## 12. 里程碑驗收標準（M1）

**目標日期：** 2026-08-09

| 驗收情境 | 測試步驟 | 通過條件 |
|---|---|---|
| 使用者登入流程 | 1. 訪問 /login 頁面 2. 輸入帳密 3. 登入 | 成功取得 JWT，跳轉至主頁 |
| Route 保護 | 未登入訪問 /portfolio | 自動跳轉至 /login |
| 美股列表（USER） | 登入後訪問股票列表 | 顯示分頁個股列表，可搜尋篩選 |
| Admin 新增個股 | ADMIN 登入 → 新增個股表單 | 個股成功新增並出現在列表 |
| 刪除保護 | 嘗試刪除有持倉的個股 | 收到 409 Conflict 錯誤 |
| 新增持倉 | USER 登入 → 新增持倉 | 持倉新增成功 |
| 未實現損益 | 查看持倉列表 | 每筆部位顯示現價 + 未實現損益 |
| Admin 使用者管理 | ADMIN 查詢使用者列表 | 正確顯示使用者清單 |
| JWT 失效保護 | 攜帶過期 Token 請求 | 回傳 401，前端跳轉至登入頁 |

---

## 13. 交付物清單

| 文件 / 產出物 | 類型 | 位置 |
|---|---|---|
| SA-Phase1-Integration-v1.md（本文件） | 分析文件 | docs/analysis/requirements/ |
| FR-P1-Auth-v1.md（認證詳細需求） | 需求文件 | docs/analysis/requirements/ |
| FR-P1-Stock-v1.md（美股個股詳細需求） | 需求文件 | docs/analysis/requirements/ |
| FR-P1-Portfolio-v1.md（美股持倉詳細需求） | 需求文件 | docs/analysis/requirements/ |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
