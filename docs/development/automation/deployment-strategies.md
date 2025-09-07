# デプロイメント戦略設定

## 概要

Phase 3-Full 本格運用環境における各種デプロイメント戦略の詳細設定です。

## 1. ブルー・グリーンデプロイメント (推奨)

### 特徴

- ゼロダウンタイムデプロイ
- 即座のロールバック可能
- 完全な環境分離

### 実装

```yaml
# deployment/blue-green-config.yml
blue_green_deployment:
  environments:
    blue:
      compose_file: docker-compose.phase3-blue.yml
      nginx_config: nginx-blue.conf
      health_check_url: http://blue.sado-restaurant.local/health
    green:
      compose_file: docker-compose.phase3-green.yml
      nginx_config: nginx-green.conf
      health_check_url: http://green.sado-restaurant.local/health

  deployment_process:
    1_pre_deployment:
      - validate_environment
      - backup_current_state
      - prepare_green_environment

    2_deployment:
      - deploy_to_green
      - run_health_checks
      - validate_functionality

    3_traffic_switch:
      - update_nginx_upstream
      - switch_dns_records
      - monitor_traffic

    4_post_deployment:
      - verify_metrics
      - cleanup_blue_environment
      - update_monitoring

  rollback_strategy:
    trigger_conditions:
      - error_rate_threshold: >5%
      - response_time_p95: >1000ms
      - health_check_failures: >3

    rollback_steps:
      - switch_traffic_to_blue
      - stop_green_environment
      - alert_operations_team
```

### 実装スクリプト

