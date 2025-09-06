#!/bin/bash

# ==========================================
# Production Deployment Script
# 佐渡飲食店マップ Phase 3-Full 本番環境デプロイ
# ==========================================

set -e

echo "🚀 佐渡飲食店マップ Phase 3-Full 本番環境デプロイ開始"

# 環境変数の確認
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production ファイルが見つかりません"
    exit 1
fi

# 必要なディレクトリ作成
mkdir -p logs/{nginx,api,celery,redis}
mkdir -p backups/redis
mkdir -p ssl

echo "📁 ディレクトリ構造作成完了"

# Docker イメージビルド
echo "🔨 Docker イメージビルド開始..."
docker-compose -f docker-compose.production.yml build --no-cache

# Redis Cluster初期化チェック
echo "🔍 Redis Cluster設定チェック..."
if [ ! -f "config/redis/redis-master-1.conf" ]; then
    echo "⚠️ Redis設定ファイルが見つかりません。初期化します..."
    ./scripts/init-redis-cluster.sh
fi

# SSL証明書チェック
echo "🔒 SSL証明書チェック..."
if [ ! -f "ssl/certificate.pem" ] || [ ! -f "ssl/private-key.pem" ]; then
    echo "⚠️ SSL証明書が見つかりません。自己署名証明書を作成します..."
    ./scripts/generate-ssl-cert.sh
fi

# 既存コンテナ停止・削除
echo "🛑 既存コンテナ停止・削除..."
docker-compose -f docker-compose.production.yml down -v

# 本番環境起動
echo "🚀 本番環境起動..."
docker-compose -f docker-compose.production.yml up -d

# サービス起動確認
echo "⏳ サービス起動確認中..."
sleep 30

# ヘルスチェック
echo "🏥 ヘルスチェック実行..."

# Redis Cluster確認
echo "Redis Cluster状態確認..."
docker exec sado-redis-master-1-prod redis-cli -p 7001 ping
docker exec sado-redis-master-2-prod redis-cli -p 7002 ping
docker exec sado-redis-master-3-prod redis-cli -p 7003 ping

# Redis Cluster初期化（初回のみ）
echo "Redis Cluster初期化..."
docker exec sado-redis-master-1-prod redis-cli --cluster create \
    172.20.0.2:7001 172.20.0.3:7002 172.20.0.4:7003 \
    172.20.0.5:7004 172.20.0.6:7005 172.20.0.7:7006 \
    --cluster-replicas 1 --cluster-yes || echo "Cluster already initialized"

# Celery Worker確認
echo "Celery Worker状態確認..."
docker exec sado-celery-worker-high-prod celery -A distributed_tasks inspect ping
docker exec sado-celery-worker-normal-prod celery -A distributed_tasks inspect ping

# Frontend確認
echo "Frontend状態確認..."
curl -f http://localhost/health || echo "Frontend not ready yet"

# API Server確認
echo "API Server状態確認..."
curl -f http://localhost:8000/health || echo "API Server not ready yet"

# 監視システム確認
echo "監視システム状態確認..."
curl -f http://localhost:9090/-/healthy || echo "Prometheus not ready yet"
curl -f http://localhost:3000/api/health || echo "Grafana not ready yet"

# デプロイ完了
echo "✅ 本番環境デプロイ完了！"
echo ""
echo "📊 サービスURL:"
echo "  Frontend: http://localhost (HTTPS: https://localhost)"
echo "  API: http://localhost:8000"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3000"
echo "  Redis Insight: redis://localhost:7001"
echo ""
echo "🔧 管理コマンド:"
echo "  サービス状態確認: docker-compose -f docker-compose.production.yml ps"
echo "  ログ確認: docker-compose -f docker-compose.production.yml logs -f [service_name]"
echo "  サービス停止: docker-compose -f docker-compose.production.yml down"
echo "  完全削除: docker-compose -f docker-compose.production.yml down -v"
echo ""
echo "🔍 監視ダッシュボード:"
echo "  Grafana admin password: ${GRAFANA_ADMIN_PASSWORD:-admin}"
echo ""

# パフォーマンステスト実行オプション
read -p "パフォーマンステストを実行しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔥 パフォーマンステスト実行..."
    ./scripts/performance-test.sh
fi

echo "🎉 Phase 3-Full 本番環境デプロイが完了しました！"
