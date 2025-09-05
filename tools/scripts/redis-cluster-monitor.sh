#!/bin/bash
# Redis Cluster 自動復旧スクリプト
# 佐渡飲食店マップ - Redis Cluster Auto Recovery

set -e

# 設定
REDIS_NODES=(
    "redis-master-1:7001"
    "redis-master-2:7002"
    "redis-master-3:7003"
    "redis-replica-1:7004"
    "redis-replica-2:7005"
    "redis-replica-3:7006"
)

REDIS_PASSWORD="sado_redis_2025"
CHECK_INTERVAL=30  # 30秒間隔でチェック
MAX_RETRIES=3
LOG_FILE="/var/log/redis-cluster-monitor.log"

# ログ関数
log_with_timestamp() {
    local level=$1
    local message=$2
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $message" | tee -a "$LOG_FILE"
}

# Redis CLIヘルパー
redis_cli_cmd() {
    local host_port=$1
    local cmd=$2
    timeout 10 redis-cli -h ${host_port%:*} -p ${host_port#*:} -a "$REDIS_PASSWORD" --no-auth-warning $cmd 2>/dev/null
}

# ノード健全性チェック
check_node_health() {
    local node=$1
    local retry_count=0

    while [ $retry_count -lt $MAX_RETRIES ]; do
        if redis_cli_cmd "$node" "ping" | grep -q "PONG"; then
            return 0
        fi
        ((retry_count++))
        sleep 5
    done

    return 1
}

# クラスター状態チェック
check_cluster_health() {
    local healthy_nodes=0
    local total_nodes=${#REDIS_NODES[@]}

    for node in "${REDIS_NODES[@]}"; do
        if check_node_health "$node"; then
            ((healthy_nodes++))
        else
            log_with_timestamp "ERROR" "ノード $node が応答しません"
        fi
    done

    local health_percentage=$((healthy_nodes * 100 / total_nodes))
    log_with_timestamp "INFO" "クラスター健全性: $healthy_nodes/$total_nodes ノード稼働中 ($health_percentage%)"

    # 最低限の可用性チェック（過半数が稼働している必要）
    if [ $healthy_nodes -lt $((total_nodes / 2 + 1)) ]; then
        log_with_timestamp "CRITICAL" "クラスターの過半数のノードが停止しています"
        return 1
    fi

    return 0
}

# スプリットブレイン検出
detect_split_brain() {
    local master_count=0

    for node in "${REDIS_NODES[@]:0:3}"; do  # マスターノードのみチェック
        if check_node_health "$node"; then
            local role=$(redis_cli_cmd "$node" "INFO replication" | grep "role:" | cut -d: -f2 | tr -d '\r')
            if [ "$role" = "master" ]; then
                ((master_count++))
            fi
        fi
    done

    if [ $master_count -ne 3 ]; then
        log_with_timestamp "WARNING" "期待されるマスター数と異なります (期待: 3, 実際: $master_count)"
        return 1
    fi

    return 0
}

# 自動フェイルオーバーの実行
trigger_failover() {
    local failed_master=$1
    log_with_timestamp "INFO" "ノード $failed_master の自動フェイルオーバーを開始"

    # 対応するレプリカを探す
    for replica in "${REDIS_NODES[@]:3:3}"; do  # レプリカノードをチェック
        if check_node_health "$replica"; then
            local master_id=$(redis_cli_cmd "$replica" "INFO replication" | grep "master_host:" | cut -d: -f2 | tr -d '\r')
            local master_port=$(redis_cli_cmd "$replica" "INFO replication" | grep "master_port:" | cut -d: -f2 | tr -d '\r')

            if [ "$master_id:$master_port" = "$failed_master" ]; then
                log_with_timestamp "INFO" "レプリカ $replica でフェイルオーバーを実行"
                if redis_cli_cmd "$replica" "CLUSTER FAILOVER FORCE"; then
                    log_with_timestamp "SUCCESS" "フェイルオーバーが成功しました"
                    return 0
                fi
            fi
        fi
    done

    log_with_timestamp "ERROR" "適切なレプリカが見つからず、フェイルオーバーに失敗しました"
    return 1
}

# クラスターの修復
repair_cluster() {
    log_with_timestamp "INFO" "クラスター修復を開始"

    # 利用可能なマスターノードを探す
    local available_master=""
    for node in "${REDIS_NODES[@]:0:3}"; do
        if check_node_health "$node"; then
            available_master=$node
            break
        fi
    done

    if [ -z "$available_master" ]; then
        log_with_timestamp "CRITICAL" "利用可能なマスターノードがありません"
        return 1
    fi

    # クラスター状態をチェックし、必要に応じて修復
    if ! redis_cli_cmd "$available_master" "CLUSTER INFO" | grep -q "cluster_state:ok"; then
        log_with_timestamp "INFO" "クラスター状態が不正です。修復を試行します"

        # クラスター修復コマンド実行
        if redis-cli --cluster fix "$available_master" -a "$REDIS_PASSWORD" --no-auth-warning --cluster-yes; then
            log_with_timestamp "SUCCESS" "クラスター修復が完了しました"
        else
            log_with_timestamp "ERROR" "クラスター修復に失敗しました"
            return 1
        fi
    fi

    return 0
}

# アラート通知
send_alert() {
    local level=$1
    local message=$2

    log_with_timestamp "$level" "ALERT: $message"

    # Slack通知、メール送信などをここに実装
    # 例: curl -X POST -H 'Content-type: application/json' --data '{"text":"Redis Cluster Alert: '$message'"}' $SLACK_WEBHOOK_URL
}

# メイン監視ループ
monitor_cluster() {
    log_with_timestamp "INFO" "Redis Cluster 監視を開始します（チェック間隔: ${CHECK_INTERVAL}秒）"

    while true; do
        if check_cluster_health; then
            if ! detect_split_brain; then
                send_alert "WARNING" "スプリットブレインの可能性があります"
            fi
        else
            send_alert "CRITICAL" "クラスターの健全性に問題があります"

            # 自動復旧の試行
            if repair_cluster; then
                send_alert "INFO" "クラスターの自動復旧が成功しました"
            else
                send_alert "CRITICAL" "クラスターの自動復旧に失敗しました。手動対応が必要です"
            fi
        fi

        sleep $CHECK_INTERVAL
    done
}

# 使用方法表示
show_usage() {
    echo "Usage: $0 [monitor|check|repair|help]"
    echo "  monitor - 継続的な監視を開始"
    echo "  check   - 一回だけ健全性チェック"
    echo "  repair  - クラスター修復を実行"
    echo "  help    - このヘルプを表示"
}

# メイン処理
case "${1:-monitor}" in
    "monitor")
        monitor_cluster
        ;;
    "check")
        if check_cluster_health && detect_split_brain; then
            log_with_timestamp "SUCCESS" "クラスターは正常に動作しています"
            exit 0
        else
            log_with_timestamp "ERROR" "クラスターに問題があります"
            exit 1
        fi
        ;;
    "repair")
        repair_cluster
        ;;
    "help")
        show_usage
        ;;
    *)
        echo "無効なオプション: $1"
        show_usage
        exit 1
        ;;
esac