```bash
#!/bin/bash
# tools/deployment/blue-green-deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 設定読み込み
source "$SCRIPT_DIR/deployment-config.sh"

# ロギング設定
LOG_FILE="/var/log/sado-restaurant/deployment.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_prerequisites() {
    log "📋 前提条件チェック開始"

    # Docker環境チェック
    if ! command -v docker &> /dev/null; then
        log "❌ Dockerが見つかりません"
        exit 1
    fi

    # Docker Composeチェック
    if ! command -v docker-compose &> /dev/null; then
        log "❌ Docker Composeが見つかりません"
        exit 1
    fi

    # 現在の環境確認
    CURRENT_ENV=$(get_active_environment)
    log "📍 現在のアクティブ環境: $CURRENT_ENV"

    log "✅ 前提条件チェック完了"
}

get_active_environment() {
    # Nginxの現在のupstream設定から判定
    if nginx -T 2>/dev/null | grep -q "server blue"; then
        echo "blue"
    elif nginx -T 2>/dev/null | grep -q "server green"; then
        echo "green"
    else
        echo "unknown"
    fi
}

backup_current_state() {
    log "💾 現在の状態をバックアップ中"

    BACKUP_DIR="/var/backups/sado-restaurant/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Redis データバックアップ
    docker exec sado-redis-master-1 redis-cli --rdb "$BACKUP_DIR/redis-master-1.rdb"
    docker exec sado-redis-master-2 redis-cli --rdb "$BACKUP_DIR/redis-master-2.rdb"
    docker exec sado-redis-master-3 redis-cli --rdb "$BACKUP_DIR/redis-master-3.rdb"

    # 設定ファイルバックアップ
    cp -r "$PROJECT_ROOT/config" "$BACKUP_DIR/"

    # Docker Composeファイルバックアップ
    cp "$PROJECT_ROOT/docker-compose.phase3.yml" "$BACKUP_DIR/"

    log "✅ バックアップ完了: $BACKUP_DIR"
}

deploy_to_green() {
    log "🚀 Green環境へのデプロイ開始"

    cd "$PROJECT_ROOT"

    # Green環境停止・クリーンアップ
    docker-compose -f docker-compose.phase3-green.yml down -v || true

    # 最新イメージPull
    docker-compose -f docker-compose.phase3-green.yml pull

    # Green環境起動
    docker-compose -f docker-compose.phase3-green.yml up -d

    log "⏳ Green環境起動完了待機中..."
    sleep 30

    log "✅ Green環境デプロイ完了"
}

run_health_checks() {
    log "🏥 ヘルスチェック実行中"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "🔍 ヘルスチェック試行 $attempt/$max_attempts"

        # アプリケーションヘルスチェック
        if curl -f "http://green.sado-restaurant.local/health" > /dev/null 2>&1; then
            log "✅ アプリケーションヘルスチェック成功"

            # Redisヘルスチェック
            if docker exec sado-redis-master-1-green redis-cli ping | grep -q PONG; then
                log "✅ Redisヘルスチェック成功"
                return 0
            fi
        fi

        log "⏳ ヘルスチェック失敗、10秒後に再試行..."
        sleep 10
        ((attempt++))
    done

    log "❌ ヘルスチェック失敗"
    return 1
}

switch_traffic() {
    log "🔄 トラフィック切り替え開始"

    # Nginxの設定を変更してGreenに切り替え
    cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream sado_app {
    server green.sado-restaurant.local:3001;
    server green.sado-restaurant.local:3002;
}
EOF

    # Nginx設定検証
    if nginx -t; then
        # Nginxリロード
        nginx -s reload
        log "✅ Nginxトラフィック切り替え完了"
    else
        log "❌ Nginx設定エラー"
        return 1
    fi

    # トラフィック切り替え検証
    sleep 5
    if curl -f "http://sado-restaurant.local/health" > /dev/null 2>&1; then
        log "✅ トラフィック切り替え検証成功"
    else
        log "❌ トラフィック切り替え検証失敗"
        return 1
    fi
}

monitor_deployment() {
    log "📊 デプロイメント監視開始"

    local monitoring_duration=300  # 5分間監視
    local start_time=$(date +%s)
    local error_count=0

    while [ $(($(date +%s) - start_time)) -lt $monitoring_duration ]; do
        # エラー率チェック
        local current_error_rate=$(get_error_rate)
        if (( $(echo "$current_error_rate > 5.0" | bc -l) )); then
            ((error_count++))
            log "⚠️ エラー率閾値超過: $current_error_rate%"

            if [ $error_count -ge 3 ]; then
                log "🚨 エラー率継続超過、ロールバック実行"
                rollback_deployment
                return 1
            fi
        else
            error_count=0
        fi

        # レスポンス時間チェック
        local response_time=$(get_response_time_p95)
        if (( $(echo "$response_time > 1000" | bc -l) )); then
            log "⚠️ レスポンス時間閾値超過: ${response_time}ms"
        fi

        sleep 30
    done

    log "✅ デプロイメント監視完了"
}

get_error_rate() {
    # Prometheusからエラー率を取得
    curl -s "http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" \
        | jq -r '.data.result[0].value[1] // "0"' \
        | awk '{print $1 * 100}'
}

get_response_time_p95() {
    # Prometheusからレスポンス時間P95を取得
    curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" \
        | jq -r '.data.result[0].value[1] // "0"' \
        | awk '{print $1 * 1000}'
}

rollback_deployment() {
    log "🔙 ロールバック実行中"

    # Blueに戻す
    cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream sado_app {
    server blue.sado-restaurant.local:3001;
    server blue.sado-restaurant.local:3002;
}
EOF

    nginx -s reload

    # Green環境停止
    docker-compose -f docker-compose.phase3-green.yml down

    log "✅ ロールバック完了"

    # アラート送信
    send_rollback_alert
}

send_rollback_alert() {
    log "🚨 ロールバックアラート送信"

    local message="🚨 ROLLBACK EXECUTED 🚨
プロジェクト: Sado Restaurant Map
時刻: $(date)
理由: エラー率またはレスポンス時間の閾値超過
現在の環境: Blue (Rollback完了)"

    # Slack通知 (webhook URLが設定されている場合)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    # メール通知 (設定されている場合)
    if command -v mail &> /dev/null && [ -n "${ALERT_EMAIL:-}" ]; then
        echo "$message" | mail -s "SADO RESTAURANT MAP - ROLLBACK EXECUTED" "$ALERT_EMAIL"
    fi
}

cleanup_old_environment() {
    log "🧹 旧環境クリーンアップ"

    # 旧Blue環境停止
    docker-compose -f docker-compose.phase3-blue.yml down -v

    # 未使用Dockerイメージ削除
    docker image prune -f

    log "✅ クリーンアップ完了"
}

main() {
    log "🚀 ブルー・グリーンデプロイメント開始"

    check_prerequisites
    backup_current_state
    deploy_to_green

    if run_health_checks; then
        switch_traffic

        if monitor_deployment; then
            cleanup_old_environment
            log "🎉 ブルー・グリーンデプロイメント成功"
        else
            log "❌ 監視段階で問題発生"
            exit 1
        fi
    else
        log "❌ ヘルスチェック失敗"
        exit 1
    fi
}

# スクリプト実行
main "$@"
```

