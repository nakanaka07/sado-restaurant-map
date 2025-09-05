#!/bin/bash
# tools/deployment/blue-green-deploy.sh
# ブルー・グリーンデプロイメント実行スクリプト

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 設定読み込み
source "$SCRIPT_DIR/deployment-config.sh"

# ロギング設定
LOG_FILE="${LOG_DIR}/deployment-$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "❌ ERROR: $1"
    exit 1
}

check_prerequisites() {
    log "📋 前提条件チェック開始"

    # Docker環境チェック
    command -v docker >/dev/null 2>&1 || error_exit "Dockerが見つかりません"
    command -v docker-compose >/dev/null 2>&1 || error_exit "Docker Composeが見つかりません"

    # 必要なファイル存在チェック
    [[ -f "$PROJECT_ROOT/docker-compose.phase3.yml" ]] || error_exit "docker-compose.phase3.yml が見つかりません"
    [[ -f "$PROJECT_ROOT/docker-compose.phase3-green.yml" ]] || error_exit "docker-compose.phase3-green.yml が見つかりません"

    # 現在の環境確認
    CURRENT_ENV=$(get_active_environment)
    log "📍 現在のアクティブ環境: $CURRENT_ENV"

    log "✅ 前提条件チェック完了"
}

get_active_environment() {
    # Nginxの現在のupstream設定から判定
    if command -v nginx >/dev/null 2>&1 && nginx -T 2>/dev/null | grep -q "server.*blue"; then
        echo "blue"
    elif command -v nginx >/dev/null 2>&1 && nginx -T 2>/dev/null | grep -q "server.*green"; then
        echo "green"
    else
        echo "unknown"
    fi
}

backup_current_state() {
    log "💾 現在の状態をバックアップ中"

    BACKUP_DIR="${BACKUP_BASE_DIR}/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Redis データバックアップ
    log "📦 Redisデータバックアップ中..."
    for i in {1..3}; do
        if docker ps --format "table {{.Names}}" | grep -q "sado-redis-master-$i"; then
            docker exec "sado-redis-master-$i" redis-cli BGSAVE
            sleep 5
            docker cp "sado-redis-master-$i:/data/dump.rdb" "$BACKUP_DIR/redis-master-$i.rdb" || log "⚠️ Redis master $i バックアップ失敗"
        fi
    done

    # 設定ファイルバックアップ
    log "📁 設定ファイルバックアップ中..."
    cp -r "$PROJECT_ROOT/config" "$BACKUP_DIR/" || log "⚠️ 設定ファイルバックアップ失敗"

    # Docker Composeファイルバックアップ
    cp "$PROJECT_ROOT/docker-compose.phase3.yml" "$BACKUP_DIR/" || log "⚠️ Docker Composeファイルバックアップ失敗"

    # Nginxの現在の設定をバックアップ
    if [[ -f "/etc/nginx/conf.d/upstream.conf" ]]; then
        cp "/etc/nginx/conf.d/upstream.conf" "$BACKUP_DIR/" || log "⚠️ Nginx設定バックアップ失敗"
    fi

    log "✅ バックアップ完了: $BACKUP_DIR"
    echo "$BACKUP_DIR" > /tmp/last_backup_dir
}

deploy_to_green() {
    log "🚀 Green環境へのデプロイ開始"

    cd "$PROJECT_ROOT"

    # Green環境停止・クリーンアップ
    log "🧹 Green環境クリーンアップ中..."
    docker-compose -f docker-compose.phase3-green.yml down -v --remove-orphans || true

    # 最新イメージPull
    log "📥 最新イメージ取得中..."
    docker-compose -f docker-compose.phase3-green.yml pull || error_exit "イメージPullに失敗"

    # Green環境起動
    log "🔄 Green環境起動中..."
    docker-compose -f docker-compose.phase3-green.yml up -d || error_exit "Green環境起動に失敗"

    log "⏳ Green環境起動完了待機中..."
    sleep "${STARTUP_WAIT_TIME:-60}"

    log "✅ Green環境デプロイ完了"
}

run_health_checks() {
    log "🏥 ヘルスチェック実行中"

    local max_attempts="${HEALTH_CHECK_MAX_ATTEMPTS:-30}"
    local attempt=1
    local wait_time="${HEALTH_CHECK_WAIT_TIME:-10}"

    while [ $attempt -le $max_attempts ]; do
        log "🔍 ヘルスチェック試行 $attempt/$max_attempts"

        local all_healthy=true

        # アプリケーションヘルスチェック
        if ! curl -f --max-time 10 "${GREEN_APP_HEALTH_URL}" >/dev/null 2>&1; then
            log "⚠️ アプリケーションヘルスチェック失敗"
            all_healthy=false
        fi

        # Redisクラスターヘルスチェック
        for i in {1..3}; do
            if ! docker exec "sado-redis-master-$i-green" redis-cli ping | grep -q PONG; then
                log "⚠️ Redis master $i ヘルスチェック失敗"
                all_healthy=false
            fi
        done

        # 全ヘルスチェック成功
        if $all_healthy; then
            log "✅ 全ヘルスチェック成功"
            return 0
        fi

        log "⏳ ヘルスチェック失敗、${wait_time}秒後に再試行..."
        sleep $wait_time
        ((attempt++))
    done

    log "❌ ヘルスチェック失敗"
    return 1
}

