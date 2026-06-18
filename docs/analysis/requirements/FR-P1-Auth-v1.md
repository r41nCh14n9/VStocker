# FR-P1-Auth-v1.md
# Phase 1：認證與授權 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase1-Integration-v1.md](./SA-Phase1-Integration-v1.md)  
**涵蓋服務：** `auth-service`（後端）、前端登入流程  
**任務 ID：** P1-A-01 ~ P1-A-06、P1-FA-01 ~ P1-FA-03  

---

## 1. 領域模型（Domain Model）

### 1.1 User Aggregate（P1-A-01）

```
User (Aggregate Root)
├── id: UUID                      主鍵，系統生成
├── email: String                 唯一，不可修改
├── passwordHash: String          bcrypt hash，不對外暴露
├── role: UserRole                ADMIN | USER
├── status: UserStatus            ACTIVE | INACTIVE
├── marketMode: MarketMode        'US' | 'TW'（預設 'US'）
├── currentSectorId: UUID?        目前關注版塊（Phase 2 使用，此階段預留）
├── createdAt: Instant
└── updatedAt: Instant

UserRole: enum { ADMIN, USER }
UserStatus: enum { ACTIVE, INACTIVE }
MarketMode: enum { US, TW }
```

### 1.2 業務規則

| 規則編號 | 規則描述 |
|---|---|
| BR-AUTH-01 | email 必須唯一，不分大小寫（儲存時轉小寫） |
| BR-AUTH-02 | 密碼長度至少 8 字元，需包含字母與數字 |
| BR-AUTH-03 | 密碼以 bcrypt（cost factor 12）雜湊儲存，明文不落地 |
| BR-AUTH-04 | 新使用者預設 role 為 USER、status 為 ACTIVE |
| BR-AUTH-05 | INACTIVE 使用者無法登入（返回 403） |
| BR-AUTH-06 | JWT Access Token 有效期 24 小時 |
| BR-AUTH-07 | Token payload 包含：`sub`（userId）、`role`、`iat`、`exp` |
| BR-AUTH-08 | 系統至少保留一個 ADMIN 帳號（刪除/停用最後一個 ADMIN 時拒絕） |

---

## 2. 後端 auth-service 需求

### 2.1 使用者帳戶 API（P1-A-02）

#### POST /auth/register

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "email": "user@example.com", "password": "Pass1234" }` |
| 驗證規則 | email 格式驗證；password 長度 ≥ 8、含字母與數字 |
| 業務邏輯 | 1. 檢查 email 是否已存在 → 已存在返回 40901 2. 密碼 bcrypt 雜湊 3. 建立 User（role=USER, status=ACTIVE） 4. 返回 UserDto（不含 passwordHash） |
| 成功回應 | 201 Created，`ApiResponse<UserDto>` |
| 錯誤回應 | 42201（驗證失敗）、40901（email 已存在） |
| 角色限制 | 公開（無需 JWT） |

#### POST /auth/login

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "email": "user@example.com", "password": "Pass1234" }` |
| 業務邏輯 | 1. 查詢 User by email（不存在 → 40101）2. 驗證 bcrypt 密碼（不符 → 40101，使用同一錯誤避免帳號枚舉）3. 檢查 status = ACTIVE（否 → 40301 + 停用訊息）4. 發行 JWT（payload 含 userId、role）5. 設定 HttpOnly Cookie（`jwt-token`，SameSite=Strict） |
| 成功回應 | 200 OK，`ApiResponse<LoginResponseDto>`（含 `token`、`expiresIn`、`user` 基本資訊） |
| 錯誤回應 | 40101（認證失敗）、40301（帳號已停用）、42201（驗證失敗） |
| 角色限制 | 公開（無需 JWT） |

**LoginResponseDto：**
```json
{
  "token": "eyJhbGci...",
  "expiresIn": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "marketMode": "US"
  }
}
```

---

