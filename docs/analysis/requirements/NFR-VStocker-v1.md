# NFR-VStocker-v1.md
# VStocker — 全系統非功能性需求（NFR）

**版本：** v1.0  
**建立日期：** 2026-06-18  
**適用範圍：** 所有 Phase（P0 ~ P3）  
**所屬計畫：** [PLAN-VStocker-v4.md](../../plans/active/PLAN-VStocker-v4.md)  

---

## 1. 效能需求（Performance）

### 1.1 API 回應時間

| API 類型 | 目標 | 測量條件 |
|---|---|---|
| 一般 CRUD API（stocks, auth） | P95 < 300ms | 本地 Docker Compose，單使用者 |
| 持倉損益查詢（含批量報價） | P95 < 2s | 持倉 ≤ 30 筆，Redis 快取命中 |
| 儀表板 BFF 聚合 API | P95 < 2s | 含批量報價 + 版塊資料 |
| AI 分析（SSE 首 chunk） | P50 < 3s | 非快取場景 |
| AI 分析快取返回 | P95 < 200ms | Redis 快取命中 |
| 外部 API 代理（Alpha Vantage） | P95 < 5s | 受外部服務限制 |

### 1.2 前端效能

| 指標 | 目標 | 備註 |
|---|---|---|
| LCP（Largest Contentful Paint） | < 2.5s | 網路 Fast 3G，初次載入 |
| CLS（Cumulative Layout Shift） | < 0.1 | Skeleton 避免版面跳動 |
| Treemap 初次渲染 | < 500ms | 資料已載入後的渲染時間 |
| 版塊切換響應 | < 200ms | 前端過濾，不需 API 呼叫 |
| Switch Tag 切換 | < 100ms | UI 反應時間（資料載入另計） |

### 1.3 快取效率

| 快取項目 | 命中目標 | TTL |
|---|---|---|
| 美股報價 | > 80% | 60s |
| 台股報價（盤中） | > 70% | 10s |
| AI 分析 | > 90% | 24h |
| 匯率 USD/TWD | > 99% | 1h |
| 市場指數 | > 85% | 60s |

---

## 2. 可用性需求（Availability）

| 環境 | 目標 SLA | 備註 |
|---|---|---|
| k8s 生產環境（Phase 2+） | 99.5% | 允許每月 ~3.6h 停機 |
| 本地 Docker Compose（開發） | 不設 SLA | 開發工具 |
| CI/CD 自動部署 | 滾動更新，零停機 | `strategy: RollingUpdate` |

**高可用設計：**

| 服務 | Phase 1（Docker Compose）| Phase 2+（k8s） |
|---|---|---|
| gateway | 1 副本 | 2 副本（預設） |
| auth-service | 1 副本 | 2 副本 |
| stock-service | 1 副本 | 1 副本（低流量） |
| portfolio-service | 1 副本 | 2 副本 |
| market-data-service | 1 副本 | 2 副本，HPA 最多 5 |
| ai-service（Phase 3） | N/A | 1 副本，HPA 最多 3 |

---

## 3. 安全性需求（Security）

### 3.1 認證與授權

