# FR-P2-K8S-v1.md
# Phase 2：Kubernetes 基礎設施 — 詳細功能需求

**版本：** v1.0  
**建立日期：** 2026-06-18  
**關聯統整文件：** [SA-Phase2-Integration-v1.md](./SA-Phase2-Integration-v1.md)  
**里程碑：** k8s 前置（目標：2026-08-23）  
**任務 ID：** P2-K8S-01 ~ P2-K8S-11  

---

## 1. 前提條件與原則

| 原則 | 說明 |
|---|---|
| Docker Compose 保留 | Docker Compose 繼續作為本機開發環境使用，不廢棄 |
| k8s 為 Server 部署 | k8s 為正式 Server（Production / Staging）部署環境 |
| 從 Phase 1 移植 | k8s 部署的是 Phase 1 已完成的所有服務（auth, stock, portfolio, market-data, gateway, frontend） |
| Image 版本管理 | 使用 Git SHA 作為 Docker Image Tag，不使用 `latest` |

---

## 2. k8s 叢集建立（P2-K8S-01）

### 2.1 叢集選型決策

| 選項 | 優點 | 缺點 | 建議 |
|---|---|---|---|
| GKE（Google Kubernetes Engine） | 全托管、GCP 整合、Autopilot 模式 | 費用較高 | 優先考慮 |
| EKS（AWS Elastic Kubernetes Service） | 與 AWS 整合、成熟生態系 | 設定複雜 | 備選 |
| AKS（Azure Kubernetes Service） | 與 Azure 整合 | 台灣地區延遲較高 | 備選 |
| k3s（自建，VPS） | 成本最低、完全控制 | 維運負擔、HA 需自建 | 預算有限時選擇 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-01 | 選定叢集方案並記錄決策原因（建立 ADR 文件） |
| FR-P2-K8S-02 | 至少 2 個 Worker Node（確保基本 HA） |
| FR-P2-K8S-03 | kubectl 本機設定完成，可從開發機器管理叢集 |
| FR-P2-K8S-04 | 建立 Namespace：`vstocker-prod`（生產環境）、`vstocker-staging`（暫存） |

---

## 3. Container Registry（P2-K8S-02）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-05 | 使用 GitHub Container Registry（GHCR）：`ghcr.io/{github-username}/vstocker-{service-name}` |
| FR-P2-K8S-06 | 建立 GitHub Personal Access Token（PAT），設定 `read:packages`、`write:packages` 權限 |
| FR-P2-K8S-07 | k8s 建立 `imagePullSecret`：`kubectl create secret docker-registry ghcr-secret ...` |
| FR-P2-K8S-08 | 各服務 Deployment 的 `imagePullSecrets` 引用 `ghcr-secret` |
| FR-P2-K8S-09 | GHCR Token 同時儲存於 GitHub Actions Secrets（`GHCR_TOKEN`）供 CI/CD 使用 |

---

## 4. Production-grade Dockerfile（P2-K8S-03）

各服務（auth, stock, portfolio, sector, market-data, gateway）均需要 multi-stage Dockerfile：

