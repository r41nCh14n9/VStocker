# FR-P2-SwitchSector-v1.md
# Phase 2：Switch Tag + Sector 版塊管理 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase2-Integration-v1.md](./SA-Phase2-Integration-v1.md)  
**涵蓋服務：** 前端 Switch Tag + Zustand、`sector-service`（後端）、`auth-service`（偏好擴充）  
**任務 ID：** P2-SW-01~04、P2-SEC-01~05  

---

## 1. Switch Tag（US / TW 市場切換）

### 1.1 業務規則

| 規則編號 | 規則描述 |
|---|---|
| BR-SW-01 | Switch Tag 是全域性的，切換後影響所有頁面的資料顯示 |
| BR-SW-02 | 切換後不需要頁面刷新，使用 Zustand 驅動的 Reactive 更新 |
| BR-SW-03 | 使用者的 marketMode 偏好持久化至後端（auth-service），登入後自動恢復 |
| BR-SW-04 | 未登入訪客預設顯示 US 市場 |
| BR-SW-05 | 切換動作即時保存（不需手動「儲存」），呼叫後端 API 異步更新，不阻塞 UI |

---

### 1.2 Switch Tag UI 元件（P2-SW-01）

**元件位置：** 全域 `<Header>` 元件（每個頁面頂部）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SW-01 | Header 右側放置 Switch Tag 元件：`[US] [TW]` 風格的 Toggle Button Group |
| FR-P2-SW-02 | 當前選中的市場 Tag 顯示 Active 樣式（填滿色彩） |
| FR-P2-SW-03 | 切換時顯示 0.2s 過渡動畫（Motion/Framer animate），提升視覺回饋 |
| FR-P2-SW-04 | Switch Tag 在所有頁面（stocks、portfolio、dashboard）均可見且可操作 |
| FR-P2-SW-05 | 切換時觸發 Zustand `setMarketMode` 動作，同時異步呼叫偏好儲存 API |

**Switch Tag 元件設計：**
```tsx
// src/components/layout/MarketSwitchTag.tsx
export function MarketSwitchTag() {
  const { marketMode, setMarketMode } = useMarketStore();
  return (
    <ToggleGroup type="single" value={marketMode} onValueChange={setMarketMode}>
      <ToggleGroupItem value="US">US</ToggleGroupItem>
      <ToggleGroupItem value="TW">TW</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

---

### 1.3 Zustand marketMode Store（P2-SW-02）

**檔案路徑：** `src/store/market.store.ts`

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SW-06 | Market Store 狀態：`{ marketMode: 'US' \| 'TW' }` |
| FR-P2-SW-07 | Action：`setMarketMode(mode: 'US' \| 'TW')` — 更新狀態並觸發偏好儲存 |
| FR-P2-SW-08 | 初始值從 auth store 的 `user.marketMode` 讀取（登入後初始化） |
| FR-P2-SW-09 | 登出時 marketMode reset 為 `'US'`（預設） |
| FR-P2-SW-10 | 建立 `useMarketMode()` Hook 供各頁面取用當前市場模式 |

---

### 1.4 全頁自動 Filter（P2-SW-03）

所有使用市場資料的頁面，必須依 `marketMode` 過濾：

| 頁面 | Filter 行為 |
|---|---|
| 美股/台股個股列表 `/stocks` | 切換後 TanStack Query key 更新（含 market 參數），自動重新 fetch |
| 個股持倉列表 `/portfolio` | 切換後 fetch 對應市場的 Portfolio |
| 版塊管理 `/sectors` | 切換後顯示對應市場的版塊 |
| 儀表板 `/dashboard` | 切換後 Treemap 顯示對應市場的持倉 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SW-11 | 所有 TanStack Query key 包含 `marketMode`：`['stocks', { market: marketMode, ...filters }]` |
| FR-P2-SW-12 | marketMode 變更時，相關 Query 自動 invalidate 並 refetch（透過 useMarketMode() 的 dependency） |
| FR-P2-SW-13 | 切換後頁面顯示 Loading 骨架屏（不超過 1 秒），資料載入後即時顯示 |
| FR-P2-SW-14 | URL 不需反映 marketMode（State 管理在 Zustand，不用 URL 搜尋參數） |

---

### 1.5 使用者偏好持久化（P2-SW-04）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SW-15 | 切換 Switch Tag 後，異步呼叫 `PUT /users/me/preferences`（`{ "marketMode": "TW" }`） |
| FR-P2-SW-16 | 偏好儲存 API 呼叫失敗不影響 UI（靜默失敗，僅 Log Warning） |
| FR-P2-SW-17 | 使用者登入後，`GET /users/me` 返回的 `marketMode` 初始化 Zustand market store |
| FR-P2-SW-18 | 登入後 Switch Tag 自動顯示上次選擇的市場 |

---

## 2. Sector 版塊管理

### 2.1 領域模型

```
Sector (Aggregate Root)
├── id: UUID
├── name: String              "Technology" | "半導體" | ...
├── market: Market            'US' | 'TW'
├── description: String?
├── createdAt: Instant
└── updatedAt: Instant

