# PLAN-VStocker-v4.md
# 美股台股雙軌智慧理財 Bento Grid 終端系統

**版本：** v4.0  
**建立日期：** 2026-06-17  
**最後更新：** 2026-06-18  
**專案負責人：** Roy Chiang  
**專案代號：** VStocker  

---

## 1. 執行摘要

VStocker 採**前後端分離**架構：前端為 Next.js 15 SPA，後端為 Java 微服務群，以 **DDD（Domain-Driven Design）** 劃分 Bounded Context，透過 API Gateway 統一對外。本地開發使用 Docker Compose，Server 部署使用 **Kubernetes（k8s）**，於 M1 完成後進行 k8s 移植，再繼續 Phase 2 功能開發。

---

## 2. 專案目標與範疇

### 2.1 目標

1. 建立 Java 微服務後端基礎設施（API Gateway、Auth、Stock、Portfolio、Sector、Market Data）
2. 實現使用者認證與角色授權
3. 美股個股管理 + 使用者美股持倉（Phase 1）
4. **k8s Server 部署環境建立 + CI/CD Pipeline（Phase 2 前置）**
5. 台股管理、Switch Tag、版塊管理、Treemap 儀表板（Phase 2）
6. AI 個股深度分析（Phase 3）

### 2.2 範疇（In Scope）

- 前端：Next.js 15 SPA，Bento Grid 儀表板
- 後端：Java 微服務（DDD），RESTful API
- 使用者認證：JWT，角色（ADMIN / USER）
- 美股 + 台股個股資料 CRUD
- 使用者持倉管理（美股、台股）
- 版塊（Sector）及成分股管理
- 儀表板：版塊 Treemap + 持倉統整資訊
- 市場資料：外部 API 代理快取層
- **k8s Server 部署（Helm Charts + Ingress + CI/CD）**
- **本地開發維持 Docker Compose（不廢棄）**

### 2.3 範疇外

- 實際下單 / 券商串接
- 社群功能
- 行動端 APP
- 加密貨幣、衍生品

---

## 3. 系統架構概觀

### 本地開發環境（Docker Compose）

```
Developer Machine
┌─────────────────────────────────────────────────────────┐
│  docker compose up                                       │
│                                                          │
│  Frontend :3000  →  Gateway :8080  →  Services :8081-85 │
│  PostgreSQL ×5 │ Redis │ Kafka │ Eureka                  │
└─────────────────────────────────────────────────────────┘
```

### Server 部署環境（Kubernetes）

