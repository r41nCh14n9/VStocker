# FR-P0-v1.md
# Phase 0：環境建置與技術驗證 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase0-Integration-v1.md](./SA-Phase0-Integration-v1.md)  
**里程碑：** M0（目標：2026-08-28）  

---

## 1. 前端骨架需求

### 1.1 Next.js 15 專案初始化（P0-F-01）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-FE-01 | 使用 `create-next-app` 建立 Next.js 15 專案，啟用 App Router、TypeScript、ESLint |
| FR-P0-FE-02 | 設定 `tsconfig.json`：`strict: true`，路徑別名 `@/*` 指向 `src/` |
| FR-P0-FE-03 | 專案目錄結構遵循 App Router 規範：`src/app/`、`src/components/`、`src/lib/`、`src/store/` |
| FR-P0-FE-04 | 建立環境變數檔案：`.env.local`（`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`） |
| FR-P0-FE-05 | 建立統一 API Client（`src/lib/api-client.ts`），封裝 fetch，自動帶入 JWT Cookie |

**驗收標準：**
- `npm run dev` 啟動後 `http://localhost:3000` 可訪問，無 TypeScript 編譯錯誤
- `npm run build` 成功完成

---

### 1.2 shadcn/ui + Tailwind CSS v4 整合（P0-F-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-FE-06 | 安裝並設定 Tailwind CSS v4（`@tailwindcss/vite` 或 PostCSS 設定） |
| FR-P0-FE-07 | 初始化 shadcn/ui（`npx shadcn@latest init`），設定主題色彩（中性色系） |
| FR-P0-FE-08 | 新增基礎 shadcn/ui 元件：Button、Input、Card、Dialog、Table、Badge |
| FR-P0-FE-09 | 建立全域 CSS 變數（CSS Custom Properties）支援後續暗色/亮色主題切換（Phase 3） |
| FR-P0-FE-10 | 安裝 `lucide-react`，確認 Icon 可正常引入使用 |

**驗收標準：**
- 建立一個測試頁面 `src/app/test/page.tsx`，顯示 shadcn/ui Button 及 Card 元件，樣式正確渲染

---

### 1.3 Zustand + TanStack Query 基礎結構（P0-F-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-FE-11 | 安裝 `zustand`，建立 store 目錄結構 `src/store/`，新增 `index.ts` 匯出入口 |
| FR-P0-FE-12 | 建立 `auth.store.ts` 骨架：`{ user: User \| null, isAuthenticated: boolean }`（Phase 1 實作） |
| FR-P0-FE-13 | 安裝 `@tanstack/react-query`，在 `src/app/providers.tsx` 設定 `QueryClient`（staleTime: 30s） |
| FR-P0-FE-14 | 在 `src/app/layout.tsx` 包裝 `<QueryClientProvider>` |
| FR-P0-FE-15 | 安裝 `@tanstack/react-query-devtools`（開發環境使用） |

**驗收標準：**
- Zustand DevTools 可在瀏覽器 Redux DevTools Extension 查看 store 狀態
- React Query Devtools 浮動面板在開發環境正常顯示

---

## 2. 後端骨架需求

### 2.1 Gradle Multi-Module 專案架構（P0-B-01）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-BE-01 | 建立 Gradle Multi-Module 根專案 `vstocker-backend`，包含 `settings.gradle.kts` |
| FR-P0-BE-02 | 各服務模組列表：`gateway`、`auth-service`、`stock-service`、`portfolio-service`、`sector-service`、`market-data-service` |
| FR-P0-BE-03 | 根 `build.gradle.kts` 定義共用依賴版本（Spring Boot 3.x BOM、Spring Cloud 2023.x BOM） |
| FR-P0-BE-04 | 每個服務模組有獨立 `build.gradle.kts`，設定各自所需依賴 |
| FR-P0-BE-05 | 每個服務模組有 `src/main/resources/application.yml`：設定 `spring.application.name` 及 Eureka Client 設定 |
| FR-P0-BE-06 | 每個服務模組包含 `*Application.java`（Spring Boot main class），可獨立啟動 |
| FR-P0-BE-07 | DDD 目錄結構：每個服務模組建立 `domain/`、`application/`、`infrastructure/`、`interfaces/` 套件（Phase 1 填入業務邏輯） |

**驗收標準：**
- `./gradlew build` 在根目錄執行，所有模組編譯通過（不含業務邏輯，僅骨架）
- 各服務可單獨透過 IDE 或 `./gradlew :auth-service:bootRun` 啟動

---