| 需求 | 規格 |
|---|---|
| 認證機制 | JWT（HS256）+ HttpOnly Cookie |
| Token 有效期 | 24 小時（Phase 1 初版） |
| 密碼雜湊 | BCrypt（cost factor 12） |
| 角色體系 | ADMIN / USER（二元角色） |
| Gateway 職責 | JWT 驗證 + X-User-Id/X-User-Role 注入 |
| 服務間信任 | 服務間 HTTP（/internal/**）不驗 JWT，依 Kubernetes NetworkPolicy 限制訪問 |

### 3.2 機密資料管理

| 類型 | 開發（Docker Compose） | 生產（k8s） |
|---|---|---|
| DB 密碼 | `.env`（加入 `.gitignore`） | k8s Secret |
| JWT Secret | `.env` | k8s Secret |
| 外部 API Key | `.env` | k8s Secret |
| Claude API Key | `.env` | k8s Secret |

**強制規定：**
- `.env` 檔案**嚴禁**提交至版本控制
- 所有含 Key/Password 的欄位從不出現在 Log（Log Masking）
- git pre-commit hook 掃描 Secret pattern（可選用 `git-secrets`）

### 3.3 輸入驗證

| 層級 | 措施 |
|---|---|
| 前端 | react-hook-form + zod schema 驗證 |
| 後端 API 層 | `@Valid` + `MethodArgumentNotValidException` 處理 |
| SQL 安全 | 使用 JPA 參數化查詢，禁止字串拼接 SQL |
| XSS 防護 | React 預設 XSS 防護；`react-markdown` 使用 `rehype-sanitize` |

### 3.4 CORS 設定

| 設定項目 | 值 |
|---|---|
| 允許 Origin | `http://localhost:3000`（開發）；`https://{production-domain}`（生產） |
| 允許方法 | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| 允許 Headers | Content-Type, Authorization |
| Allow Credentials | true（HttpOnly Cookie）|
| Max Age | 86400s（Preflight 快取）|

### 3.5 傳輸安全

| 需求 | 規格 |
|---|---|
| k8s 環境 | HTTPS（TLS），透過 cert-manager + Let's Encrypt |
| 本地開發 | HTTP（接受 localhost 無 TLS）|
| Cookie Secure | 生產環境 `Secure: true`，開發環境 `Secure: false` |

---

## 4. 可維護性需求（Maintainability）

### 4.1 日誌規範

| 等級 | 使用場景 |
|---|---|
| ERROR | 未處理的例外、外部 API 呼叫失敗、DB 連線失敗 |
| WARN | 外部 API 呼叫重試、Cache Miss（頻率過高時）、業務規則拒絕 |
| INFO | 每筆請求（方法 + 路徑 + 狀態碼 + 耗時）、服務啟動 / 停止 |
| DEBUG | 詳細業務邏輯流程（生產環境關閉） |

**Log 格式（JSON，結構化）：**
```json
{
  "timestamp": "2026-06-18T10:30:00Z",
  "level": "INFO",
  "service": "portfolio-service",
  "traceId": "abc123",
  "userId": "uuid",
  "message": "GET /portfolios/me completed in 245ms",
  "statusCode": 200
}
```

**Trace ID 傳遞：**
- Gateway 為每筆請求生成 `X-Trace-Id` Header（UUID）
- 各服務讀取並在 Log 記錄（MDC）
- SSE 串流同樣傳遞 traceId

### 4.2 健康端點

所有後端服務必須提供：

| 端點 | 用途 |
|---|---|
| `GET /actuator/health` | 完整健康檢查（外部 + DB + Redis） |
| `GET /actuator/health/liveness` | k8s Liveness Probe |
| `GET /actuator/health/readiness` | k8s Readiness Probe |
| `GET /actuator/info` | 服務版本、Git commit SHA |

### 4.3 API 文件

| 需求 | 工具 | 位置 |
|---|---|---|
| 自動生成 Swagger UI | SpringDoc OpenAPI 2.x | `{service-host}/swagger-ui.html` |
| 所有 DTO 有 `@Schema` 說明 | SpringDoc annotations | 各服務 DTO 類別 |
| Gateway 整合所有服務 API 文件 | SpringDoc Gateway 整合（可選）| `/swagger-ui.html` 統一入口 |

---

## 5. 可擴充性需求（Scalability）

| 需求 | 設計策略 |
|---|---|
| 水平擴展 | 所有服務設計為 Stateless，Session 不在 Server 儲存 |
| 資料庫連線池 | HikariCP（Spring Boot 預設），最大連線數 20/服務 |
| 外部 API 限速 | Redis 令牌桶（token bucket）限流（Phase 2 引入） |
| AI Service 成本控制 | 快取 24h、每使用者每小時限制 1 次重新分析 |
| Kafka 就緒 | 基礎設施在 Phase 0 建立，Phase 2+ 使用 Domain Event 解耦（如持倉變更 → 通知 AI 快取失效） |

---

## 6. 相容性需求（Compatibility）

### 6.1 瀏覽器支援

| 瀏覽器 | 版本 | 說明 |
|---|---|---|
| Chrome | 最新版 | 主要開發環境 |
| Firefox | 最新版 | 支援 |
| Safari | 最新版 | 支援（注意 EventSource / SSE 相容性） |
| Edge | 最新版 | 支援 |
| Mobile Browser | 不強制支援 | Bento Grid 設計優先桌面 |

### 6.2 API 向後相容

| 規範 | 說明 |
|---|---|
| URI 版本 | 不使用路徑版本（/v1/...），使用 Feature Flag 或 Content Negotiation |
| 欄位向後相容 | 新增欄位（非 breaking change）；移除欄位（需 Deprecation Period） |
| 廢棄 API | 在回應 Header 標注 `Deprecation` 並提前通知 |

---

## 7. 可測試性需求（Testability）

| 測試類型 | 目標覆蓋率 | 工具 |
|---|---|---|
| 單元測試（Domain Service） | ≥ 80% | JUnit 5 + Mockito |
| 整合測試（API + DB） | 核心 CRUD 端點 | Spring Boot Test + Testcontainers |
| 前端元件測試 | 核心元件 | Vitest + React Testing Library |
| E2E 測試 | 關鍵使用者旅程 | Playwright（Phase 2+ 引入） |

---

## 8. 合規性需求（Compliance）

| 需求 | 說明 |
|---|---|
| 個人資料 | 僅儲存使用者 email、角色、偏好；無第三方資料分析 |
| 資料存放地點 | 依雲端服務提供商決定（Phase 2 叢集選型時確認） |
| AI 免責聲明 | 所有 AI 分析結果均顯示免責聲明：「本分析僅供參考，不構成投資建議」|
| 外部資料使用 | Alpha Vantage / TWSE / Fugle API 遵循各 ToS，不進行未授權的資料重新分發 |

---

## 9. 開發體驗需求（Developer Experience）

| 需求 | 實現方式 |
|---|---|
| 一鍵啟動開發環境 | `docker compose up -d` 啟動所有基礎設施 |
| 前後端熱重載 | `npm run dev`（Next.js）/ IDE Spring Boot DevTools |
| 本地模擬 k8s | 使用 `k3d` 或 `minikube` 在本地測試 k8s 行為（Phase 2 k8s sprint 期間） |
| 環境變數文件 | `.env.example` 提供所有環境變數說明（不含實際值） |
| API 開發工具 | Swagger UI 在開發環境開放；或使用 Bruno / Postman Collection |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