validate_functionality() {
    log "🔍 機能検証実行中"

    # 基本機能テスト
    local test_results=()

    # メインページアクセステスト
    if curl -f --max-time 10 "${GREEN_APP_BASE_URL}/" >/dev/null 2>&1; then
        log "✅ メインページアクセス: OK"
        test_results+=("main_page:OK")
    else
        log "❌ メインページアクセス: NG"
        test_results+=("main_page:NG")
    fi

    # APIエンドポイントテスト
    if curl -f --max-time 10 "${GREEN_APP_BASE_URL}/api/restaurants" >/dev/null 2>&1; then
        log "✅ レストランAPI: OK"
        test_results+=("restaurant_api:OK")
    else
        log "❌ レストランAPI: NG"
        test_results+=("restaurant_api:NG")
    fi

    # 検索機能テスト
    local search_response
    search_response=$(curl -f --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"寿司","location":"佐渡"}' \
        "${GREEN_APP_BASE_URL}/api/search" 2>/dev/null)

    if [[ -n "$search_response" ]]; then
        log "✅ 検索API: OK"
        test_results+=("search_api:OK")
    else
        log "❌ 検索API: NG"
        test_results+=("search_api:NG")
    fi

    # 結果評価
    local failed_tests
    failed_tests=$(printf '%s\n' "${test_results[@]}" | grep -c "NG" || true)

    if [[ $failed_tests -eq 0 ]]; then
        log "✅ 機能検証完了: 全テスト通過"
        return 0
    else
        log "❌ 機能検証失敗: $failed_tests 個のテストが失敗"
        return 1
    fi
}

switch_traffic() {
    log "🔄 トラフィック切り替え開始"

    # Nginx設定ディレクトリ確認・作成
    local nginx_conf_dir="/etc/nginx/conf.d"
    if [[ ! -d "$nginx_conf_dir" ]]; then
        log "⚠️ Nginx設定ディレクトリが存在しません: $nginx_conf_dir"
        log "🔧 Dockerコンテナ内でのNginx設定更新を試行します"

        # Dockerコンテナ内のNginx設定更新
        local nginx_container="sado-nginx"
        if docker ps --format "table {{.Names}}" | grep -q "$nginx_container"; then
            docker exec "$nginx_container" sh -c "
                cat > /etc/nginx/conf.d/upstream.conf << 'EOF'
upstream sado_app {
    server app-server-1-green:3000;
    server app-server-2-green:3000;
}
EOF
            " || error_exit "Dockerコンテナ内Nginx設定更新失敗"

            # Nginx設定テスト
            if docker exec "$nginx_container" nginx -t; then
                # Nginxリロード
                docker exec "$nginx_container" nginx -s reload
                log "✅ DockerコンテナNginxトラフィック切り替え完了"
            else
                error_exit "Nginx設定テストエラー"
            fi
        else
            log "⚠️ Nginxコンテナが見つかりません。手動設定が必要です。"
            return 1
        fi
    else
        # ホストシステムのNginx設定更新
        cat > "$nginx_conf_dir/upstream.conf" << EOF
upstream sado_app {
    server ${GREEN_APP_SERVER_1}:3000;
    server ${GREEN_APP_SERVER_2}:3000;
}
EOF

        # Nginx設定検証
        if nginx -t; then
            # Nginxリロード
            nginx -s reload
            log "✅ Nginxトラフィック切り替え完了"
        else
            error_exit "Nginx設定エラー"
        fi
    fi

    # トラフィック切り替え検証
    log "🔍 トラフィック切り替え検証中..."
    sleep 5

    local verification_attempts=5
    local successful_requests=0

    for ((i=1; i<=verification_attempts; i++)); do
        if curl -f --max-time 10 "${LOAD_BALANCER_URL}/health" >/dev/null 2>&1; then
            ((successful_requests++))
        fi
        sleep 1
    done

    if [[ $successful_requests -eq $verification_attempts ]]; then
        log "✅ トラフィック切り替え検証成功"
    else
        log "❌ トラフィック切り替え検証失敗: $successful_requests/$verification_attempts"
        return 1
    fi
}