```dockerfile
# Stage 1: Build
FROM gradle:8-jdk21-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew :{service-name}:bootJar --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=builder /app/{service-name}/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-10 | 使用 multi-stage build，最終 Image 僅含 JRE（不含 Gradle、原始碼） |
| FR-P2-K8S-11 | 最終 Image 以非 root user 運行（安全性） |
| FR-P2-K8S-12 | 使用 `eclipse-temurin:21-jre-alpine` 作為 runtime base image（最小化大小） |
| FR-P2-K8S-13 | JVM 設定 `-XX:+UseContainerSupport` 確保正確讀取 k8s Resource Limit |
| FR-P2-K8S-14 | 前端 Next.js 使用 Node.js multi-stage Dockerfile，最終 Image 運行 `next start` |
| FR-P2-K8S-15 | 各服務 Image 大小目標：後端 < 300MB，前端 < 200MB |

---

## 5. Helm Chart 撰寫（P2-K8S-04）

### 5.1 Chart 目錄結構

```
k8s/
├── charts/
│   ├── gateway/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       ├── configmap.yaml
│   │       └── hpa.yaml
│   ├── auth-service/
│   ├── stock-service/
│   ├── portfolio-service/
│   ├── market-data-service/
│   ├── sector-service/      ← Phase 2B 新增
│   └── frontend/
├── values-prod.yaml         ← 生產環境覆蓋值
└── values-staging.yaml      ← 暫存環境覆蓋值
```

### 5.2 共用 Chart 規格

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-16 | 每個 Chart 的 `deployment.yaml` 包含：image（tag 可覆蓋）、replicas（預設 1）、resources、env、probes |
| FR-P2-K8S-17 | Resource 設定（後端服務預設值）：`requests: {cpu: 100m, memory: 256Mi}`、`limits: {cpu: 500m, memory: 512Mi}` |
| FR-P2-K8S-18 | market-data-service Resource 設定（較高）：`requests: {cpu: 200m, memory: 512Mi}`、`limits: {cpu: 1000m, memory: 1Gi}` |
| FR-P2-K8S-19 | 環境變數從 ConfigMap（非敏感）和 Secret（敏感）讀取，不在 values.yaml 中明文儲存 |
| FR-P2-K8S-20 | `values.yaml` 中 image.tag 預設為 `latest`，CI/CD 部署時覆蓋為實際 Git SHA |
| FR-P2-K8S-21 | Service 類型統一使用 `ClusterIP`（內部），不直接暴露 NodePort |

---

## 6. Nginx Ingress Controller（P2-K8S-05）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-22 | 安裝 Nginx Ingress Controller（`helm install ingress-nginx ingress-nginx/ingress-nginx`） |
| FR-P2-K8S-23 | 建立 Ingress 資源：`/api/**` 路由至 `gateway-svc`，`/**` 路由至 `frontend-svc` |
| FR-P2-K8S-24 | 設定 TLS（使用 Let's Encrypt 或 cert-manager） |
| FR-P2-K8S-25 | Ingress Annotation：`nginx.ingress.kubernetes.io/proxy-body-size: 10m`（允許上傳） |
| FR-P2-K8S-26 | Ingress Annotation：`nginx.ingress.kubernetes.io/proxy-read-timeout: 60`（SSE 支援，Phase 3 用） |

**Ingress 路由規則：**
```yaml
rules:
  - host: vstocker.example.com
    http:
      paths:
        - path: /api
          pathType: Prefix
          backend: { service: { name: gateway-svc, port: { number: 8080 } } }
        - path: /
          pathType: Prefix
          backend: { service: { name: frontend-svc, port: { number: 3000 } } }
```

---

## 7. k8s Secret 設定（P2-K8S-06）

| Secret 名稱 | 包含 Key | 說明 |
|---|---|---|
| `vstocker-jwt-secret` | `JWT_SECRET` | JWT 簽名 Secret（32+ 字元） |
| `vstocker-db-credentials` | `AUTH_DB_URL`, `AUTH_DB_USER`, `AUTH_DB_PASSWORD`, 同結構重複 5 個服務 | DB 連線資訊 |
| `vstocker-api-keys` | `ALPHA_VANTAGE_API_KEY`, `FUGLE_API_KEY`, `EXCHANGERATE_API_KEY` | 外部 API Key |
| `vstocker-ghcr` | Docker pull secret | GHCR 拉取憑證 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-27 | 所有敏感資訊（API Key、DB 密碼、JWT Secret）從 .env 遷移至 k8s Secret |
| FR-P2-K8S-28 | k8s Secret 使用 kubectl 或 Helm 建立，不儲存於版本控制 |
| FR-P2-K8S-29 | 各服務 Deployment 的 `envFrom` 或 `env.valueFrom.secretKeyRef` 引用對應 Secret |
| FR-P2-K8S-30 | .gitignore 確認所有 .env 檔案排除在版控之外 |

---

## 8. Liveness / Readiness Probe（P2-K8S-07）

各後端服務（Spring Boot）Probe 設定：

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 5
  failureThreshold: 3
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-31 | 所有後端服務加入 `spring-boot-starter-actuator` 依賴 |
| FR-P2-K8S-32 | `application.yml` 設定：`management.endpoint.health.probes.enabled: true` |
| FR-P2-K8S-33 | `management.endpoint.health.group.liveness/readiness` 正確設定 |
| FR-P2-K8S-34 | 前端 Next.js 使用 `livenessProbe: httpGet: /api/health`（自定義 Route Handler） |

---

## 9. 資料庫部署策略（P2-K8S-08, P2-K8S-09）

### 9.1 PostgreSQL（P2-K8S-08）

| 選項 | 建議 | 說明 |
|---|---|---|
| 雲端 Managed DB（GCP Cloud SQL / AWS RDS） | **優先** | 自動備份、HA、無 PVC 管理複雜度 |
| k8s StatefulSet + PVC | 備選 | 費用較低，但維運複雜 |

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-35 | 決定 PostgreSQL 部署策略並記錄（ADR） |
| FR-P2-K8S-36 | 若使用 Managed DB：建立 5 個 DB Instance（或 1 個 Instance + 5 個 Database），連線資訊存入 k8s Secret |
| FR-P2-K8S-37 | 若使用 StatefulSet：設定 PVC storageClass `ReadWriteOnce`，容量 20Gi/個 |
| FR-P2-K8S-38 | 確保 Phase 1 所有 DB Schema 和初始 Seed 資料在 k8s 環境中正確載入（Flyway Migration 自動執行） |

### 9.2 Redis（P2-K8S-09）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-39 | 部署 Redis（StatefulSet 或 Managed，與 DB 選型一致） |
| FR-P2-K8S-40 | Redis 連線設定從 k8s Secret 讀取（host、port、password） |
| FR-P2-K8S-41 | Redis 容量設定：1Gi memory limit，policy `allkeys-lru` |

---

## 10. CI/CD GitHub Actions Pipeline（P2-K8S-10）

### 10.1 Pipeline 工作流程

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]

jobs:
  build-and-push:
    steps:
      - checkout
      - setup-java
      - gradlew bootJar
      - docker build (multi-stage)
      - docker push to GHCR (tag: ${{ github.sha }})
  
  deploy:
    needs: build-and-push
    steps:
      - helm upgrade --install {service} k8s/charts/{service}
          --set image.tag=${{ github.sha }}
          --namespace vstocker-prod
```

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-42 | 建立 `.github/workflows/ci-cd.yml`，觸發條件：`push` 至 `main` 分支 |
| FR-P2-K8S-43 | CI 階段：`./gradlew build`（含單元測試），失敗則中止 Pipeline |
| FR-P2-K8S-44 | Build Docker Image：使用 `docker/build-push-action`，tag 使用 `github.sha` |
| FR-P2-K8S-45 | Push Image 至 GHCR：使用 `GHCR_TOKEN` Secret 進行 docker login |
| FR-P2-K8S-46 | Deploy 階段：`helm upgrade --install`，傳入 `--set image.tag=${{ github.sha }}` |
| FR-P2-K8S-47 | k8s 叢集存取：使用 GitHub Actions Secret `KUBE_CONFIG`（base64 encoded kubeconfig） |
| FR-P2-K8S-48 | Deploy 成功後驗證：`kubectl rollout status deployment/{service} -n vstocker-prod` |
| FR-P2-K8S-49 | Pipeline 執行時間目標：< 10 分鐘（build + push + deploy） |
| FR-P2-K8S-50 | 各服務可獨立部署（矩陣策略 matrix strategy），不必全部重建 |

---

## 11. Phase 1 服務 k8s 驗證（P2-K8S-11）

| 需求編號 | 需求描述 |
|---|---|
| FR-P2-K8S-51 | 所有 Phase 1 服務（auth, stock, portfolio, market-data, gateway, frontend）部署至 k8s 並通過 Readiness Probe |
| FR-P2-K8S-52 | 端對端測試：使用者登入 → 查詢美股 → 新增持倉 → 查看損益（在 k8s 環境完整跑通） |
| FR-P2-K8S-53 | CI/CD 自動部署驗證：Push 一個小變更至 main，確認 Pipeline 自動完成部署 |

---

## 12. 驗收標準（k8s 前置里程碑）

| 驗收項目 | 通過條件 |
|---|---|
| 叢集就緒 | `kubectl get nodes` 顯示所有 Node Ready |
| 服務部署 | `kubectl get pods -n vstocker-prod` 所有 Pod Running |
| Ingress 路由 | `https://{domain}/api/actuator/health` 返回 200 |
| CI/CD 觸發 | git push → Pipeline 完成 → Pod 版本更新（新 Git SHA） |
| DB 連線 | 所有服務啟動時 DB Migration 自動執行無錯誤 |
| 端對端測試 | 完整使用者旅程（登入→美股管理→持倉損益）在 k8s 上正常運行 |
| Secret 安全 | `git grep -r "API_KEY\|SECRET\|PASSWORD"` 無結果（確保無敏感資訊洩露） |

---

*文件版本：v1.0 ｜ 建立日期：2026-06-18*
