# SA-Phase0-Integration-v1.md
# Phase 0：環境建置與技術驗證 — 統整系統分析文件

**版本：** v1.0  
**建立日期：** 2026-06-18  
**所屬計畫：** [PLAN-VStocker-v4.md](../../plans/active/PLAN-VStocker-v4.md)  
**里程碑：** M0（目標：2026-06-28）  
**負責人：** Roy Chiang  

---

## 1. 階段概述

Phase 0 的核心任務是**建立可運行的開發環境骨架並驗證技術選型**，為後續功能開發提供穩固的基礎。本階段不交付任何業務功能，重點在於：

- 驗證前後端分離架構（Next.js 15 + Java Spring Boot 微服務）可正常協作
- 確認 Docker Compose 一鍵啟動所有基礎設施服務
- 建立 Spring Cloud Gateway + Eureka 服務治理骨架
- 驗證 JWT 驗證流程（Gateway 層）
- 完成外部行情 API 技術驗證（POC）
- 建立統一 API Response 格式規範

---

## 2. 範疇界定

### 2.1 納入範疇（In Scope）

| 領域 | 項目 |
|---|---|
| 前端骨架 | Next.js 15 App Router 初始化、shadcn/ui 整合、Zustand + TanStack Query 基礎設置 |
| 後端骨架 | Gradle Multi-Module 架構、6 個微服務模組骨架（gateway, auth, stock, portfolio, sector, market-data） |
| 基礎設施 | Docker Compose：PostgreSQL×5、Redis、Kafka、Eureka、Config Server |
| 服務治理 | Spring Cloud Gateway 路由設定、Eureka 服務發現 |
| 安全性 POC | JWT 驗證流程通過 Gateway 的概念驗證 |
| 外部 API POC | Alpha Vantage（美股）+ TWSE Open API（台股）資料取得驗證 |
| 規範文件 | 統一 API Response 格式 + 錯誤代碼規範 |

### 2.2 排除範疇（Out of Scope）

- 任何業務功能實作（認證、股票 CRUD、持倉管理等）
- 資料庫 Schema 設計
- 前端頁面開發
- k8s 部署（Phase 2 前置任務）

---

## 3. 涉及角色（Actors）

| 角色 | 說明 | Phase 0 涉及度 |
|---|---|---|
| 開發者（Roy Chiang） | 建置環境、執行 POC 驗證 | 主要 |
| Docker Compose | 基礎設施協調者 | 技術角色 |
| Alpha Vantage API | 外部美股行情提供者 | 整合目標 |
| TWSE Open API | 外部台股行情提供者 | 整合目標 |

---

## 4. 核心用例一覽

| UC-ID | 用例名稱 | 類別 | 對應任務 |
|---|---|---|---|
| UC-P0-01 | 啟動完整開發環境 | 基礎設施 | P0-B-01, P0-B-02 |
| UC-P0-02 | 服務互相發現與路由 | 服務治理 | P0-B-03 |
| UC-P0-03 | JWT Token 通過 Gateway 驗證 | 安全性 | P0-B-04 |
| UC-P0-04 | 取得美股即時報價（Alpha Vantage POC） | 外部整合 | P0-B-05 |
| UC-P0-05 | 取得台股收盤資料（TWSE POC） | 外部整合 | P0-B-06 |
| UC-P0-06 | 前端骨架頁面可正常運行 | 前端 | P0-F-01~03 |

---

## 5. 服務與元件對應

