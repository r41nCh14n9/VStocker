# SA-Phase2-Integration-v1.md
# Phase 2：k8s 移植 + 台股 + Switch Tag + 版塊 + 儀表板 — 統整系統分析文件

**版本：** v1.0  
**建立日期：** 2026-06-18  
**所屬計畫：** [PLAN-VStocker-v4.md](../../plans/active/PLAN-VStocker-v4.md)  
**里程碑：** k8s 前置（2026-08-23）+ M2（2026-10-04）  
**前置依賴：** Phase 1 完成（M1 驗收通過）  
**負責人：** Roy Chiang  

---

## 1. 階段概述

Phase 2 是 VStocker 最複雜的功能迭代，分為兩個連續的子任務群：

### 子任務 2A：k8s 基礎設施移植（M1 完成後立即執行，約 2 週）

> 將 Phase 1 完成的所有服務從「本地 Docker Compose 開發環境」移植至「Kubernetes Server 部署環境」，建立 CI/CD 自動化流程。**Docker Compose 保留作為本機開發工具，不廢棄。**

### 子任務 2B：功能擴充（k8s 前置完成後進行，約 8 週）

> 在 k8s 生產環境基礎上，實現：
> - 台股個股 + 台股行情 + 台股持倉
> - Switch Tag（US/TW 市場切換）
> - Sector（版塊）管理
> - 儀表板 Bento Grid（版塊 Treemap + 統整資訊磁貼）

---

## 2. 範疇界定

### 2.1 納入範疇（In Scope）

| 子任務 | 項目 |
|---|---|
| **2A: k8s** | 叢集建立、GHCR Container Registry、Production-grade Dockerfile、Helm Charts（5 服務 + gateway）、Nginx Ingress、k8s Secret、Health Probe、PostgreSQL/Redis 部署策略、CI/CD GitHub Actions Pipeline |
| **2B: 台股** | stock-service 台股 CRUD、TWSE/Fugle Adapter、Redis 差異化快取策略、台股持倉、TWD 幣別損益、USD→TWD 匯率換算 |
| **2B: Switch Tag** | 全域 US/TW 切換 UI、Zustand marketMode store、所有頁面自動 filter、DB 偏好持久化 |
| **2B: 版塊** | sector-service CRUD（含市場區分）、成分股管理、前端版塊管理頁（Admin）、使用者版塊偏好 |
| **2B: 儀表板** | BFF 聚合 API、Treemap（市值面積 + 漲跌顏色）、版塊選擇器、統整資訊磁貼、指數磁貼 |

### 2.2 排除範疇（Out of Scope）

- AI 個股分析（Phase 3）
- K 線圖與技術指標（Phase 3）
- 命令面板（⌘K）（Phase 3）
- Kafka Domain Event 實際消費（Phase 2 僅基礎設施就緒）
- k8s HPA（Phase 3 P3-X-06）

---

## 3. 涉及角色（Actors）

| 角色 | 說明 | Phase 2 新增能力 |
|---|---|---|
| USER | 一般登入使用者 | 切換 US/TW 市場、管理台股持倉、查看雙軌損益儀表板 |
| ADMIN | 管理員 | 台股 CRUD、版塊管理、成分股管理 |
| DevOps（Roy） | 部署與維運角色 | CI/CD Pipeline、k8s 叢集管理 |
| GitHub Actions | CI/CD 自動化角色 | Build → Push GHCR → Helm Deploy |
| TWSE Open API | 台股行情外部來源 | 盤中 + 收盤資料 |
| Fugle API | 台股即時行情備援 | 即時報價備援 |
| Exchangerate-API | 匯率外部來源 | USD→TWD 換算 |

---

## 4. 核心用例一覽

### 4.1 k8s 基礎設施用例群（Infra UC）

| UC-ID | 用例名稱 | 觸發者 | 重要性 |
|---|---|---|---|
| UC-P2-K-01 | 開發者推送程式碼觸發 CI/CD 自動部署 | 開發者 git push | P0 |
| UC-P2-K-02 | k8s 健康探針自動重啟不健康 Pod | k8s 控制器 | P0 |
| UC-P2-K-03 | Ingress 路由對外請求至正確服務 | 外部使用者 | P0 |
| UC-P2-K-04 | k8s Secret 注入敏感設定至 Pod | 部署時 | P0 |