### 2.2 Docker Compose 設定（P0-B-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-INF-01 | 根目錄建立 `docker-compose.yml`，包含以下服務 |
| FR-P0-INF-02 | **Eureka Server**（Spring Cloud Eureka，port 8761），健康端點 `/actuator/health` |
| FR-P0-INF-03 | **Config Server**（Spring Cloud Config，port 8888），讀取 classpath 設定 |
| FR-P0-INF-04 | **PostgreSQL auth-db**（port 5432），DB: `auth_db`，user: `auth_user` |
| FR-P0-INF-05 | **PostgreSQL stock-db**（port 5433），DB: `stock_db` |
| FR-P0-INF-06 | **PostgreSQL portfolio-db**（port 5434），DB: `portfolio_db` |
| FR-P0-INF-07 | **PostgreSQL sector-db**（port 5435），DB: `sector_db` |
| FR-P0-INF-08 | **PostgreSQL market-data-db**（port 5436），DB: `market_data_db` |
| FR-P0-INF-09 | **Redis**（port 6379），設定 maxmemory policy `allkeys-lru` |
| FR-P0-INF-10 | **Kafka**（KRaft 模式，port 9092），不依賴 ZooKeeper |
| FR-P0-INF-11 | 各 PostgreSQL 服務設定 `healthcheck`：使用 `pg_isready`，`depends_on` 確保 DB 先就緒 |
| FR-P0-INF-12 | 建立 `.env` 檔案，所有密碼/Port 從環境變數讀取；`.env` 加入 `.gitignore` |

**驗收標準：**
- `docker compose up -d` 啟動後所有容器狀態為 `healthy`
- `docker compose ps` 顯示 10+ 個服務（基礎設施 + 微服務）全部 Running

---

### 2.3 Spring Cloud Gateway + Eureka（P0-B-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-BE-08 | Gateway 設定路由規則（`application.yml`）：`/auth/**` → `lb://auth-service`，其餘服務類推 |
| FR-P0-BE-09 | Gateway 設定 CORS：允許 `http://localhost:3000`，允許方法 GET/POST/PUT/PATCH/DELETE |
| FR-P0-BE-10 | Gateway 設定 GlobalFilter：在每筆請求 Log 記錄方法、路徑、回應時間 |
| FR-P0-BE-11 | 各微服務啟動後在 Eureka Dashboard 顯示 `UP` 狀態 |
| FR-P0-BE-12 | Eureka 設定 `fetch-registry: true`，Gateway 使用 `lb://` 負載均衡路由 |

**驗收標準：**
- 訪問 `http://localhost:8761` 可看到 Eureka Dashboard，所有已啟動服務顯示 UP
- `curl http://localhost:8080/actuator/health`（通過 Gateway 代理）返回 200

---

### 2.4 JWT 驗證流程（P0-B-04）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-BE-13 | Gateway 加入 `JwtAuthenticationFilter`（GlobalFilter），攔截所有非白名單路徑 |
| FR-P0-BE-14 | 白名單路徑（不驗證 JWT）：`POST /auth/register`、`POST /auth/login`、`GET /actuator/**` |
| FR-P0-BE-15 | JWT Secret 儲存於 Config Server（`application.yml`：`jwt.secret`），Gateway 從 Config 讀取 |
| FR-P0-BE-16 | JWT 驗證通過後，Gateway 在轉發請求的 Header 注入：`X-User-Id: {userId}`、`X-User-Role: {role}` |
| FR-P0-BE-17 | 攜帶無效或過期 JWT 的請求，Gateway 回傳 `401 Unauthorized`，格式遵循 `ApiResponse<T>` |
| FR-P0-BE-18 | 無 JWT（未登入）請求受保護路徑，Gateway 回傳 `401 Unauthorized` |

**POC 驗證方式（Phase 0 暫時做法）：**
- 手動產生測試用 JWT（使用 jwt.io 工具），以 `HS256` + 設定好的 Secret 簽名
- 攜帶此測試 JWT 請求 Gateway 路由，驗證可成功轉發

**驗收標準：**
- 攜帶有效 JWT → 請求被轉發至下游服務，下游 Header 含 `X-User-Id`
- 攜帶無效 JWT → Gateway 返回 `401`
- 無 JWT → Gateway 返回 `401`

---