```
Phase 0 元件地圖

┌─────────────────────────────────────────────────────────────┐
│  Docker Compose 環境                                         │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐ │
│  │  Frontend   │   │  Spring Cloud 基礎設施               │ │
│  │  Next.js 15 │   │  ┌──────────┐  ┌──────────────────┐  │ │
│  │  :3000      │   │  │  Eureka  │  │  Config Server   │  │ │
│  │             │   │  │  :8761   │  │  :8888           │  │ │
│  │  骨架初始化  │   │  └──────────┘  └──────────────────┘  │ │
│  └──────┬──────┘   └──────────────────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │   Gateway   │  JWT 驗證、路由                            │
│  │   :8080     │                                            │
│  └──┬──────────┘                                            │
│     │  (POC 路由測試)                                        │
│     ├──▶ auth-service :8081 (骨架)                          │
│     ├──▶ stock-service :8082 (骨架)                         │
│     ├──▶ portfolio-service :8083 (骨架)                     │
│     ├──▶ sector-service :8084 (骨架)                        │
│     └──▶ market-data-service :8085 (Alpha Vantage POC)     │
│                                                              │
│  基礎設施                                                    │
│  PostgreSQL×5 (各服務獨立 DB)  Redis  Kafka                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 功能需求分組

### 6.1 FG-P0-FE：前端骨架

| 編號 | 需求描述 | 對應任務 |
|---|---|---|
| FR-P0-FE-01 | 建立 Next.js 15 App Router 專案骨架，支援 TypeScript 5.x | P0-F-01 |
| FR-P0-FE-02 | 整合 shadcn/ui + Tailwind CSS v4，提供基礎 UI 元件庫 | P0-F-02 |
| FR-P0-FE-03 | 設定 Zustand store 基礎結構（全域狀態管理） | P0-F-03 |
| FR-P0-FE-04 | 設定 TanStack Query v5 QueryClient，提供 API 快取基礎 | P0-F-03 |
| FR-P0-FE-05 | 建立前端 API Client 基礎（指向 Gateway :8080） | P0-F-01 |

### 6.2 FG-P0-BE：後端骨架

| 編號 | 需求描述 | 對應任務 |
|---|---|---|
| FR-P0-BE-01 | Gradle Multi-Module 專案架構，包含 6 個服務模組骨架 | P0-B-01 |
| FR-P0-BE-02 | 每個服務模組包含完整的 Spring Boot 3.x 啟動設定 | P0-B-01 |
| FR-P0-BE-03 | 每個服務模組向 Eureka 成功註冊並可被發現 | P0-B-03 |
| FR-P0-BE-04 | Gateway 正確路由至各下游服務（POC 端點） | P0-B-03 |
| FR-P0-BE-05 | JWT Secret 設定至 Config Server，Gateway 可讀取 | P0-B-04 |
| FR-P0-BE-06 | Gateway 攔截請求並驗證 JWT Token 有效性 | P0-B-04 |
| FR-P0-BE-07 | 驗證通過後 Gateway 於 Header 注入 X-User-Id、X-User-Role | P0-B-04 |

### 6.3 FG-P0-INF：基礎設施

| 編號 | 需求描述 | 對應任務 |
|---|---|---|
| FR-P0-INF-01 | Docker Compose 一鍵啟動所有服務（含健康等待機制） | P0-B-02 |
| FR-P0-INF-02 | 每個微服務有獨立的 PostgreSQL database（auth_db, stock_db, portfolio_db, sector_db, market_data_db） | P0-B-02 |
| FR-P0-INF-03 | Redis 容器正常啟動，可供快取使用 | P0-B-02 |
| FR-P0-INF-04 | Kafka + Zookeeper 容器正常啟動（Phase 2 實際使用，此階段確保環境就緒） | P0-B-02 |
| FR-P0-INF-05 | Eureka Server 健康狀態可通過 /actuator/health 查詢 | P0-B-02, P0-B-03 |

### 6.4 FG-P0-EXT：外部 API 整合 POC

| 編號 | 需求描述 | 對應任務 |
|---|---|---|
| FR-P0-EXT-01 | market-data-service 可呼叫 Alpha Vantage API 取得指定股票即時報價 | P0-B-05 |
| FR-P0-EXT-02 | market-data-service 可呼叫 TWSE Open API 取得台股收盤資料 | P0-B-06 |
| FR-P0-EXT-03 | 外部 API 回應資料成功轉換為系統內部 DTO 格式 | P0-B-05, P0-B-06 |
| FR-P0-EXT-04 | 外部 API 呼叫結果可通過 Gateway 路由至前端（POC 端點） | P0-B-05 |

### 6.5 FG-P0-STD：規範建立

| 編號 | 需求描述 | 對應任務 |
|---|---|---|
| FR-P0-STD-01 | 定義統一 API Response 包裝格式（ApiResponse<T>） | P0-B-07 |
| FR-P0-STD-02 | 定義全系統錯誤代碼規範（HttpStatus + 業務錯誤碼） | P0-B-07 |
| FR-P0-STD-03 | Global Exception Handler 統一攔截並格式化錯誤回應 | P0-B-07 |

---

## 7. 技術約束與假設

| 類別 | 約束 / 假設 |
|---|---|
| 開發環境 | 本地 Docker Desktop 需已安裝，記憶體建議 ≥ 8GB |
| Alpha Vantage | 需申請免費 API Key（5 req/min 限制），POC 階段不做限流處理 |
| TWSE Open API | 免費、免申請，僅提供收盤後資料 |
| Java 版本 | 必須使用 Java 21 LTS |
| Kafka | Phase 0 僅確保容器就緒，不實作 Producer/Consumer |
| Config Server | 使用本地 Git 或 classpath 模式，Phase 0 不建立遠端設定倉庫 |

---

## 8. 階段間依賴

```
Phase 0 輸出 → Phase 1 依賴

├── Gradle Multi-Module 架構  →  Phase 1 各服務模組在此擴充業務邏輯
├── Docker Compose 設定       →  Phase 1 繼續使用，不需修改基礎設施配置
├── Gateway 路由規則          →  Phase 1 新增 /auth/**, /stocks/**, /portfolios/** 路由
├── JWT 驗證框架              →  Phase 1 auth-service 發行的 Token 直接通過已建好的驗證
├── Alpha Vantage Adapter     →  Phase 1 portfolio-service 損益計算直接調用
├── API Response 格式規範     →  Phase 1 所有服務強制遵循
└── Eureka 服務發現           →  Phase 1 所有新增服務自動加入
```

---

## 9. 里程碑驗收標準（M0）

**目標日期：** 2026-06-28

| 驗收項目 | 驗收方式 | 通過條件 |
|---|---|---|
| 環境啟動 | `docker compose up` | 所有容器 healthy，無啟動錯誤 |
| 服務發現 | 查看 Eureka Dashboard http://localhost:8761 | 6 個服務（含 gateway）全部顯示 UP |
| Gateway 路由 | `curl http://localhost:8080/actuator/health`（proxy 至任意服務） | 200 OK |
| JWT 驗證 | 攜帶無效 Token 呼叫受保護端點 | 回傳 401 Unauthorized |
| Alpha Vantage POC | `GET /api/market-data/quotes?symbol=AAPL` | 回傳含股價的 JSON |
| TWSE POC | `GET /api/market-data/tw/quotes?symbol=2330` | 回傳含股價的 JSON |
| 前端啟動 | `npm run dev` | http://localhost:3000 可訪問，無編譯錯誤 |
| API 格式規範 | 查看 market-data POC 回應 | 符合 `ApiResponse<T>` 格式 |

---

## 10. 交付物清單

| 文件 / 產出物 | 類型 | 位置 |
|---|---|---|
| SA-Phase0-Integration-v1.md（本文件） | 分析文件 | docs/analysis/requirements/ |
| FR-P0-v1.md（詳細功能需求） | 需求文件 | docs/analysis/requirements/ |
| API Response 格式規範（含 Error Code） | 規範文件 | 由 P0-B-07 輸出，建議至 docs/reference/ |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