```
Internet
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Ingress Controller (Nginx)                                  │ │
│  │  /api/** → gateway-svc    /app/** → frontend-svc            │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────────┐ │
│  │  gateway Pod(s)                                              │ │
│  │  JWT 驗證、路由、CORS、Rate Limiting                         │ │
│  └──┬───────┬──────────┬───────────┬───────────┬──────────────┘ │
│     │       │          │           │           │                  │
│  ┌──▼──┐ ┌──▼───┐ ┌───▼────┐ ┌───▼───┐ ┌────▼──────────────┐  │
│  │auth │ │stock │ │portf- │ │sector │ │market-data        │  │
│  │Pod  │ │Pod   │ │olio   │ │Pod    │ │Pod(s)             │  │
│  │     │ │      │ │Pod    │ │       │ │(HPA 可水平擴展)   │  │
│  └──┬──┘ └──┬───┘ └───┬───┘ └───┬───┘ └────┬──────────────┘  │
│     │       │          │         │           │                   │
│  ┌──▼──────────────────▼─────────▼─────┐  ┌─▼───────┐          │
│  │  PostgreSQL StatefulSet / Managed DB │  │ Redis   │          │
│  └──────────────────────────────────────┘  └─────────┘          │
│                                                                   │
│  Eureka（ServiceRegistry）  │  ConfigMap/Secret  │  PVC          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 技術棧

### 前端

| 層級 | 技術 | 版本 | 說明 |
|---|---|---|---|
| 框架 | Next.js + React | 15 / 19 | App Router，SSR/CSR 混合 |
| 語言 | TypeScript | 5.x | 全棧型別安全 |
| UI 元件 | shadcn/ui + Tailwind CSS | v4 | 磁貼元件、快速建構 |
| 圖表 | Recharts | 3.x | Treemap、損益圖表 |
| 狀態管理 | Zustand | latest | Switch Tag 全域狀態 |
| 資料快取 | TanStack Query | v5 | API 資料快取與同步 |
| 動畫 | Motion (Framer) | 12.x | 磁貼動態效果 |
| Icons | lucide-react | latest | |

### 後端（微服務）

| 層級 | 技術 | 版本 | 說明 |
|---|---|---|---|
| 語言 | Java | 21 (LTS) | |
| 框架 | Spring Boot | 3.x | 各微服務基底 |
| 微服務 | Spring Cloud | 2023.x | 服務治理套件 |
| API Gateway | Spring Cloud Gateway | - | 路由、JWT 驗證、限流 |
| 服務發現 | Spring Cloud Eureka | - | 服務註冊與發現 |
| 設定中心 | Spring Cloud Config | - | 統一設定管理 |
| 認證 | Spring Security + JWT (JJWT) | 0.12.x | |
| ORM | Spring Data JPA + Hibernate | - | 型別安全資料存取 |
| 資料庫 | PostgreSQL | 16 | 每個服務獨立 DB Schema |
| 訊息佇列 | Apache Kafka | 3.x | Domain Event（Phase 2 啟用） |
| 快取 | Redis | 7.x | 行情資料 TTL 快取 |
| 文件 | SpringDoc OpenAPI | 2.x | 自動 Swagger UI |
| 建置 | Gradle | 8.x | Multi-module 專案 |

### 基礎設施

| 層級 | 技術 | 說明 |
|---|---|---|
| 本地開發 | Docker Compose | 一鍵啟動所有服務與基礎設施，全程保留 |
| Server 部署 | Kubernetes (k8s) | M1 完成後移植，Phase 2+ 以 k8s 為生產環境 |
| Package 管理 | Helm 3.x | k8s 各服務 Chart 管理 |
| Ingress | Nginx Ingress Controller | k8s 對外入口，取代直接暴露 Gateway port |
| Container Registry | GitHub Container Registry (GHCR) | Docker Image 儲存 |
| CI/CD | GitHub Actions | Build → Push Image → Helm Deploy |
| Secret 管理 | k8s Secret（開發） / Vault（未來） | 敏感設定管理 |

---

## 5. 微服務 Bounded Context

| 服務 | Context | 核心 Aggregate | 職責 |
|---|---|---|---|
| `auth-service` | Identity & Access | User | 註冊、登入、JWT 發行、角色管理 |
| `stock-service` | Stock Catalog | Stock | 美股/台股個股 CRUD、基本資料管理 |
| `portfolio-service` | Portfolio | Portfolio / Position | 使用者持倉 CRUD、損益計算 |
| `sector-service` | Sector Management | Sector | 版塊 CRUD、成分股管理 |
| `market-data-service` | Market Data | Quote / PriceHistory | 外部行情 API 代理、Redis 快取 |
| `ai-service` (P3) | AI Analysis | StockAnalysis | Claude API 整合、個股分析 |
| `gateway` | - | - | 路由、JWT 驗證、CORS、限流 |

---

## 6. 分階段計畫

### Phase 0：環境建置與技術驗證（第 1-2 週）

**目標：** 確認技術選型，建立可運行的開發環境骨架

#### 前端

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P0-F-01 | 建立 Next.js 15 + TypeScript 專案骨架（App Router） | 2h | P0 |
| P0-F-02 | 整合 shadcn/ui + Tailwind CSS v4 | 3h | P0 |
| P0-F-03 | 設定 Zustand + TanStack Query 基礎結構 | 2h | P0 |

#### 後端

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P0-B-01 | 建立 Gradle Multi-Module 專案骨架（gateway, auth, stock, portfolio, sector, market-data） | 4h | P0 |
| P0-B-02 | Docker Compose 設定（PostgreSQL×5、Redis、Kafka、Eureka、Config Server） | 4h | P0 |
| P0-B-03 | Spring Cloud Gateway + Eureka 服務發現基本配置 | 3h | P0 |
| P0-B-04 | 確認 JWT 流程（gateway 驗證 → 轉發 User Context 至各服務） | 3h | P0 |
| P0-B-05 | 串接 Alpha Vantage API（market-data-service POC） | 3h | P0 |
| P0-B-06 | 串接 TWSE Open API（market-data-service POC） | 3h | P0 |
| P0-B-07 | 統一 API Response 格式與 Error Code 規範文件 | 2h | P0 |

**里程碑 M0（2026-06-28）：** 所有服務可啟動、Eureka 健康、API Gateway 可路由、外部行情 API 可取得資料

---

### Phase 1：認證 + 美股個股 + 美股持倉（第 3-10 週）

#### P1-Auth：auth-service

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-A-01 | User Aggregate 設計（User, Role, Credential Value Object） | 4h | P0 |
| P1-A-02 | 實作 POST /auth/register、POST /auth/login（JWT 發行） | 5h | P0 |
| P1-A-03 | Spring Security 設定（密碼 bcrypt、Stateless JWT） | 4h | P0 |
| P1-A-04 | ADMIN / USER 角色設計，Role-based 授權規則 | 3h | P0 |
| P1-A-05 | GET /users（Admin），PATCH /users/{id}/status | 4h | P1 |
| P1-A-06 | 儲存 marketMode 偏好（PUT /users/me/preferences） | 2h | P1 |

#### P1-FA：前端登入

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-FA-01 | 登入頁面（email + password form，JWT 存 cookie） | 4h | P0 |
| P1-FA-02 | Route 保護 Middleware（Next.js middleware.ts） | 3h | P0 |
| P1-FA-03 | 前端 Zustand auth store | 3h | P0 |

#### P1-S：stock-service（美股）

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-S-01 | Stock Aggregate 設計（ticker, name, market, exchange, sector） | 4h | P0 |
| P1-S-02 | CRUD API（GET /stocks, GET /stocks/{ticker}, POST, PUT, DELETE） | 6h | P0 |
| P1-S-03 | 市場篩選（GET /stocks?market=US&sector=Technology） | 3h | P0 |
| P1-S-04 | 刪除保護（有持倉時拒絕刪除） | 3h | P1 |
| P1-S-05 | 初始美股資料 Seed（S&P 500 基本清單） | 4h | P1 |

#### P1-FS：前端美股管理

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-FS-01 | 美股個股列表頁（搜尋、版塊篩選、分頁） | 6h | P0 |
| P1-FS-02 | 個股詳細頁（基本資料 + 行情報價 + 走勢折線圖） | 8h | P0 |
| P1-FS-03 | 個股新增 / 編輯 Modal（Admin，含表單驗證） | 5h | P0 |
| P1-FS-04 | 個股刪除確認對話框 | 2h | P0 |

#### P1-P：portfolio-service（美股持倉）

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-P-01 | Portfolio Aggregate + Position Entity 設計 | 4h | P0 |
| P1-P-02 | CRUD API（GET /portfolios/me, POST /positions, PUT, DELETE） | 6h | P0 |
| P1-P-03 | 損益計算 Domain Service（呼叫 market-data-service 取現價） | 5h | P0 |
| P1-P-04 | 依版塊分組查詢（GET /portfolios/me?groupBy=sector） | 3h | P1 |

#### P1-FP：前端美股持倉

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P1-FP-01 | 持倉列表頁（依版塊分組、未實現損益） | 8h | P0 |
| P1-FP-02 | 持倉新增 Modal（選股搜尋、填入成本與股數） | 5h | P0 |
| P1-FP-03 | 持倉編輯 / 刪除（確認對話框） | 3h | P0 |

**里程碑 M1（2026-08-09）：** 使用者可登入，Admin 可管理美股，User 可管理美股持倉並查看損益

---

### Phase 2：k8s 移植 + 台股 + Switch Tag + 版塊 + 儀表板（第 11-20 週）

#### P2-K8S：Kubernetes 基礎設施（M1 完成後立即進行，約 2 週）

> **原則：** Docker Compose 保留作為本機開發工具，不廢棄。k8s 為 Server 部署環境。

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-K8S-01 | k8s 叢集選型與建立（雲端 GKE/EKS/AKS 或自建 k3s/kubeadm） | 4h | P0 |
| P2-K8S-02 | Container Registry 設定（GitHub Container Registry，GHCR） | 2h | P0 |
| P2-K8S-03 | 各服務 Production-grade Dockerfile 撰寫（multi-stage build，最小化 image） | 4h | P0 |
| P2-K8S-04 | Helm Chart 撰寫（gateway, auth-service, stock-service, portfolio-service, market-data-service） | 10h | P0 |
| P2-K8S-05 | Nginx Ingress Controller 設定（對外路由 `/api/**` → gateway，`/**` → frontend） | 3h | P0 |
| P2-K8S-06 | k8s Secret 設定（JWT Secret、DB 密碼、API Key 遷移自 .env） | 3h | P0 |
| P2-K8S-07 | Liveness / Readiness Probe 設定（對接 Spring Actuator `/actuator/health`） | 2h | P0 |
| P2-K8S-08 | PostgreSQL 部署策略決策與實施（PVC StatefulSet 或雲端 Managed DB） | 4h | P0 |
| P2-K8S-09 | Redis 部署（k8s StatefulSet 或雲端 Managed Redis） | 2h | P0 |
| P2-K8S-10 | CI/CD Pipeline 建立（GitHub Actions：build → push GHCR → helm upgrade） | 6h | P0 |
| P2-K8S-11 | Phase 1 所有服務部署至 k8s 並驗證（gateway 路由、JWT 流程、行情 API 正常） | 4h | P0 |

**k8s 前置里程碑（2026-08-23）：** Phase 1 所有服務在 k8s 上正常運行，CI/CD 可自動部署

---

#### P2-S：stock-service 台股擴充

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-S-01 | 台股個股 CRUD（market=TW，TWSE 類股欄位適配） | 5h | P0 |
| P2-S-02 | 初始台股資料 Seed（台灣 50、中型 100 基本清單） | 4h | P1 |

#### P2-M：market-data-service 台股串接

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-M-01 | TWSE Open API Adapter（盤中行情 + 收盤資料） | 6h | P0 |
| P2-M-02 | Fugle API Adapter（台股即時報價備援） | 5h | P1 |
| P2-M-03 | Redis 快取策略（US 快取 1min / TW 快取 10s 盤中、5min 收盤後） | 4h | P0 |

#### P2-Port：portfolio-service 台股持倉

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-Port-01 | 台股持倉 CRUD（幣別 TWD，損益以 TWD 計） | 5h | P0 |
| P2-Port-02 | 美股損益換算（USD → TWD，呼叫匯率 API） | 4h | P1 |

#### P2-SW：Switch Tag（前端）

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-SW-01 | Switch Tag UI 元件（US / TW，置於全域 Header） | 4h | P0 |
| P2-SW-02 | Zustand marketMode store（`'US' \| 'TW'`） | 2h | P0 |
| P2-SW-03 | 切換後所有頁面自動 filter 對應市場 | 6h | P0 |
| P2-SW-04 | 使用者偏好持久化至 DB（登入後恢復） | 3h | P1 |

#### P2-SEC：sector-service + 前端

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-SEC-01 | Sector Aggregate + SectorComposition 設計 | 4h | P0 |
| P2-SEC-02 | 版塊 CRUD API（GET /sectors, POST, PUT, DELETE，含 market 區分） | 5h | P0 |
| P2-SEC-03 | 成分股管理 API（POST /sectors/{id}/stocks, DELETE） | 5h | P0 |
| P2-SEC-04 | 前端版塊管理頁（Admin：新增/編輯/刪除版塊、成分股管理） | 8h | P0 |
| P2-SEC-05 | 使用者版塊選擇（PATCH /users/me/preferences → currentSectorId） | 3h | P0 |

#### P2-D：登入首頁儀表板 Treemap

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P2-D-01 | 儀表板聚合 API（BFF，匯整持倉 + 行情，單一呼叫） | 6h | P0 |
| P2-D-02 | 前端 Treemap（Recharts，面積 = 持倉市值，顏色 = 漲跌幅） | 12h | P0 |
| P2-D-03 | 版塊選擇器（切換顯示不同版塊的 Treemap） | 4h | P0 |
| P2-D-04 | 統整資訊磁貼（總持倉市值、今日損益、最大漲幅/跌幅個股） | 6h | P0 |
| P2-D-05 | 指數磁貼（配合 Switch Tag 顯示 S&P 500 或加權指數） | 4h | P1 |
| P2-D-06 | 持倉損益摘要表（儀表板下方，依版塊分組快覽） | 5h | P1 |

**里程碑 M2（2026-10-04）：** k8s 生產環境就緒、台股完整、Switch Tag 全系統切換正常、版塊管理完善、儀表板 Treemap 可用

---

### Phase 3：AI 個股分析與進階功能（第 21 週起）

#### P3-AI：ai-service

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P3-AI-01 | ai-service 模組建立（Spring Boot + Claude API adapter） | 4h | P0 |
| P3-AI-02 | StockAnalysis Domain 設計（分析請求、結果快取 24h） | 4h | P0 |
| P3-AI-03 | POST /ai/stocks/{ticker}/analysis（觸發分析，SSE 串流回應） | 8h | P0 |
| P3-AI-04 | 持倉風險評分（POST /ai/portfolios/me/risk-score） | 8h | P1 |
| P3-AI-05 | ai-service Helm Chart 撰寫與 k8s 部署（含 Resource Limit 設定） | 3h | P0 |

#### P3-C：前端個股圖表

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P3-C-01 | 個股 K 線圖（Recharts ComposedChart，日/週/月線） | 10h | P0 |
| P3-C-02 | 技術指標（MA20/MA60、RSI、MACD overlay） | 8h | P0 |
| P3-C-03 | 前端 AI 分析面板（SSE 串流顯示分析結果） | 6h | P0 |

#### P3-X：體驗優化

| 任務 ID | 任務描述 | 預估工時 | 優先級 |
|---|---|---|---|
| P3-X-01 | 市場新聞整合（NewsAPI RSS，按持倉股票過濾） | 6h | P1 |
| P3-X-02 | 財報日曆磁貼（美股 Earnings / 台股法說） | 6h | P1 |
| P3-X-03 | 命令面板（⌘K 快速搜尋股票 + 跳轉） | 5h | P2 |
| P3-X-04 | 暗色 / 亮色主題切換 | 3h | P1 |
| P3-X-05 | 效能優化（TanStack Query 快取策略、Recharts 虛擬化） | 6h | P1 |
| P3-X-06 | k8s HPA（Horizontal Pod Autoscaler）設定（market-data, ai-service） | 4h | P1 |

**里程碑 M3（2026-11-15，滾動）：** AI 個股分析可用、技術指標完善、k8s 自動擴縮容生效

---

## 7. 時程摘要

```
2026-06  2026-07        2026-08          2026-09       2026-10   2026-11+
W1 W2 | W3 W4 W5 W6 W7 W8 W9 W10 | W11 W12 W13 W14 W15 W16 W17 W18 W19 W20 | W21+
═══════════════════════════════════════════════════════════════════════════════════
[Phase 0]
     [────────────── Phase 1: Auth + 美股 ───────────────────]
                              [k8s]
                                   [──────── Phase 2: 台股+Switch+版塊+Treemap ────────]
                                                                                  [─ P3 ─▶]
◆M0      ◆M1                  ◆k8s                             ◆M2                    ◆M3
```

| 里程碑 | 目標日期 | 核心交付物 |
|---|---|---|
| M0 環境建置 | 2026-06-28 | 所有服務可啟動、Eureka 健康、外部 API POC |
| M1 美股核心 | 2026-08-09 | 認證系統、美股管理、美股持倉損益 |
| k8s 前置 | 2026-08-23 | Phase 1 服務全部在 k8s 上線，CI/CD 可自動部署 |
| M2 雙軌儀表板 | 2026-10-04 | k8s 生產環境 + 台股 + Switch Tag + 版塊 + Treemap 儀表板 |
| M3 AI 分析 | 2026-11-15（滾動） | AI 個股分析、技術指標、k8s HPA |

---

## 8. 風險管理

| 風險 | 機率 | 影響 | 緩解策略 |
|---|---|---|---|
| k8s 學習曲線（Helm、Ingress、StatefulSet） | 中 | 中 | 先用 k3s 本機練習；Phase 1 期間已確保 Spring Actuator 健康端點就緒 |
| PostgreSQL StatefulSet 資料持久化複雜 | 中 | 高 | 優先考慮雲端 Managed DB（GCP Cloud SQL / AWS RDS），規避 PVC 管理複雜度 |
| CI/CD Pipeline 設定耗時超預期 | 中 | 中 | 使用成熟的 helm/kind Action；2 週的 k8s sprint 已含緩衝 |
| Alpha Vantage 免費版限速（5 req/min） | 高 | 中 | Redis 快取 + 限流；考慮 Polygon.io 付費方案 |
| TWSE API 不穩定 | 中 | 高 | Fugle API 作備援；封裝 Adapter 介面便於替換 |
| Treemap 渲染效能（大量個股） | 中 | 中 | 每版塊顯示上限 50 支；前端 memo 優化 |
| Claude API 費用（Phase 3） | 中 | 中 | 節流 + 結果快取 24h；設定月度預算警示 |
| k8s Secret 管理不當（外洩） | 低 | 高 | .env 加入 .gitignore；k8s Secret 使用 base64 編碼；長期考慮 Vault |

---

## 9. 外部資料來源

| 市場 | 來源 | 資料類型 | 費用 |
|---|---|---|---|
| 美股 | Alpha Vantage | 即時/歷史行情、技術指標 | 免費~$50/月 |
| 美股 | Polygon.io | 即時行情、新聞 | 免費~$79/月 |
| 台股 | TWSE Open API | 上市股收盤、加權指數 | 免費 |
| 台股 | Fugle Market Data | 即時行情 | 部分免費 |
| 匯率 | Exchangerate-API | USD/TWD | 免費 |
| AI | Anthropic Claude API | 個股分析（Phase 3） | 依用量 |

---

## 10. 下一步行動

1. `/sa` — 系統分析：Phase 1 詳細功能需求、Phase 2 k8s 基礎設施需求分析
2. `/sd` — 系統設計：API 規格、DB Schema、k8s 資源配置、Helm Chart 結構
3. `/reference` — 建立技術規範：DDD 分層規則、REST API 慣例、Helm Chart 命名規範
4. `/dev` — 開始 Phase 0：Gradle Multi-Module 骨架 + Docker Compose

---

## 11. 文件版本歷程

| 版本 | 日期 | 變更摘要 |
|---|---|---|
| v1.0 | 2026-06-17 | 初版，Bento Grid 為主 |
| v2.0 | 2026-06-17 | 重整三階段里程碑，明確前後端分離 |
| v3.0 | 2026-06-17 | 後端改為 Java DDD 微服務（Spring Boot + Spring Cloud）；前端維持 Next.js 15 |
| v4.0 | 2026-06-18 | 新增 k8s Server 部署：M1 完成後進行 2 週 k8s infra sprint，M2 調整至 2026-10-04，M3 調整至 2026-11-15 |