### 2.2 Spring Security 設定（P1-A-03）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-A-01 | Spring Security 設定為 Stateless（不使用 Session） |
| FR-P1-A-02 | CSRF 停用（REST API + JWT 模式） |
| FR-P1-A-03 | 密碼雜湊使用 `BCryptPasswordEncoder`（strength=12） |
| FR-P1-A-04 | auth-service 本身不驗證 JWT（Gateway 負責）；auth-service 讀取 Gateway 注入的 `X-User-Id`、`X-User-Role` Header 進行授權 |
| FR-P1-A-05 | 建立 `UserContextHolder`（ThreadLocal），從 Header 解析並存放當前使用者資訊 |

---

### 2.3 角色授權規則（P1-A-04）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-A-06 | 定義兩種角色：`ADMIN`、`USER` |
| FR-P1-A-07 | 角色保護路徑對應：`GET /users` → ADMIN only；`PATCH /users/{id}/status` → ADMIN only |
| FR-P1-A-08 | 一般使用者嘗試訪問 ADMIN 路徑 → 返回 40301 Forbidden |
| FR-P1-A-09 | Gateway 在 Header 注入的 `X-User-Role` 值需與 `UserRole` 枚舉一致（`ADMIN` / `USER`） |

**Gateway 路由授權配置（補充說明）：**
- Gateway 層做 JWT 驗證（解析 Token 有效性 + 注入 Header）
- 業務服務層做角色授權（讀取 Header 決定是否有權限執行操作）
- 兩層各司其職，不重複驗證 JWT 簽名

---

### 2.4 使用者管理 API（P1-A-05）

#### GET /users（Admin Only）

| 項目 | 說明 |
|---|---|
| Query 參數 | `page`（預設 0）、`size`（預設 20）、`role`（可選過濾）、`status`（可選過濾） |
| 回應 | `ApiResponse<Page<UserSummaryDto>>`（不含 passwordHash） |

#### PATCH /users/{id}/status（Admin Only）

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "status": "INACTIVE" }` |
| 業務規則 | 1. 停用最後一個 ADMIN 帳號時拒絕（BR-AUTH-08） 2. 不可停用自己（避免管理員自我鎖定） |
| 成功回應 | 200 OK，`ApiResponse<UserDto>` |
| 錯誤回應 | 40401（使用者不存在）、42202（業務規則違反） |

---

### 2.5 使用者偏好 API（P1-A-06）

#### PUT /users/me/preferences（USER / ADMIN）

| 項目 | 說明 |
|---|---|
| 請求 Body | `{ "marketMode": "TW" }` |
| 業務邏輯 | 1. 從 `X-User-Id` Header 取得當前使用者 ID 2. 更新 `marketMode` 欄位 |
| 成功回應 | 200 OK，`ApiResponse<UserPreferencesDto>` |
| 備註 | `currentSectorId` 欄位在 Phase 2 啟用，此 API 此階段僅接受 `marketMode` |

---

## 3. 前端登入需求

### 3.1 登入頁面（P1-FA-01）

**路徑：** `/login`（公開路由）

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FA-01 | 登入表單：email 輸入欄、password 輸入欄（遮罩）、送出按鈕 |
| FR-P1-FA-02 | 表單驗證（前端）：email 格式、password 非空；顯示即時驗證錯誤訊息 |
| FR-P1-FA-03 | 送出時顯示 Loading 狀態，禁用送出按鈕防止重複提交 |
| FR-P1-FA-04 | 登入成功後：JWT 寫入 HttpOnly Cookie（由後端 Set-Cookie），Zustand auth store 更新 user 狀態 |
| FR-P1-FA-05 | 登入成功後跳轉至 `/dashboard`（或 redirect query 參數指定的路徑） |
| FR-P1-FA-06 | 登入失敗顯示錯誤訊息（`認證失敗，請確認 email 或密碼`），不洩露具體原因 |
| FR-P1-FA-07 | 已登入使用者訪問 `/login` → 自動跳轉至 `/dashboard` |

**登入頁面元件結構：**
```
LoginPage
└── LoginForm（react-hook-form + zod schema）
    ├── EmailInput（shadcn/ui Input）
    ├── PasswordInput（shadcn/ui Input, type="password"）
    ├── ErrorAlert（shadcn/ui Alert, 條件顯示）
    └── SubmitButton（shadcn/ui Button, loading state）