### 4.2 台股功能用例群（TW Stock UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P2-TW-01 | Admin 新增/編輯/刪除台股個股 | ADMIN | P0 |
| UC-P2-TW-02 | 查詢台股即時/收盤報價 | USER/ADMIN | P0 |
| UC-P2-TW-03 | 新增/管理台股持倉（TWD） | USER | P0 |
| UC-P2-TW-04 | 查看台股持倉未實現損益（TWD） | USER | P0 |
| UC-P2-TW-05 | 查看美股持倉 USD→TWD 換算損益 | USER | P1 |

### 4.3 Switch Tag 用例群（Switch UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P2-SW-01 | 點擊 Header Switch Tag 切換為 US 市場 | USER | P0 |
| UC-P2-SW-02 | 點擊 Header Switch Tag 切換為 TW 市場 | USER | P0 |
| UC-P2-SW-03 | 切換後所有頁面自動顯示對應市場資料 | USER | P0 |
| UC-P2-SW-04 | 登入後恢復上次選擇的市場偏好 | USER | P1 |

### 4.4 版塊管理用例群（Sector UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P2-SEC-01 | Admin 新增/編輯/刪除版塊 | ADMIN | P0 |
| UC-P2-SEC-02 | Admin 管理版塊成分股 | ADMIN | P0 |
| UC-P2-SEC-03 | 使用者選擇當前關注版塊 | USER | P0 |
| UC-P2-SEC-04 | 依市場（US/TW）查詢版塊列表 | USER/ADMIN | P0 |

### 4.5 儀表板用例群（Dashboard UC）

| UC-ID | 用例名稱 | 主要角色 | 重要性 |
|---|---|---|---|
| UC-P2-D-01 | 載入登入首頁儀表板（聚合所有資料） | USER | P0 |
| UC-P2-D-02 | 查看持倉版塊 Treemap | USER | P0 |
| UC-P2-D-03 | 點擊 Treemap 切換版塊 | USER | P0 |
| UC-P2-D-04 | 查看統整資訊磁貼（總市值、今日損益） | USER | P0 |
| UC-P2-D-05 | 查看市場指數磁貼（配合 Switch Tag） | USER | P1 |

---

## 5. 服務架構概覽

