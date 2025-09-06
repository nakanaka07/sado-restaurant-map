#!/bin/bash

# ==========================================
# Production Health Check Script
# 佐渡飲食店マップ Phase 3-Full ヘルスチェック
# ==========================================

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HEALTH_REPORT="logs/health-check-$(date '+%Y%m%d-%H%M%S').json"

echo "🏥 佐渡飲食店マップ Phase 3-Full ヘルスチェック開始"
echo "時刻: $TIMESTAMP"

# JSON出力初期化
echo "{" > $HEALTH_REPORT
echo "  \"timestamp\": \"$TIMESTAMP\"," >> $HEALTH_REPORT
echo "  \"services\": {" >> $HEALTH_REPORT

# サービス一覧
SERVICES=(
    "sado-redis-master-1-prod:Redis Master 1"
    "sado-redis-master-2-prod:Redis Master 2"
    "sado-redis-master-3-prod:Redis Master 3"
    "sado-redis-replica-1-prod:Redis Replica 1"
    "sado-redis-replica-2-prod:Redis Replica 2"
    "sado-redis-replica-3-prod:Redis Replica 3"
    "sado-celery-worker-high-prod:Celery Worker High"
    "sado-celery-worker-normal-prod:Celery Worker Normal"
    "sado-frontend-prod:Frontend"
    "sado-api-server-prod:API Server"
    "sado-prometheus-prod:Prometheus"
    "sado-grafana-prod:Grafana"
    "sado-redis-exporter-prod:Redis Exporter"
)

TOTAL_SERVICES=${#SERVICES[@]}
HEALTHY_SERVICES=0

# 各サービスのヘルスチェック
for i in "${!SERVICES[@]}"; do
    IFS=':' read -r CONTAINER_NAME SERVICE_NAME <<< "${SERVICES[$i]}"

    echo "🔍 $SERVICE_NAME ($CONTAINER_NAME) チェック中..."

    # コンテナ存在確認
    if docker ps --format "table {{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        CONTAINER_STATUS="running"

        # ヘルスチェック実行
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo "no-healthcheck")

        if [ "$HEALTH_STATUS" = "healthy" ] || [ "$HEALTH_STATUS" = "no-healthcheck" ]; then
            if [ "$HEALTH_STATUS" = "no-healthcheck" ]; then
                # 簡易ヘルスチェック
                if docker exec $CONTAINER_NAME ps aux > /dev/null 2>&1; then
                    HEALTH_STATUS="healthy"
                else
                    HEALTH_STATUS="unhealthy"
                fi
            fi

            if [ "$HEALTH_STATUS" = "healthy" ]; then
                echo "  ✅ $SERVICE_NAME: 正常"
                HEALTHY_SERVICES=$((HEALTHY_SERVICES + 1))

                # 追加チェック（Redis, Celery等）
                case $CONTAINER_NAME in
                    *redis-master*)
                        PORT=$(echo $CONTAINER_NAME | grep -o '[0-9]' | head -1)
                        PORT="700$PORT"
                        REDIS_INFO=$(docker exec $CONTAINER_NAME redis-cli -p $PORT info server | grep redis_version || echo "unknown")
                        ;;
                    *celery-worker*)
                        CELERY_PING=$(docker exec $CONTAINER_NAME celery -A distributed_tasks inspect ping 2>/dev/null | grep -o "pong" || echo "no-response")
                        ;;
                esac
            else
                echo "  ❌ $SERVICE_NAME: 異常 ($HEALTH_STATUS)"
            fi
        else
            echo "  ⚠️ $SERVICE_NAME: 異常 ($HEALTH_STATUS)"
        fi
    else
        CONTAINER_STATUS="stopped"
        HEALTH_STATUS="stopped"
        echo "  🛑 $SERVICE_NAME: 停止"
    fi

    # JSON出力
    echo "    \"$SERVICE_NAME\": {" >> $HEALTH_REPORT
    echo "      \"container\": \"$CONTAINER_NAME\"," >> $HEALTH_REPORT
    echo "      \"status\": \"$CONTAINER_STATUS\"," >> $HEALTH_REPORT
    echo "      \"health\": \"$HEALTH_STATUS\"" >> $HEALTH_REPORT

    if [ $((i + 1)) -lt $TOTAL_SERVICES ]; then
        echo "    }," >> $HEALTH_REPORT
    else
        echo "    }" >> $HEALTH_REPORT
    fi
done