SectorComposition (Entity)
├── id: UUID
├── sectorId: UUID            FK → Sector.id
├── ticker: String            引用 stock-service 的 ticker（邏輯關聯）
└── addedAt: Instant
```

### 2.2 業務規則

| 規則編號 | 規則描述 |
|---|---|
| BR-SEC-01 | 版塊名稱在同一市場內唯一（US 和 TW 可有同名版塊） |
| BR-SEC-02 | 同一版塊不允許重複新增同一 ticker 成分股 |
| BR-SEC-03 | 刪除版塊前，若有使用者的 `currentSectorId` 指向此版塊，自動 reset 為 null |
| BR-SEC-04 | 成分股 ticker 必須存在於 stock-service（呼叫驗證） |
| BR-SEC-05 | 系統預設版塊（P0 Priority）：US 市場 GICS 11 個版塊，TW 市場 TWSE 主要產業 |

---

### 2.3 版塊 CRUD API（P2-SEC-02）

#### GET /sectors

| 項目 | 說明 |
|---|---|
| 角色 | USER / ADMIN |
| Query 參數 | `market=US\|TW`（必填）、`page`、`size` |
| 回應 | `ApiResponse<List<SectorDto>>`（版塊清單，含 id、name、market、成分股數量） |

#### GET /sectors/{id}

| 項目 | 說明 |
|---|---|
| 角色 | USER / ADMIN |
| 回應 | `ApiResponse<SectorDetailDto>`（含完整成分股列表） |

#### POST /sectors（ADMIN Only）

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "name": "Technology", "market": "US", "description": "..." }` |
| 驗證 | name 非空；market 必填；同市場 name 唯一 |
| 成功回應 | 201 Created |

#### PUT /sectors/{id}（ADMIN Only）

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "name": "Tech & Innovation", "description": "..." }` |
| 成功回應 | 200 OK |

#### DELETE /sectors/{id}（ADMIN Only）

| 業務邏輯 | 1. 清除有此 `currentSectorId` 的使用者偏好（呼叫 auth-service）2. 刪除 SectorComposition 3. 刪除 Sector |
| 成功回應 | 204 No Content |

---

### 2.4 成分股管理 API（P2-SEC-03）

#### POST /sectors/{id}/stocks

| 項目 | 說明 |
|---|---|
| 角色 | ADMIN |
| 請求 Body | `{ "ticker": "AAPL" }` |
| 業務邏輯 | 1. 確認 Sector 存在 2. 確認 ticker 存在於 stock-service（呼叫 `/internal/stocks/{ticker}/exists`）3. 確認 ticker market 與 Sector market 一致 4. 新增 SectorComposition |
| 錯誤 | 40401（Sector 不存在）、40401（ticker 不存在）、40901（ticker 已在此版塊）、42202（market 不一致） |

#### DELETE /sectors/{id}/stocks/{ticker}

| 角色 | ADMIN |
| 成功回應 | 204 No Content |

---

### 2.5 前端版塊管理頁面（Admin）（P2-SEC-04）

**路徑：** `/sectors`（僅 ADMIN 可見完整管理功能；USER 可查看版塊列表）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SEC-01 | 頁面頂部顯示 Switch Tag 切換的版塊（US 版塊 vs TW 版塊） |
| FR-P2-SEC-02 | 版塊列表：名稱、市場、成分股數量、操作按鈕（ADMIN）|
| FR-P2-SEC-03 | ADMIN 可新增版塊（Modal：名稱、市場選擇、說明） |
| FR-P2-SEC-04 | ADMIN 點擊版塊進入成分股管理：顯示成分股列表、搜尋新增個股、刪除個股 |
| FR-P2-SEC-05 | 成分股搜尋：輸入 ticker 或公司名稱，即時搜尋對應市場的個股 |
| FR-P2-SEC-06 | USER 可查看版塊列表（唯讀），無新增/編輯/刪除按鈕 |

---

### 2.6 使用者版塊選擇（P2-SEC-05）

**情境：** 使用者可選擇目前最關注的版塊，此版塊將作為儀表板 Treemap 的預設顯示版塊。

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-SEC-07 | `PATCH /users/me/preferences`（擴充）：新增 `{ "currentSectorId": "uuid" }` 欄位 |
| FR-P2-SEC-08 | auth-service User 表新增 `current_sector_id` 欄位（UUID，nullable） |
| FR-P2-SEC-09 | 儀表板「版塊選擇器」點擊後：1. 更新 Zustand local state 2. 呼叫 PATCH API 儲存至 DB |
| FR-P2-SEC-10 | 儀表板載入時：從 `GET /users/me` 取得 `currentSectorId`，初始化 Zustand sector store |
| FR-P2-SEC-11 | `currentSectorId` 被刪除（版塊刪除時），自動 reset 為 null，儀表板顯示所有版塊的預設視圖 |

**Sector Store（前端）：**

```typescript
// src/store/sector.store.ts
interface SectorStore {
  currentSectorId: string | null;
  setCurrentSector: (sectorId: string | null) => void;
}
```

---

## 3. 驗收標準

| 情境 | 通過條件 |
|---|---|
| Switch Tag 切換 | 點擊 TW → 個股列表立即顯示台股，無頁面刷新 |
| 偏好持久化 | 切換為 TW → 登出 → 重新登入 → Switch Tag 顯示 TW |
| 版塊創建 | Admin 創建 "半導體"（market=TW）版塊成功 |
| 成分股新增 | Admin 將 TW:2330 加入 "半導體" 版塊 |
| Market 一致性 | 嘗試將美股 AAPL 加入 TW 版塊 → 返回 42202 錯誤 |
| 版塊刪除聯動 | 刪除使用者正在關注的版塊 → 使用者 currentSectorId 自動 reset |
| 使用者版塊選擇 | 使用者選擇 "半導體" 版塊 → 儀表板 Treemap 顯示半導體成分股持倉 |
| 全頁 Filter | 切換 US→TW 後，stocks、portfolio、dashboard 所有頁面資料同步更新 |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