```

---

### 3.2 Route 保護 Middleware（P1-FA-02）

**檔案路徑：** `src/middleware.ts`

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FA-08 | Next.js Middleware 攔截所有非公開路由的訪問 |
| FR-P1-FA-09 | 公開路由白名單：`/login`、`/register`（未來擴充）、`/api/public/**`、靜態資源 |
| FR-P1-FA-10 | 檢查 Cookie 中的 `jwt-token`：不存在或過期 → 跳轉至 `/login?redirect={currentPath}` |
| FR-P1-FA-11 | JWT Cookie 有效 → 允許訪問，並將 user 資訊注入 request headers（供 Server Components 使用） |
| FR-P1-FA-12 | Middleware 不解密 JWT（不應含 JWT Secret），僅檢查 Cookie 是否存在；實際驗證由 Gateway 處理 |

**備註：** 前端 Middleware 只做簡單的 Cookie 存在性檢查，真正的 Token 有效性驗證在 Gateway 進行。前端 API 請求若 Gateway 回傳 401，由全域 API Client 攔截並觸發跳轉。

---

### 3.3 Zustand Auth Store（P1-FA-03）

**檔案路徑：** `src/store/auth.store.ts`

| 需求編號 | 需求描述 |
|---|---|
| FR-P1-FA-13 | Auth Store 狀態：`{ user: AuthUser \| null, isAuthenticated: boolean }` |
| FR-P1-FA-14 | `AuthUser` 型別：`{ id: string, email: string, role: 'ADMIN' \| 'USER', marketMode: 'US' \| 'TW' }` |
| FR-P1-FA-15 | Actions：`login(user: AuthUser)`、`logout()`、`updatePreferences(prefs)` |
| FR-P1-FA-16 | `logout()` 動作：呼叫後端登出 API（清除 Cookie）、清空 Store、跳轉至 `/login` |
| FR-P1-FA-17 | 頁面刷新後，若 Cookie 存在，透過呼叫 `GET /users/me` 自動恢復 Store 狀態 |
| FR-P1-FA-18 | 建立 `useAuth()` 自定義 Hook，封裝 auth store 常用操作 |

**`GET /users/me` 端點（auth-service 新增）：**
- 讀取 `X-User-Id` Header 取得當前使用者
- 返回 `ApiResponse<AuthUserDto>`（含 id、email、role、marketMode）
- 用於頁面刷新後的 Session 恢復

---

## 4. 驗收標準

| 情境 | 測試步驟 | 通過條件 |
|---|---|---|
| 正常登入 | 輸入正確 email/password 並送出 | 1. Cookie 中含 `jwt-token` 2. 跳轉至 /dashboard 3. auth store user 已更新 |
| 登入失敗 | 輸入錯誤密碼送出 | 顯示錯誤訊息，停留在登入頁 |
| 未登入 Route 保護 | 未登入訪問 /dashboard | 自動跳轉至 /login?redirect=/dashboard |
| Token 過期 | JWT 過期後訪問任意 API | 前端收到 401，跳轉至登入頁 |
| 頁面刷新恢復 | 登入後刷新頁面 | auth store 自動恢復（via /users/me） |
| ADMIN 訪問使用者列表 | ADMIN 角色訪問 GET /users | 返回使用者分頁列表 |
| USER 訪問受 ADMIN 保護路徑 | USER 角色訪問 GET /users | 返回 403 Forbidden |
| 停用使用者 | ADMIN 呼叫 PATCH /users/{id}/status | 使用者狀態變更為 INACTIVE |
| 停用帳號無法登入 | 已 INACTIVE 使用者嘗試登入 | 返回含停用訊息的 403 |

---

## 5. 技術規格

| 項目 | 規格 |
|---|---|
| JWT 函式庫 | `io.jsonwebtoken:jjwt-api:0.12.x` + `jjwt-impl` + `jjwt-jackson` |
| JWT 演算法 | HS256（對稱式，Secret 至少 32 字元） |
| Cookie 設定 | `HttpOnly: true`、`Secure: true`（HTTPS 環境）、`SameSite: Strict`、`Path: /` |
| 密碼雜湊 | BCrypt，cost factor 12 |
| 表單驗證（前端） | `react-hook-form` + `zod` |
| 資料庫 | PostgreSQL `auth_db`，JPA Entity `User` → 表 `users` |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