# 統計情報
HEALTH_PERCENTAGE=$((HEALTHY_SERVICES * 100 / TOTAL_SERVICES))

echo "  }," >> $HEALTH_REPORT
echo "  \"summary\": {" >> $HEALTH_REPORT
echo "    \"total_services\": $TOTAL_SERVICES," >> $HEALTH_REPORT
echo "    \"healthy_services\": $HEALTHY_SERVICES," >> $HEALTH_REPORT
echo "    \"health_percentage\": $HEALTH_PERCENTAGE" >> $HEALTH_REPORT
echo "  }," >> $HEALTH_REPORT

# システム全体の状態判定
if [ $HEALTH_PERCENTAGE -ge 90 ]; then
    OVERALL_STATUS="excellent"
    STATUS_ICON="🟢"
elif [ $HEALTH_PERCENTAGE -ge 75 ]; then
    OVERALL_STATUS="good"
    STATUS_ICON="🟡"
elif [ $HEALTH_PERCENTAGE -ge 50 ]; then
    OVERALL_STATUS="warning"
    STATUS_ICON="🟠"
else
    OVERALL_STATUS="critical"
    STATUS_ICON="🔴"
fi

echo "  \"overall_status\": \"$OVERALL_STATUS\"" >> $HEALTH_REPORT
echo "}" >> $HEALTH_REPORT

# 結果表示
echo ""
echo "📊 ヘルスチェック結果"
echo "====================================="
echo "$STATUS_ICON 総合状態: $OVERALL_STATUS"
echo "🔢 正常サービス: $HEALTHY_SERVICES/$TOTAL_SERVICES ($HEALTH_PERCENTAGE%)"
echo "📄 詳細レポート: $HEALTH_REPORT"

# Redis Cluster特別チェック
echo ""
echo "🔍 Redis Cluster 詳細チェック"
echo "====================================="

if docker exec sado-redis-master-1-prod redis-cli -p 7001 cluster info > /dev/null 2>&1; then
    CLUSTER_STATE=$(docker exec sado-redis-master-1-prod redis-cli -p 7001 cluster info | grep cluster_state | cut -d: -f2 | tr -d '\r\n')
    CLUSTER_SLOTS=$(docker exec sado-redis-master-1-prod redis-cli -p 7001 cluster info | grep cluster_slots_assigned | cut -d: -f2 | tr -d '\r\n')

    if [ "$CLUSTER_STATE" = "ok" ]; then
        echo "✅ Redis Cluster状態: 正常 ($CLUSTER_STATE)"
        echo "📊 割り当てスロット: $CLUSTER_SLOTS/16384"
    else
        echo "❌ Redis Cluster状態: 異常 ($CLUSTER_STATE)"
    fi

    # ノード情報
    echo "📋 クラスターノード情報:"
    docker exec sado-redis-master-1-prod redis-cli -p 7001 cluster nodes | while read line; do
        NODE_ID=$(echo $line | cut -d' ' -f1 | cut -c1-8)
        NODE_ADDR=$(echo $line | cut -d' ' -f2)
        NODE_ROLE=$(echo $line | cut -d' ' -f3)
        echo "  - $NODE_ID... ($NODE_ADDR) [$NODE_ROLE]"
    done
else
    echo "❌ Redis Clusterに接続できません"
fi

# パフォーマンス指標取得
echo ""
echo "⚡ パフォーマンス指標"
echo "====================================="

# Redisメモリ使用量
if docker exec sado-redis-master-1-prod redis-cli -p 7001 info memory > /dev/null 2>&1; then
    REDIS_MEMORY=$(docker exec sado-redis-master-1-prod redis-cli -p 7001 info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r\n')
    echo "💾 Redis メモリ使用量: $REDIS_MEMORY"
fi

# システムリソース
if command -v docker stats > /dev/null 2>&1; then
    echo "🖥️ システムリソース (瞬間値):"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "sado-" | head -5
fi

# アラート出力
if [ $HEALTH_PERCENTAGE -lt 75 ]; then
    echo ""
    echo "🚨 アラート"
    echo "====================================="
    echo "⚠️ システム全体の健康状態が75%を下回りました ($HEALTH_PERCENTAGE%)"
    echo "🔧 管理者による確認が必要です"
fi

echo ""
echo "🏁 ヘルスチェック完了 ($TIMESTAMP)"

# 戻り値設定（外部監視システム用）
if [ $HEALTH_PERCENTAGE -ge 75 ]; then
    exit 0
else
    exit 1
fi