### 2.5 Alpha Vantage API Adapter POC（P0-B-05）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-EXT-01 | `market-data-service` 新增 `AlphaVantageAdapter`，使用 `WebClient` 或 `RestTemplate` 呼叫 Alpha Vantage REST API |
| FR-P0-EXT-02 | 實作 `GET /market-data/quotes?symbol={ticker}` 端點（POC 測試用） |
| FR-P0-EXT-03 | API Key 從環境變數 `ALPHA_VANTAGE_API_KEY` 讀取（不硬編碼） |
| FR-P0-EXT-04 | 呼叫 Alpha Vantage `GLOBAL_QUOTE` endpoint，解析並返回：symbol、price、change、changePercent、latestTradingDay |
| FR-P0-EXT-05 | 回應包裝為 `ApiResponse<QuoteDto>` 格式 |
| FR-P0-EXT-06 | 記錄 API 呼叫 Log（INFO 等級：symbol、回應時間、HTTP 狀態） |

**驗收標準：**
- `curl -H "Authorization: Bearer {testJwt}" http://localhost:8080/market-data/quotes?symbol=AAPL`
- 返回含 AAPL 現價的 JSON，格式為 `{ code: 200, data: { symbol: "AAPL", price: ... } }`

---

### 2.6 TWSE Open API Adapter POC（P0-B-06）

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-EXT-07 | `market-data-service` 新增 `TwseAdapter`，呼叫 TWSE Open API |
| FR-P0-EXT-08 | 實作 `GET /market-data/tw/quotes?symbol={twseCode}` 端點（POC 測試用） |
| FR-P0-EXT-09 | 呼叫 TWSE API：`https://www.twse.com.tw/exchangeReport/STOCK_DAY?stockNo={twseCode}&response=json` |
| FR-P0-EXT-10 | 解析 TWSE 回應，返回最新交易日：日期、收盤價、漲跌 |
| FR-P0-EXT-11 | 回應包裝為 `ApiResponse<TwQuoteDto>` 格式 |

**驗收標準：**
- `curl -H "Authorization: Bearer {testJwt}" http://localhost:8080/market-data/tw/quotes?symbol=2330`
- 返回含台積電最新收盤資料的 JSON

---

### 2.7 統一 API Response 格式規範（P0-B-07）

#### ApiResponse<T> 格式規範

```json
// 成功回應
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 分頁回應
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}

// 錯誤回應
{
  "code": 40001,
  "message": "Invalid token",
  "data": null
}
```

#### 錯誤代碼規範

| 錯誤代碼 | HTTP Status | 場景 |
|---|---|---|
| 40001 | 401 | JWT 無效或過期 |
| 40002 | 401 | 未提供認證 Token |
| 40301 | 403 | 權限不足（ADMIN required） |
| 40401 | 404 | 資源不存在 |
| 40901 | 409 | 資源衝突（例：刪除有持倉的個股） |
| 42201 | 422 | 請求資料驗證失敗 |
| 42202 | 422 | 業務規則違反 |
| 50001 | 500 | 內部伺服器錯誤 |
| 50002 | 502 | 外部 API 呼叫失敗（Alpha Vantage / TWSE） |
| 50003 | 503 | 服務暫時不可用 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P0-STD-01 | 建立 `common` 模組或在每個服務建立 `ApiResponse<T>` 泛型類別 |
| FR-P0-STD-02 | 建立 `GlobalExceptionHandler`（`@ControllerAdvice`），統一攔截所有例外並格式化為 `ApiResponse` |
| FR-P0-STD-03 | 處理 `MethodArgumentNotValidException` → 42201（含 field error 清單） |
| FR-P0-STD-04 | 處理 `NoSuchElementException` / `EntityNotFoundException` → 40401 |
| FR-P0-STD-05 | 處理通用 `Exception` → 50001（隱藏堆疊，Log 完整堆疊至 ERROR 等級） |
| FR-P0-STD-06 | 建立錯誤代碼枚舉 `ErrorCode.java`，統一管理所有錯誤代碼常數 |

**驗收標準：**
- 呼叫任何 API 端點，無論成功或失敗，回應格式符合 `ApiResponse<T>` 規範
- 傳入非法參數時，收到含 `field errors` 的 42201 錯誤

---

## 3. 限制與假設

| 類別 | 內容 |
|---|---|
| API Key | Alpha Vantage 免費 API Key 需提前申請；TWSE API 免費無需申請 |
| 記憶體 | Docker Compose 啟動所有服務需要 ≥ 6GB RAM，建議 8GB |
| Kafka | Phase 0 僅確保容器就緒，不實作任何 Topic / Producer / Consumer |
| JWT Secret | Phase 0 使用固定測試 Secret（32 字元以上隨機字串），生產環境在 Phase 2 改為 k8s Secret |
| 微服務通訊 | Phase 0 僅 Gateway→下游 HTTP；服務間呼叫在 Phase 1 引入 |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