### 5.1 k8s 部署架構

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Kubernetes Cluster                                   │
│                                                      │
│  Nginx Ingress Controller                            │
│  /api/** → gateway-svc  /app/** → frontend-svc      │
│                │                                     │
│         gateway Pod(s)                               │
│         JWT 驗證 + CORS + 路由                       │
│              │                                       │
│    ┌─────────┼──────────┬─────────┬──────────┐      │
│    ▼         ▼          ▼         ▼          ▼      │
│  auth      stock     portfolio  sector   market-data │
│  Pod       Pod       Pod        Pod      Pod(s)      │
│                                                      │
│  PostgreSQL StatefulSet / Managed DB                 │
│  Redis StatefulSet / Managed Redis                   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Phase 2B 新增服務互動

```
sector-service（新增）
    ├── GET /sectors?market=US|TW         → stock-service 使用（查詢版塊清單）
    └── GET /sectors/{id}/stocks          → dashboard BFF 使用

market-data-service（擴充）
    ├── TWSE Open API Adapter（新增）
    ├── Fugle API Adapter（新增，備援）
    └── Redis 差異化快取
        ├── US 行情：TTL 60s
        └── TW 行情：TTL 10s（盤中）/ 300s（收盤後）

dashboard BFF（portfolio-service 內建或獨立）
    ├── 呼叫 portfolio-service → 取持倉資料
    ├── 呼叫 market-data-service → 取批量報價
    ├── 呼叫 sector-service → 取版塊資訊
    └── 合併回傳聚合 DTO
```

---

## 6. 功能需求分組摘要

### 6.1 FG-P2-K8S：Kubernetes 基礎設施

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P2-K8S-01 | k8s 叢集建立（雲端 vs 自建決策） | FR-P2-K8S-v1.md §3.1 |
| FG-P2-K8S-02 | Container Registry + Dockerfile | FR-P2-K8S-v1.md §3.2 |
| FG-P2-K8S-03 | Helm Chart 撰寫（6 個 Chart） | FR-P2-K8S-v1.md §3.3 |
| FG-P2-K8S-04 | Ingress + Secret + Health Probe | FR-P2-K8S-v1.md §3.4 |
| FG-P2-K8S-05 | 資料層部署策略（DB + Redis） | FR-P2-K8S-v1.md §3.5 |
| FG-P2-K8S-06 | CI/CD GitHub Actions Pipeline | FR-P2-K8S-v1.md §3.6 |
| FG-P2-K8S-07 | Phase 1 服務全部在 k8s 驗證通過 | FR-P2-K8S-v1.md §3.7 |

### 6.2 FG-P2-TW：台股 + 行情服務

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P2-TW-01 | 台股個股 CRUD（market=TW） | FR-P2-TW-Market-v1.md §3.1 |
| FG-P2-TW-02 | TWSE Open API Adapter | FR-P2-TW-Market-v1.md §3.2 |
| FG-P2-TW-03 | Fugle API Adapter（備援） | FR-P2-TW-Market-v1.md §3.3 |
| FG-P2-TW-04 | Redis 差異化快取策略 | FR-P2-TW-Market-v1.md §3.4 |
| FG-P2-TW-05 | 台股持倉 CRUD（TWD） | FR-P2-TW-Market-v1.md §3.5 |
| FG-P2-TW-06 | USD→TWD 損益換算 | FR-P2-TW-Market-v1.md §3.6 |

### 6.3 FG-P2-SW：Switch Tag + Sector

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P2-SW-01 | Switch Tag UI 元件（全域 Header） | FR-P2-SwitchSector-v1.md §3.1 |
| FG-P2-SW-02 | Zustand marketMode store | FR-P2-SwitchSector-v1.md §3.2 |
| FG-P2-SW-03 | 全頁自動 filter 對應市場 | FR-P2-SwitchSector-v1.md §3.3 |
| FG-P2-SW-04 | 市場偏好 DB 持久化 | FR-P2-SwitchSector-v1.md §3.4 |
| FG-P2-SEC-01 | Sector Aggregate + CRUD API | FR-P2-SwitchSector-v1.md §4.1 |
| FG-P2-SEC-02 | 成分股管理 API | FR-P2-SwitchSector-v1.md §4.2 |
| FG-P2-SEC-03 | 前端版塊管理頁（Admin） | FR-P2-SwitchSector-v1.md §4.3 |
| FG-P2-SEC-04 | 使用者版塊偏好（currentSectorId） | FR-P2-SwitchSector-v1.md §4.4 |

### 6.4 FG-P2-D：儀表板

| 分組編號 | 功能描述 | 詳細文件 |
|---|---|---|
| FG-P2-D-01 | BFF 聚合 API（單一呼叫匯整持倉+行情） | FR-P2-Dashboard-v1.md §3.1 |
| FG-P2-D-02 | Treemap 元件（Recharts，市值面積+漲跌顏色） | FR-P2-Dashboard-v1.md §3.2 |
| FG-P2-D-03 | 版塊選擇器（切換 Treemap 顯示） | FR-P2-Dashboard-v1.md §3.3 |
| FG-P2-D-04 | 統整資訊磁貼 Bento Grid | FR-P2-Dashboard-v1.md §3.4 |
| FG-P2-D-05 | 指數磁貼（S&P 500 / 加權指數） | FR-P2-Dashboard-v1.md §3.5 |
| FG-P2-D-06 | 持倉損益摘要表（依版塊分組） | FR-P2-Dashboard-v1.md §3.6 |

---

## 7. 資料模型新增/擴充

### 7.1 stock-service 擴充

```
Stock（擴充）
├── market ('US' | 'TW')           ← Phase 2 啟用 TW
├── exchange ("NASDAQ" | "TWSE" | "OTC" | "TPEx")
└── 台股新增欄位：
    └── twseCode (nullable, e.g., "2330")
```

### 7.2 portfolio-service 擴充

```
Portfolio（擴充）
└── currency ('USD' | 'TWD')       ← Phase 2 新增 TWD

Position（擴充）
└── currency (繼承自 Portfolio)
```

### 7.3 sector-service（新增）

```
Sector（Aggregate Root）
├── id (UUID)
├── name ("Technology", "半導體")
├── market ('US' | 'TW')
└── createdAt, updatedAt

SectorComposition（Entity）
├── id (UUID)
├── sectorId (FK → Sector)
└── ticker (references stock-service)
```

### 7.4 市場指數快取（Redis Key 規劃）

```
market_data:quote:{market}:{ticker}      TTL 60s (US) / 10s (TW 盤中) / 300s (TW 收盤後)
market_data:index:SPX                    S&P 500 指數
market_data:index:TWSE                   台灣加權指數
exchange_rate:USD:TWD                    匯率，TTL 3600s
```

---

## 8. k8s 基礎設施需求摘要

| 元件 | 規格 | 備註 |
|---|---|---|
| k8s 叢集 | 雲端 GKE/EKS/AKS 或自建 k3s | 待決策（Phase 2 初期） |
| Node 數量 | 最少 2 Node（含 HA） | Production 最低配置 |
| Container Registry | GitHub Container Registry（GHCR） | 免費 public repo |
| Ingress | Nginx Ingress Controller | /api/** 與 /app/** 路由 |
| 資料庫 | 優先 Managed DB（GCP Cloud SQL / AWS RDS） | 規避 StatefulSet PVC 複雜度 |
| Redis | Managed Redis 或 StatefulSet | 視叢集選型決定 |
| CI/CD | GitHub Actions | build → push GHCR → helm upgrade |
| Secret 管理 | k8s Secret（Base64） | 長期遷移至 Vault |

---

## 9. 跨切面需求（Phase 2 新增）

| 關注點 | Phase 2 處理方式 |
|---|---|
| 市場過濾 | 所有返回列表 API 支援 `?market=US\|TW` 查詢參數 |
| 使用者偏好 | marketMode、currentSectorId 儲存於 auth-service User 表 |
| 匯率 | 呼叫 Exchangerate-API，結果快取 1h（Redis） |
| 台股盤中判斷 | 台股盤中時間：09:00~13:30 TST；行情快取 TTL 依此動態設定 |
| k8s 機密資料 | API Key、JWT Secret、DB 密碼全部改為 k8s Secret 注入 |
| Image 版本管理 | 每次 CI/CD 使用 Git SHA 作為 Image Tag（不使用 latest） |

---

## 10. 階段間依賴

```
Phase 2 輸出 → Phase 3 依賴

├── k8s 叢集（已建立）           → Phase 3 ai-service 直接部署
├── Helm Chart 架構              → Phase 3 新增 ai-service Chart
├── sector-service               → Phase 3 AI 分析可參考版塊資訊
├── market-data-service（雙市場）→ Phase 3 AI 分析時取行情歷史資料
├── Treemap 儀表板               → Phase 3 可在此整合 AI 評分視覺化
└── CI/CD Pipeline               → Phase 3 ai-service 自動部署
```

---

## 11. 里程碑驗收標準

### 11.1 k8s 前置里程碑（2026-08-23）

| 驗收項目 | 通過條件 |
|---|---|
| CI/CD 觸發 | git push main → GitHub Actions 自動完成 build → push → deploy |
| Pod 健康 | 所有 Phase 1 服務 Pod Ready，Liveness/Readiness Probe 通過 |
| Ingress 路由 | `https://{domain}/api/stocks` 正確返回美股列表 |
| JWT 驗證 | k8s 環境 JWT 驗證正常，登入流程通過 |
| 損益計算 | k8s 上 Alpha Vantage 呼叫正常，持倉損益顯示正確 |

### 11.2 M2 驗收（2026-10-04）

| 驗收情境 | 通過條件 |
|---|---|
| Switch Tag 切換至 TW | Header 切換後，股票列表、持倉、儀表板全部顯示台股資料 |
| 台股持倉損益 | 台股持倉顯示 TWD 未實現損益 |
| 版塊 Treemap | 儀表板顯示目前版塊持倉 Treemap（面積=市值，顏色=漲跌幅） |
| 版塊切換 | 點擊版塊選擇器，Treemap 即時更新 |
| 統整磁貼 | 顯示總持倉市值、今日損益、最大漲幅/跌幅個股 |
| Admin 版塊管理 | ADMIN 可新增/編輯版塊並管理成分股 |
| 偏好持久化 | 登出後重新登入，Switch Tag 恢復上次選擇的市場 |

---

## 12. 交付物清單

| 文件 / 產出物 | 類型 | 位置 |
|---|---|---|
| SA-Phase2-Integration-v1.md（本文件） | 分析文件 | docs/analysis/requirements/ |
| FR-P2-K8S-v1.md（k8s 詳細需求） | 需求文件 | docs/analysis/requirements/ |
| FR-P2-TW-Market-v1.md（台股行情詳細需求） | 需求文件 | docs/analysis/requirements/ |
| FR-P2-SwitchSector-v1.md（Switch Tag + Sector 詳細需求） | 需求文件 | docs/analysis/requirements/ |
| FR-P2-Dashboard-v1.md（儀表板詳細需求） | 需求文件 | docs/analysis/requirements/ |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
