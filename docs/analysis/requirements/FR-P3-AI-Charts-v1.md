# FR-P3-AI-Charts-v1.md
# Phase 3：AI 分析 + 技術圖表 + 體驗優化 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase3-Integration-v1.md](./SA-Phase3-Integration-v1.md)  
**涵蓋服務：** `ai-service`（新增）、前端 K 線圖、前端 AI 面板、體驗優化  
**任務 ID：** P3-AI-01~05、P3-C-01~03、P3-X-01~06  

---

## 1. ai-service 需求

### 1.1 模組建立（P3-AI-01）

**模組結構：**
```
ai-service/
├── build.gradle.kts           spring-boot-starter-web + actuator + data-redis
│                               + spring-cloud-starter-netflix-eureka-client
├── src/main/java/
│   └── vstocker/aiservice/
│       ├── domain/
│       │   ├── StockAnalysis.java          Aggregate Root
│       │   ├── AnalysisStatus.java         PENDING / COMPLETED / FAILED
│       │   └── AnalysisPromptBuilder.java  Domain Service
│       ├── application/
│       │   ├── StockAnalysisService.java   Application Service
│       │   └── PortfolioRiskService.java   Application Service
│       ├── infrastructure/
│       │   ├── claude/
│       │   │   └── ClaudeApiAdapter.java   Anthropic API 整合
│       │   ├── feign/
│       │   │   ├── StockClient.java        呼叫 stock-service
│       │   │   └── MarketDataClient.java   呼叫 market-data-service
│       │   └── cache/
│       │       └── AnalysisCacheService.java  Redis 快取
│       └── interfaces/
│           ├── AiController.java           REST + SSE 端點
│           └── dto/
│               ├── AnalysisRequestDto.java
│               └── AnalysisChunkDto.java
└── src/main/resources/
    └── application.yml
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-01 | 建立 `ai-service` Gradle 模組，加入 `settings.gradle.kts` |
| FR-P3-AI-02 | `application.yml` 設定：Eureka 客戶端、Redis 連線、Claude API 設定（從 k8s Secret 讀取） |
| FR-P3-AI-03 | ai-service 啟動後在 Eureka 顯示 UP |
| FR-P3-AI-04 | Gateway 新增路由：`/ai/**` → `lb://ai-service` |
| FR-P3-AI-05 | Gateway 白名單排除 `/ai/**`（需要 JWT 驗證，不排除） |

---

### 1.2 StockAnalysis Domain + 快取（P3-AI-02）

```java
// StockAnalysis (Aggregate Root)
@Entity
@Table(name = "stock_analyses")
public class StockAnalysis {
    UUID id;
    String ticker;
    String analysisContent;    // 完整分析文字（Markdown）
    String modelUsed;          // "claude-sonnet-4-6"
    AnalysisStatus status;     // PENDING / COMPLETED / FAILED
    Instant generatedAt;
    Instant expiresAt;         // generatedAt + 24h
    
    boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-06 | 建立 `stock_analyses` 表，儲存已生成的分析結果 |
| FR-P3-AI-07 | Redis 快取 key：`ai:analysis:{ticker}`，TTL 86400s（24h） |
| FR-P3-AI-08 | 快取命中邏輯：先查 Redis → Hit 直接返回；Miss → 查 DB → 未過期直接返回；過期/無紀錄 → 呼叫 Claude API |
| FR-P3-AI-09 | 新分析完成後同時更新 Redis 快取和 DB |
| FR-P3-AI-10 | 使用者每小時對同一 ticker 最多觸發 1 次重新分析（即使快取過期），限流 key：`rate:ai:{userId}:{ticker}` |

---

### 1.3 SSE 串流分析 API（P3-AI-03）

#### POST /ai/stocks/{ticker}/analysis

| 項目 | 說明 |
|---|---|
| 角色 | USER / ADMIN |
| 路徑參數 | `ticker` |
| Query 參數 | `force=true`（強制重新分析，忽略快取） |
| 回應類型 | `text/event-stream`（SSE） |

**SSE 事件格式：**
```
event: analysis-chunk
data: {"chunk": "AAPL（蘋果公司）是全球最大的科技公司之一，", "done": false}

event: analysis-chunk
data: {"chunk": "以 iPhone、Mac 電腦和服務業務為核心。", "done": false}

event: analysis-complete
data: {"ticker": "AAPL", "analysisId": "uuid", "cachedAt": "2026-06-18T10:30:00Z", "done": true}

event: analysis-error
data: {"message": "Claude API 暫時不可用，請稍後再試", "done": true}
```

**Spring Boot SSE 實作：**
```java
@PostMapping(value = "/stocks/{ticker}/analysis", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter analyzeStock(@PathVariable String ticker,
                                @RequestHeader("X-User-Id") String userId) {
    SseEmitter emitter = new SseEmitter(30_000L);  // 30s timeout
    executorService.execute(() -> {
        try {
            // 1. 檢查快取
            Optional<String> cached = cacheService.get(ticker);
            if (cached.isPresent()) {
                // 一次性返回快取結果
                emitter.send(SseEmitter.event().name("analysis-complete").data(cached.get()));
                emitter.complete();
                return;
            }
            // 2. 建構 Prompt 並呼叫 Claude API（Streaming）
            claudeAdapter.streamAnalysis(ticker, chunk -> {
                emitter.send(SseEmitter.event().name("analysis-chunk").data(chunk));
            });
            emitter.complete();
        } catch (Exception e) {
            emitter.send(SseEmitter.event().name("analysis-error").data(e.getMessage()));
            emitter.complete();
        }
    });
    return emitter;
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-11 | SSE emitter timeout 設定 30 秒（Claude API 最大等待） |
| FR-P3-AI-12 | 快取命中時以 `analysis-complete` 事件一次返回，不需等待串流 |
| FR-P3-AI-13 | Claude API 呼叫失敗（timeout / error）→ 發送 `analysis-error` 事件 |
| FR-P3-AI-14 | 分析完成後將完整文字存入 Redis + DB |
| FR-P3-AI-15 | 每個 SSE 連線使用獨立執行緒（VirtualThread 或 ThreadPoolExecutor） |
| FR-P3-AI-16 | Ingress SSE 支援：Nginx timeout 設定 ≥ 60s（k8s Ingress Annotation） |

---

### 1.4 Claude API Adapter（P3-AI-01 擴充）

**使用 Anthropic Java SDK 或直接 REST 呼叫：**

```java
// ClaudeApiAdapter.java
@Component
public class ClaudeApiAdapter {
    
    private final String apiKey;  // 從 k8s Secret 讀取
    private final String model = "claude-sonnet-4-6";
    
    // 建構分析 Prompt
    private String buildPrompt(StockData stockData) {
        return String.format("""
            你是一位專業的股票分析師，提供客觀的個股基本面分析。
            
            股票資訊：
            - 代碼：%s，公司：%s
            - 版塊：%s，交易所：%s
            - 現價：%s，今日漲跌：%s%%
            
            請以繁體中文從以下維度分析：
            1. 公司基本面簡介
            2. 近期股價走勢分析
            3. 版塊競爭地位
            4. 主要風險因素
            5. 技術面觀察重點
            
            免責聲明：本分析僅供參考，不構成投資建議。
            """, ...);
    }
    
    public void streamAnalysis(String ticker, Consumer<String> chunkConsumer) {
        // 呼叫 Anthropic API Messages endpoint with streaming
        // 使用 Server-Sent Events 或 NDJSON streaming
    }
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-17 | Claude API Key 從環境變數 `ANTHROPIC_API_KEY` 讀取（k8s Secret） |
| FR-P3-AI-18 | 使用模型 `claude-sonnet-4-6`（或最新可用 Sonnet 系列） |
| FR-P3-AI-19 | API 呼叫設定 `max_tokens: 2000`（控制輸出長度和費用） |
| FR-P3-AI-20 | Prompt 包含個股基本資料、現價、版塊，組裝於 `AnalysisPromptBuilder` |
| FR-P3-AI-21 | 呼叫前從 stock-service 取個股資料，從 market-data-service 取現價（Feign Client） |
| FR-P3-AI-22 | Claude API 費用監控：記錄每次呼叫的 token 使用量至 DB（`ai_usage_logs` 表） |

---

### 1.5 持倉風險評分（P3-AI-04）

#### POST /ai/portfolios/me/risk-score

| 項目 | 說明 |
|---|---|
| 角色 | USER / ADMIN |
| 業務邏輯 | 1. 取使用者持倉（呼叫 portfolio-service）2. 組裝持倉分佈 Prompt（版塊集中度、個股集中度）3. 呼叫 Claude API 分析風險 4. 返回風險評分（1-10）+ 風險分析文字 |
| 回應類型 | JSON（非 SSE，因分析較短） |

**RiskScoreDto：**
```json
{
  "riskScore": 6,
  "riskLevel": "中等",
  "analysis": "您的持倉集中於科技版塊（佔比 65%），個股集中度偏高（AAPL 佔 30%），建議適度分散...",
  "concentrationWarnings": [
    { "type": "SECTOR", "name": "Technology", "percentage": 65.0 },
    { "type": "STOCK", "ticker": "AAPL", "percentage": 30.0 }
  ],
  "generatedAt": "2026-06-18T10:30:00Z"
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-23 | 風險評分快取 6h（相對持倉不頻繁變動） |
| FR-P3-AI-24 | 持倉變動後（新增/刪除持倉）自動 invalidate 風險評分快取 |
| FR-P3-AI-25 | 風險評分 API 呼叫 Claude API 但使用非 Streaming 方式（Messages API 一次返回） |

---

### 1.6 ai-service Helm Chart（P3-AI-05）

```yaml
# values.yaml（ai-service）
resources:
  requests:
    cpu: "250m"
    memory: "512Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"

# HPA 設定（Phase 3 後期）
hpa:
  enabled: true
  minReplicas: 1
  maxReplicas: 3
  targetCPUUtilizationPercentage: 60
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-AI-26 | 建立 `k8s/charts/ai-service/` Helm Chart，結構與其他服務一致 |
| FR-P3-AI-27 | `ANTHROPIC_API_KEY` 從 k8s Secret `vstocker-api-keys` 讀取 |
| FR-P3-AI-28 | CI/CD Pipeline 自動部署 ai-service 至 k8s |
| FR-P3-AI-29 | ai-service Resource Limit 設定（CPU 1 core、Memory 1Gi） |

---

## 2. 前端技術圖表

### 2.1 K 線圖（P3-C-01）

**元件位置：** 個股詳細頁 `/stocks/{ticker}` 的圖表區塊

**K 線資料來源：**
```
GET /market-data/history/{ticker}?period=3M&interval=1D
回應：[{ date, open, high, low, close, volume }, ...]
外部來源：Alpha Vantage TIME_SERIES_DAILY（最多 100 天）
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-C-01 | 使用 Recharts `ComposedChart` 實作 OHLCV K 線圖（需自定義 Candlestick shape） |
| FR-P3-C-02 | K 線圖顯示：開/高/低/收、成交量（底部 Bar Chart） |
| FR-P3-C-03 | 時間週期切換：1M、3M、6M、1Y（Tab 切換，重新 fetch 對應資料） |
| FR-P3-C-04 | 陽線顯示綠色，陰線顯示紅色 |
| FR-P3-C-05 | 圖表右側顯示十字線（Crosshair），Hover 顯示對應日期的 OHLCV 數值 |
| FR-P3-C-06 | 歷史資料快取至 TanStack Query（staleTime: 1h，歷史資料不頻繁變動） |

---

### 2.2 技術指標（P3-C-02）

**指標計算在前端執行（不依賴後端）：**

**MA（移動平均線）計算：**
```typescript
function calculateMA(data: Candle[], period: number): number[] {
  return data.map((_, i) => {
    if (i < period - 1) return NaN;
    return data.slice(i - period + 1, i + 1)
               .reduce((sum, c) => sum + c.close, 0) / period;
  });
}
```

**RSI（14 日）計算：**
```typescript
function calculateRSI(data: Candle[], period: number = 14): number[] {
  // Wilder's RSI implementation
}
```

**MACD（12, 26, 9）計算：**
```typescript
function calculateMACD(data: Candle[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA({ close: macdLine } as any, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-C-07 | MA20 / MA60 作為 K 線圖的 `Line` 疊加顯示 |
| FR-P3-C-08 | 圖表控制面板：MA20（可開關）、MA60（可開關）切換按鈕 |
| FR-P3-C-09 | K 線圖下方獨立 RSI 面板（使用 `LineChart`，14 日 RSI） |
| FR-P3-C-10 | RSI 面板：超買線（70，紅色虛線）、超賣線（30，綠色虛線） |
| FR-P3-C-11 | K 線圖下方獨立 MACD 面板（MACD Line、Signal Line、Histogram） |
| FR-P3-C-12 | 指標面板預設收合，使用者點擊展開（減少視覺複雜度） |

---

### 2.3 前端 AI 分析面板（P3-C-03）

**元件位置：** 個股詳細頁右側或下方

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-C-13 | 個股詳細頁新增「AI 分析」區塊（Card 元件） |
| FR-P3-C-14 | 顯示「生成 AI 分析」按鈕，點擊後建立 SSE 連線（`EventSource`） |
| FR-P3-C-15 | SSE 連線期間顯示逐字輸入效果（Typewriter Effect），使用 `useState` 累積 chunk |
| FR-P3-C-16 | 分析完成後：停止 Typewriter，顯示完整 Markdown 渲染結果（使用 `react-markdown`） |
| FR-P3-C-17 | 顯示分析時間戳記：`分析生成於 2026-06-18 10:30（快取有效至...）` |
| FR-P3-C-18 | 顯示「重新分析」按鈕（攜帶 `?force=true` 參數），點擊前確認提示（費用提醒） |
| FR-P3-C-19 | SSE 連線錯誤時顯示錯誤狀態 + 「稍後再試」提示 |
| FR-P3-C-20 | 安裝 `react-markdown` 和 `remark-gfm` 支援 Markdown 表格和程式碼區塊 |

**SSE Client 實作：**
```typescript
// src/hooks/useStockAnalysis.ts
export function useStockAnalysis(ticker: string) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  
  const startAnalysis = useCallback((force = false) => {
    const url = `/api/ai/stocks/${ticker}/analysis${force ? '?force=true' : ''}`;
    const es = new EventSource(url, { withCredentials: true });
    
    setStatus('streaming');
    es.addEventListener('analysis-chunk', (e) => {
      const { chunk } = JSON.parse(e.data);
      setContent(prev => prev + chunk);
    });
    es.addEventListener('analysis-complete', () => {
      setStatus('done');
      es.close();
    });
    es.addEventListener('analysis-error', (e) => {
      setStatus('error');
      es.close();
    });
  }, [ticker]);
  
  return { content, status, startAnalysis };
}
```

---

## 3. 體驗優化需求

### 3.1 市場新聞整合（P3-X-01）

**資料來源：** NewsAPI.org 或 RSS Feed（Yahoo Finance、Reuters）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-01 | 個股詳細頁底部新增「相關新聞」區塊 |
| FR-P3-X-02 | 呼叫 `GET /market-data/news?ticker={ticker}&limit=10` 取得個股相關新聞 |
| FR-P3-X-03 | market-data-service 整合 NewsAPI：按股票 ticker 搜尋新聞標題 |
| FR-P3-X-04 | 新聞快取 TTL：30 分鐘 |
| FR-P3-X-05 | 儀表板可新增「市場新聞」磁貼（按持倉個股過濾，顯示前 5 則） |
| FR-P3-X-06 | NewsAPI 免費版 100 req/day 限制：快取避免重複請求 |

---

### 3.2 財報日曆磁貼（P3-X-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-07 | 儀表板新增「財報日曆」磁貼 |
| FR-P3-X-08 | 顯示持倉股票的未來 30 日財報發布日期 |
| FR-P3-X-09 | 美股財報日期來源：Alpha Vantage `EARNINGS_CALENDAR` 端點 |
| FR-P3-X-10 | 台股法說會日期：TWSE 公告（需定期爬取或手動維護） |
| FR-P3-X-11 | 財報日期距今 < 7 天顯示警示 Badge（紅色） |

---

### 3.3 命令面板 ⌘K（P3-X-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-12 | 按 `⌘K`（Mac）/ `Ctrl+K`（Windows）開啟命令面板 |
| FR-P3-X-13 | 使用 `cmdk` 或 shadcn/ui Command 元件實作 |
| FR-P3-X-14 | 支援搜尋：股票 ticker / 名稱（搜尋 stock-service）、頁面快捷（跳轉至 /portfolio、/dashboard 等） |
| FR-P3-X-15 | 搜尋結果選取後跳轉至對應個股詳細頁 |
| FR-P3-X-16 | 命令面板支援鍵盤導航（上/下箭頭、Enter 確認、Escape 關閉） |

---

### 3.4 暗色 / 亮色主題（P3-X-04）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-17 | Header 右側新增主題切換按鈕（太陽/月亮 icon） |
| FR-P3-X-18 | 使用 `next-themes` 或 CSS Custom Properties 實作主題切換 |
| FR-P3-X-19 | 主題選擇儲存至 `localStorage`（`theme: 'dark' \| 'light' \| 'system'`） |
| FR-P3-X-20 | 所有 shadcn/ui 元件自動支援暗色主題（CSS Variables 已在 Phase 0 預留） |
| FR-P3-X-21 | Recharts 圖表主題色跟隨系統切換（動態 fill color） |

---

### 3.5 效能優化（P3-X-05）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-22 | TanStack Query 快取策略審視：historicalData staleTime 設為 1h；quotes staleTime 設為 30s |
| FR-P3-X-23 | 持倉列表使用 Virtualization（`react-virtual` 或 TanStack Virtual）當持倉 > 50 筆時啟用 |
| FR-P3-X-24 | Treemap 個股數量 > 50 時截斷並顯示 "Others"（已在 FR-P2-D 定義） |
| FR-P3-X-25 | 個股詳細頁 K 線圖資料使用 `useMemo` 計算指標，避免每次 render 重算 |
| FR-P3-X-26 | 使用 Next.js `dynamic()` 延遲載入 Recharts 元件（SSR 環境下避免 hydration 問題） |

---

### 3.6 k8s HPA（P3-X-06）

| 需求編號 | 需求描述 |
|---|---|
| FR-P3-X-27 | market-data-service HPA 設定：CPU > 70% → 最多 5 個 Pod |
| FR-P3-X-28 | ai-service HPA 設定：CPU > 60% 或 Memory > 512Mi → 最多 3 個 Pod |
| FR-P3-X-29 | 啟用 k8s Metrics Server（HPA 前提） |
| FR-P3-X-30 | Helm Chart 新增 `hpa.yaml` 模板，透過 `values.yaml` 控制是否啟用 |

**HPA 設定範例：**
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Release.Name }}
  minReplicas: {{ .Values.hpa.minReplicas }}
  maxReplicas: {{ .Values.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.hpa.targetCPUUtilizationPercentage }}
```

---

## 4. 驗收標準

| 情境 | 通過條件 |
|---|---|
| AI 分析觸發 | 點擊「生成 AI 分析」→ SSE 連線建立，文字逐字顯示 |
| 快取命中 | 24h 內再次請求相同 ticker → 立即返回（< 1s，無 Claude API 呼叫） |
| SSE 斷線恢復 | 網路中斷 5s 後重連，分析重新串流 |
| 費用控制 | 同一使用者同一 ticker 1h 內只能觸發 1 次重新分析 |
| K 線圖顯示 | 個股詳細頁顯示過去 3 個月日線 K 線圖，含成交量 |
| MA 疊加 | MA20/MA60 線正確計算並疊加顯示 |
| RSI 面板 | RSI 面板展開後顯示 14 日 RSI，超買/超賣線正確 |
| MACD 面板 | MACD Line、Signal Line、Histogram 正確計算顯示 |
| 命令面板 | 按 ⌘K → 命令面板開啟，搜尋 "AAPL" → 結果跳轉至 `/stocks/AAPL` |
| 主題切換 | 點擊主題按鈕 → 即時切換暗色/亮色，localStorage 儲存偏好 |
| HPA 生效 | 模擬高負載 → market-data Pod 數量自動增加（可透過 kubectl get hpa 觀察） |
| ai-service k8s | ai-service Pod 在 k8s 正常運行，Health Probe 通過 |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