## 2. カナリアデプロイメント

### 特徴

- 段階的なトラフィック移行
- リスク最小化
- A/B テスト対応

### 設定

```yaml
# deployment/canary-config.yml
canary_deployment:
  traffic_split:
    phase_1: { production: 95%, canary: 5% }
    phase_2: { production: 80%, canary: 20% }
    phase_3: { production: 50%, canary: 50% }
    phase_4: { production: 0%, canary: 100% }

  phase_duration: 600 # 10分

  success_criteria:
    error_rate_threshold: 1.0 # 1%
    response_time_p95: 500 # 500ms
    user_satisfaction: 4.0 # 5点満点中4.0点以上

  rollback_triggers:
    - error_rate_spike: >10
    - response_time_spike: >2
    - user_complaints: >5
```

## 3. ローリングアップデート

### 特徴

- 1 つずつインスタンス更新
- 最小リソース使用
- 段階的リスク軽減

### 設定

```yaml
# deployment/rolling-config.yml
rolling_deployment:
  strategy:
    max_surge: 1 # 同時に追加できるインスタンス数
    max_unavailable: 0 # 同時に停止できるインスタンス数

  update_sequence:
    - app-server-1
    - app-server-2
    - celery-worker

  health_check:
    interval: 30s
    timeout: 10s
    retries: 3

  rollback_policy:
    automatic: true
    conditions:
      - health_check_failure: 3
      - deployment_timeout: 1800s # 30分
```

## 4. 共通設定

### 監視・アラート

```yaml
# deployment/monitoring-config.yml
deployment_monitoring:
  metrics:
    - name: error_rate
      query: 'rate(http_requests_total{status=~"5.."}[5m])'
      threshold: 5.0
      unit: percentage

    - name: response_time_p95
      query: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
      threshold: 0.5
      unit: seconds

    - name: cpu_usage
      query: "rate(cpu_usage_total[5m])"
      threshold: 80.0
      unit: percentage

    - name: memory_usage
      query: "memory_usage_bytes / memory_total_bytes * 100"
      threshold: 85.0
      unit: percentage

  alerting:
    channels:
      - slack: "#deployments"
      - email: "ops@sado-restaurant.com"
      - pagerduty: "deployment-alerts"

    escalation:
      - level: warning
        after: 2m
      - level: critical
        after: 5m
      - level: emergency
        after: 10m

  dashboards:
    grafana:
      - deployment-overview
      - application-metrics
      - infrastructure-metrics
      - business-metrics
```

### セキュリティ設定

```yaml
# deployment/security-config.yml
deployment_security:
  image_scanning:
    enabled: true
    severity_threshold: medium
    fail_on_critical: true

  secret_management:
    provider: kubernetes_secrets
    rotation_interval: 90d

  network_policies:
    ingress:
      - from_nginx_ingress
      - from_monitoring
    egress:
      - to_redis_cluster
      - to_external_apis

  rbac:
    deployment_role:
      permissions:
        - deployments.create
        - deployments.update
        - deployments.delete
        - pods.get
        - pods.list
        - services.update
```

## 5. 運用手順

### デプロイメント前チェックリスト

- [ ] バックアップ完了確認
- [ ] 依存関係更新確認
- [ ] セキュリティスキャン完了
- [ ] テスト実行完了
- [ ] 監視システム正常稼働
- [ ] ロールバック計画確認
- [ ] 関係者への通知完了

### デプロイメント後検証

- [ ] アプリケーションヘルスチェック
- [ ] パフォーマンス指標確認
- [ ] ログ出力正常性確認
- [ ] 監視アラート設定確認
- [ ] ユーザー機能テスト実行
- [ ] データ整合性確認

### 緊急時対応

1. **即座のロールバック条件**

   - エラー率 > 10%
   - レスポンス時間 > 5 秒
   - サービス停止

2. **エスカレーション手順**

   - L1: 自動ロールバック実行
   - L2: 運用チーム通知
   - L3: 開発チーム通知
   - L4: 経営層通知

3. **復旧後の対応**
   - 根本原因分析
   - 再発防止策策定
   - 運用手順見直し
   - ポストモーテム実施
