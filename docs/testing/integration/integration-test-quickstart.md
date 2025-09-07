# 🚀 Phase 3-Full 統合テスト環境 クイックスタートガイド

## 📋 前提条件

1. **Docker Desktop 起動済み**

   - タスクトレイの Docker アイコンが緑色
   - `docker info` コマンドが正常実行可能

2. **必要な環境変数**

   ```bash
   GOOGLE_MAPS_API_KEY=your_api_key_here  # オプション（テスト用はダミー値可）
   ```

## 🏃‍♂️ クイックスタート手順

### 1. 統合テスト環境起動

```powershell
# 統合テスト環境を起動
docker-compose -f docker-compose.integration.yml up -d

# 起動状況確認
docker-compose -f docker-compose.integration.yml ps
```

### 2. サービス起動確認（約 3-5 分）

```powershell
# Redis Cluster初期化完了確認
docker logs sado-redis-cluster-init-integration

# Celery Worker起動確認
docker logs sado-celery-worker-high-integration

# アプリケーションサーバー確認
docker logs sado-app-integration
```

### 3. 基本ヘルスチェック

```powershell
# アプリケーションヘルスチェック
curl http://localhost:3001/health

# Redis Cluster状況確認
docker exec sado-redis-master-1-integration redis-cli -p 7001 cluster info

# Celery Worker状況確認
docker exec sado-celery-worker-high-integration celery -A tools.scraper.shared.celery_config inspect ping
```

### 4. 分散処理テスト実行

```powershell
# 分散処理テストスクリプト実行
python test_distributed_processing.py
```

### 5. 監視ダッシュボードアクセス

| サービス       | URL                   | 用途                 |
| -------------- | --------------------- | -------------------- |
| **Grafana**    | http://localhost:3000 | メトリクス可視化     |
| **Prometheus** | http://localhost:9090 | メトリクス収集       |
| **Locust**     | http://localhost:8089 | 負荷テスト           |
| **SonarQube**  | http://localhost:9000 | セキュリティスキャン |
| **Kibana**     | http://localhost:5601 | ログ分析             |

**ログイン情報:**

- Grafana: `admin` / `integration123`
- SonarQube: `admin` / `admin`（初回設定必要）

## 🧪 テストシナリオ実行

### A. 基本統合テスト

```powershell
# 統合テストランナー実行（自動）
docker logs sado-integration-test-runner -f
```

### B. 負荷テスト

```powershell
# Locust Web UI開始
# http://localhost:8089 にアクセス
# Host: http://app-server-integration:3000
# Users: 10, Spawn rate: 2
```

### C. パフォーマンステスト

```powershell
# Redis性能確認
docker exec sado-redis-master-1-integration redis-cli -p 7001 --latency-history -i 1

# Celery タスク処理性能確認
python -c "
from tools.scraper.shared.celery_config import health_check
result = health_check.delay()
print(f'Task ID: {result.id}')
print(f'Result: {result.get(timeout=10)}')
"
```

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### 1. Redis Cluster が初期化されない

```powershell
# 手動初期化
docker exec sado-redis-master-1-integration redis-cli --cluster create \
  redis-master-1:7001 redis-master-2:7002 redis-master-3:7003 \
  --cluster-replicas 0 --cluster-yes
```

#### 2. Celery Worker が起動しない

```powershell
# Worker ログ確認
docker logs sado-celery-worker-high-integration

# 手動Worker起動テスト
docker exec sado-celery-worker-high-integration \
  celery -A tools.scraper.shared.celery_config worker --loglevel=debug
```

#### 3. アプリケーションサーバーエラー

```powershell
# アプリケーションログ確認
docker logs sado-app-integration

# 依存関係確認
docker exec sado-app-integration npm list
```

#### 4. メモリ不足

```powershell
# Docker使用状況確認
docker system df
docker stats

# 不要コンテナ削除
docker container prune
docker image prune
```

## 📊 監視とメトリクス

### 重要なメトリクス

1. **Redis Cluster**

   - キャッシュヒット率: >80%
   - 平均レスポンス時間: <1ms
   - メモリ使用率: <80%

2. **Celery Workers**

   - タスク処理速度: >10 tasks/sec
   - エラー率: <1%
   - キュー待機時間: <100ms

3. **アプリケーション**
   - レスポンス時間: <500ms
   - エラー率: <1%
   - 同時接続数: >50

### アラート閾値

```yaml
# Prometheus alerting rules
groups:
  - name: sado_integration_alerts
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8

      - alert: CeleryTaskBacklog
        expr: celery_task_queue_length > 100
```

## 🏁 環境停止

```powershell
# 統合テスト環境停止
docker-compose -f docker-compose.integration.yml down

# データ保持して停止
docker-compose -f docker-compose.integration.yml stop

# 完全削除（データも含む）
docker-compose -f docker-compose.integration.yml down -v --remove-orphans
```

## 📈 期待される結果

### 成功基準

| 項目               | 基準値         | 確認方法            |
| ------------------ | -------------- | ------------------- |
| **全サービス起動** | 15/15 サービス | `docker-compose ps` |
| **Redis Cluster**  | 3 ノード健全   | cluster info        |
| **Celery Workers** | 2 ワーカー稼働 | celery inspect      |
| **基本レスポンス** | <500ms         | curl 測定           |
| **負荷テスト**     | エラー率<1%    | Locust 結果         |

### パフォーマンス目標

- **同時ユーザー**: 50 人
- **リクエスト/秒**: 100 req/s
- **レスポンス時間**: 平均 200ms、95%ile 500ms
- **エラー率**: <1%
- **稼働率**: >99.9%

---

**🎉 Phase 3-Full 統合テスト環境が正常に稼働すれば、本格運用に向けた準備完了です！**
