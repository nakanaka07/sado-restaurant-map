#!/bin/bash
# Redis Cluster初期化スクリプト
# Windows Docker環境対応版

set -e

echo "=== Redis Cluster 初期化スクリプト ==="
echo "Grokzenアプローチを適用した独自構成"
echo "======================================="

# 接続パラメータ
REDIS_PASSWORD="sado_redis_2025"
MASTER_NODES="127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003"
REPLICA_NODES="127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006"
ALL_NODES="$MASTER_NODES $REPLICA_NODES"

echo "ステップ 1: 全ノードの接続性確認..."
for port in 7001 7002 7003 7004 7005 7006; do
    echo -n "  ノード 127.0.0.1:$port... "
    if redis-cli -h 127.0.0.1 -p $port -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
        echo "✓ 正常"
    else
        echo "✗ 接続失敗"
        exit 1
    fi
done

echo "ステップ 2: 既存クラスター設定のリセット..."
for port in 7001 7002 7003 7004 7005 7006; do
    echo "  ノード $port をリセット..."
    redis-cli -h 127.0.0.1 -p $port -a $REDIS_PASSWORD CLUSTER RESET > /dev/null 2>&1 || true
done

sleep 2

echo "ステップ 3: Redis Cluster作成..."
echo "  マスター: $MASTER_NODES"
echo "  レプリカ: $REPLICA_NODES"

redis-cli -a $REDIS_PASSWORD --cluster create $ALL_NODES --cluster-replicas 1 --cluster-yes

echo "ステップ 4: クラスター状態確認..."
redis-cli -h 127.0.0.1 -p 7001 -a $REDIS_PASSWORD cluster info

echo "ステップ 5: ノード情報表示..."
redis-cli -h 127.0.0.1 -p 7001 -a $REDIS_PASSWORD cluster nodes

echo "=== Redis Cluster 初期化完了 ==="
echo "✓ 3マスター + 3レプリカ構成"
echo "✓ 高可用性対応"
echo "✓ 自動フェイルオーバー有効"
echo "================================"
