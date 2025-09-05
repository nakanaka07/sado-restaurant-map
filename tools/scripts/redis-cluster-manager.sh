#!/bin/bash
# Redis Cluster 初期化・管理スクリプト
# 佐渡飲食店マップ - Redis Cluster Operations

set -e

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Redis ノード設定
REDIS_NODES=(
    "redis-master-1:7001"
    "redis-master-2:7002"
    "redis-master-3:7003"
    "redis-replica-1:7004"
    "redis-replica-2:7005"
    "redis-replica-3:7006"
)

REDIS_PASSWORD="sado_redis_2025"

# Redis CLIコマンドのヘルパー関数
redis_cli_cmd() {
    local host_port=$1
    local cmd=$2
    redis-cli -h ${host_port%:*} -p ${host_port#*:} -a "$REDIS_PASSWORD" --no-auth-warning $cmd
}

# ノードの生存確認
check_nodes_health() {
    log_info "Redis ノードの健全性をチェック中..."

    local failed_nodes=0
    for node in "${REDIS_NODES[@]}"; do
        if redis_cli_cmd "$node" "ping" >/dev/null 2>&1; then
            log_success "✓ $node: OK"
        else
            log_error "✗ $node: FAILED"
            ((failed_nodes++))
        fi
    done

    if [ $failed_nodes -eq 0 ]; then
        log_success "全ての Redis ノードが正常に動作しています"
        return 0
    else
        log_error "$failed_nodes 個のノードに問題があります"
        return 1
    fi
}

# クラスター初期化
initialize_cluster() {
    log_info "Redis Cluster を初期化中..."

    # ノードの健全性チェック
    if ! check_nodes_health; then
        log_error "ノードに問題があるため、クラスター初期化を中止します"
        exit 1
    fi

    # 既存のクラスター設定をリセット
    log_info "既存のクラスター設定をリセット中..."
    for node in "${REDIS_NODES[@]}"; do
        redis_cli_cmd "$node" "CLUSTER RESET HARD" >/dev/null 2>&1 || true
        redis_cli_cmd "$node" "FLUSHALL" >/dev/null 2>&1 || true
    done

    sleep 5

    # クラスター作成
    log_info "新しいクラスターを作成中..."
    redis-cli --cluster create \
        ${REDIS_NODES[0]} ${REDIS_NODES[1]} ${REDIS_NODES[2]} \
        ${REDIS_NODES[3]} ${REDIS_NODES[4]} ${REDIS_NODES[5]} \
        --cluster-replicas 1 \
        --cluster-yes \
        -a "$REDIS_PASSWORD" \
        --no-auth-warning

    if [ $? -eq 0 ]; then
        log_success "Redis Cluster の初期化が完了しました"
    else
        log_error "Redis Cluster の初期化に失敗しました"
        exit 1
    fi
}

# クラスター状態確認
check_cluster_status() {
    log_info "Redis Cluster の状態をチェック中..."

    local master_node="${REDIS_NODES[0]}"

    echo "=== クラスター情報 ==="
    redis_cli_cmd "$master_node" "CLUSTER INFO"

    echo -e "\n=== ノード一覧 ==="
    redis_cli_cmd "$master_node" "CLUSTER NODES"

    echo -e "\n=== スロット分散状況 ==="
    redis-cli --cluster check "$master_node" -a "$REDIS_PASSWORD" --no-auth-warning
}

# フェイルオーバーテスト
test_failover() {
    local target_node=$1
    log_info "ノード $target_node のフェイルオーバーテストを実行中..."

    # マスターノードを特定
    local master_nodes=$(redis_cli_cmd "${REDIS_NODES[0]}" "CLUSTER NODES" | grep "master" | awk '{print $2}')

    if echo "$master_nodes" | grep -q "$target_node"; then
        log_info "$target_node はマスターノードです。フェイルオーバーを実行します..."

        # 対応するレプリカノードを探す
        local replica_node=$(redis_cli_cmd "${REDIS_NODES[0]}" "CLUSTER NODES" | grep "slave" | grep "$target_node" | awk '{print $2}' | head -1)

        if [ -n "$replica_node" ]; then
            log_info "レプリカノード $replica_node にフェイルオーバーを実行..."
            redis_cli_cmd "$replica_node" "CLUSTER FAILOVER"

            sleep 10
            log_success "フェイルオーバーが完了しました"
            check_cluster_status
        else
            log_error "対応するレプリカノードが見つかりません"
        fi
    else
        log_warning "$target_node はマスターノードではありません"
    fi
}

# データ分散テスト
test_data_distribution() {
    log_info "データ分散テストを実行中..."

    local master_node="${REDIS_NODES[0]}"

    # テストデータを挿入
    for i in {1..1000}; do
        redis_cli_cmd "$master_node" "SET test_key_$i test_value_$i" >/dev/null
    done

    log_info "1000個のテストキーを挿入しました"

    # 各ノードのキー数を確認
    echo "=== 各ノードのキー分散状況 ==="
    for node in "${REDIS_NODES[@]}"; do
        local role=$(redis_cli_cmd "$node" "INFO replication" | grep "role:" | cut -d: -f2 | tr -d '\r')
        local key_count=$(redis_cli_cmd "$node" "DBSIZE")
        echo "$node [$role]: $key_count keys"
    done

    # テストデータをクリーンアップ
    log_info "テストデータをクリーンアップ中..."
    for i in {1..1000}; do
        redis_cli_cmd "$master_node" "DEL test_key_$i" >/dev/null
    done

    log_success "データ分散テストが完了しました"
}

# パフォーマンステスト
performance_test() {
    log_info "Redis Cluster パフォーマンステストを実行中..."

    local master_node="${REDIS_NODES[0]}"

    echo "=== 書き込みパフォーマンステスト ==="
    redis-cli --cluster call "$master_node" -a "$REDIS_PASSWORD" --no-auth-warning \
        --latency-history -i 1 &

    local latency_pid=$!

    # ベンチマークテスト実行
    redis-benchmark -h ${master_node%:*} -p ${master_node#*:} -a "$REDIS_PASSWORD" \
        -n 10000 -c 50 -d 1024 -t set,get --cluster

    kill $latency_pid 2>/dev/null || true

    log_success "パフォーマンステストが完了しました"
}

# メニュー表示
show_menu() {
    echo "=================================="
    echo "  Redis Cluster 管理スクリプト"
    echo "=================================="
    echo "1. ノード健全性チェック"
    echo "2. クラスター初期化"
    echo "3. クラスター状態確認"
    echo "4. フェイルオーバーテスト"
    echo "5. データ分散テスト"
    echo "6. パフォーマンステスト"
    echo "7. 全機能テスト実行"
    echo "8. 終了"
    echo "=================================="
}

# 全機能テスト
run_all_tests() {
    log_info "全機能テストを開始します..."

    check_nodes_health
    check_cluster_status
    test_data_distribution
    performance_test

    log_success "全機能テストが完了しました"
}

# メイン処理
main() {
    if [ $# -eq 0 ]; then
        # インタラクティブモード
        while true; do
            show_menu
            read -p "選択してください (1-8): " choice

            case $choice in
                1) check_nodes_health ;;
                2) initialize_cluster ;;
                3) check_cluster_status ;;
                4)
                    echo "フェイルオーバーテスト対象ノード:"
                    for i in "${!REDIS_NODES[@]}"; do
                        echo "$((i+1)). ${REDIS_NODES[$i]}"
                    done
                    read -p "ノード番号を選択 (1-6): " node_num
                    if [ "$node_num" -ge 1 ] && [ "$node_num" -le 6 ]; then
                        test_failover "${REDIS_NODES[$((node_num-1))]}"
                    else
                        log_error "無効なノード番号です"
                    fi
                    ;;
                5) test_data_distribution ;;
                6) performance_test ;;
                7) run_all_tests ;;
                8) log_info "終了します"; exit 0 ;;
                *) log_error "無効な選択です" ;;
            esac

            echo
            read -p "続行するには Enter キーを押してください..."
            clear
        done
    else
        # コマンドラインモード
        case $1 in
            "health") check_nodes_health ;;
            "init") initialize_cluster ;;
            "status") check_cluster_status ;;
            "failover") test_failover "$2" ;;
            "distribution") test_data_distribution ;;
            "performance") performance_test ;;
            "all") run_all_tests ;;
            *)
                echo "使用方法: $0 [health|init|status|failover <node>|distribution|performance|all]"
                exit 1
                ;;
        esac
    fi
}

# スクリプト実行
main "$@"