monitor_deployment() {
    log "📊 デプロイメント監視開始"

    local monitoring_duration="${MONITORING_DURATION:-300}"  # 5分間監視
    local start_time=$(date +%s)
    local error_count=0
    local max_errors="${MAX_MONITORING_ERRORS:-3}"

    while [[ $(($(date +%s) - start_time)) -lt $monitoring_duration ]]; do
        # エラー率チェック
        local current_error_rate
        current_error_rate=$(get_error_rate)

        if (( $(echo "$current_error_rate > ${ERROR_RATE_THRESHOLD:-5.0}" | bc -l 2>/dev/null || echo "0") )); then
            ((error_count++))
            log "⚠️ エラー率閾値超過: $current_error_rate% (閾値: ${ERROR_RATE_THRESHOLD:-5.0}%)"

            if [[ $error_count -ge $max_errors ]]; then
                log "🚨 エラー率継続超過、ロールバック実行"
                rollback_deployment
                return 1
            fi
        else
            error_count=0
        fi

        # レスポンス時間チェック
        local response_time
        response_time=$(get_response_time_p95)

        if (( $(echo "$response_time > ${RESPONSE_TIME_THRESHOLD:-1000}" | bc -l 2>/dev/null || echo "0") )); then
            log "⚠️ レスポンス時間閾値超過: ${response_time}ms (閾値: ${RESPONSE_TIME_THRESHOLD:-1000}ms)"
        fi

        log "📈 監視中... エラー率: $current_error_rate%, レスポンス時間P95: ${response_time}ms"
        sleep 30
    done

    log "✅ デプロイメント監視完了"
}

get_error_rate() {
    # Prometheusからエラー率を取得（フォールバック付き）
    local error_rate
    error_rate=$(curl -s --max-time 5 "${PROMETHEUS_URL}/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" 2>/dev/null \
        | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null \
        | awk '{print $1 * 100}' 2>/dev/null) || echo "0"

    echo "${error_rate:-0}"
}

get_response_time_p95() {
    # Prometheusからレスポンス時間P95を取得（フォールバック付き）
    local response_time
    response_time=$(curl -s --max-time 5 "${PROMETHEUS_URL}/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" 2>/dev/null \
        | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null \
        | awk '{print $1 * 1000}' 2>/dev/null) || echo "0"

    echo "${response_time:-0}"
}

rollback_deployment() {
    log "🔙 ロールバック実行中"

    # 前の環境（Blue）に戻す
    local nginx_container="sado-nginx"
    if docker ps --format "table {{.Names}}" | grep -q "$nginx_container"; then
        docker exec "$nginx_container" sh -c "
            cat > /etc/nginx/conf.d/upstream.conf << 'EOF'
upstream sado_app {
    server app-server-1:3000;
    server app-server-2:3000;
}
EOF
        "
        docker exec "$nginx_container" nginx -s reload
    else
        # ホストシステムのNginx設定復元
        if [[ -f "/tmp/last_backup_dir" ]]; then
            local backup_dir
            backup_dir=$(cat /tmp/last_backup_dir)
            if [[ -f "$backup_dir/upstream.conf" ]]; then
                cp "$backup_dir/upstream.conf" "/etc/nginx/conf.d/upstream.conf"
                nginx -s reload
            fi
        fi
    fi

    # Green環境停止
    docker-compose -f docker-compose.phase3-green.yml down || log "⚠️ Green環境停止失敗"

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
現在の環境: Blue (Rollback完了)
ログファイル: $LOG_FILE"

    # Slack通知 (webhook URLが設定されている場合)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || log "⚠️ Slack通知失敗"
    fi

    # メール通知 (設定されている場合)
    if command -v mail >/dev/null 2>&1 && [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "$message" | mail -s "SADO RESTAURANT MAP - ROLLBACK EXECUTED" "$ALERT_EMAIL" || log "⚠️ メール通知失敗"
    fi

    # ログファイルに記録
    echo "$message" >> "$LOG_FILE"
}

cleanup_old_environment() {
    log "🧹 旧環境クリーンアップ"

    # 旧Blue環境停止
    docker-compose -f docker-compose.phase3.yml down -v --remove-orphans || log "⚠️ Blue環境停止失敗"

    # 未使用Dockerイメージ削除
    docker image prune -f || log "⚠️ Docker画像削除失敗"

    # 未使用ボリューム削除
    docker volume prune -f || log "⚠️ Dockerボリューム削除失敗"

    log "✅ クリーンアップ完了"
}

send_success_notification() {
    log "🎉 デプロイメント成功通知送信"

    local message="✅ DEPLOYMENT SUCCESSFUL ✅
プロジェクト: Sado Restaurant Map
時刻: $(date)
デプロイメント戦略: Blue-Green
新環境: Green
ログファイル: $LOG_FILE"

    # Slack通知
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || log "⚠️ Slack通知失敗"
    fi

    echo "$message" >> "$LOG_FILE"
}

main() {
    log "🚀 ブルー・グリーンデプロイメント開始"

    check_prerequisites
    backup_current_state
    deploy_to_green

    if run_health_checks && validate_functionality; then
        switch_traffic

        if monitor_deployment; then
            cleanup_old_environment
            send_success_notification
            log "🎉 ブルー・グリーンデプロイメント成功"
        else
            log "❌ 監視段階で問題発生"
            exit 1
        fi
    else
        log "❌ ヘルスチェックまたは機能検証失敗"
        exit 1
    fi
}

# スクリプト実行
main "$@"
