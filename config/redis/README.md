# 佐渡飲食店マップ - Redis クラスター設定ガイド

> **Status**: ✅ Complete | **Last Updated**: 2025-08-31 | **Version**: 1.0

## 📖 概要

本プロジェクトでは、高可用性と分散処理を実現するため、Redis Cluster を採用しています。
3 つのマスターノードと 3 つのレプリカノードによる 6 ノード構成で、自動フェイルオーバー機能を提供します。

## 🏗️ アーキテクチャ構成

### ノード構成

```text
┌─────────────────┬──────────────┬─────────────┬─────────────┐
│ ノード          │ ポート       │ 役割        │ レプリカ    │
├─────────────────┼──────────────┼─────────────┼─────────────┤
│ redis-master-1  │ 7001/17001   │ Master      │ replica-1   │
│ redis-master-2  │ 7002/17002   │ Master      │ replica-2   │
│ redis-master-3  │ 7003/17003   │ Master      │ replica-3   │
│ redis-replica-1 │ 7004/17004   │ Replica     │ master-1    │
│ redis-replica-2 │ 7005/17005   │ Replica     │ master-2    │
│ redis-replica-3 │ 7006/17006   │ Replica     │ master-3    │
└─────────────────┴──────────────┴─────────────┴─────────────┘
```

### データ分散

- **ハッシュスロット**: 16384 スロットを 3 つのマスターに分散
- **レプリケーション**: 各マスターに 1 つのレプリカを配置
- **自動フェイルオーバー**: マスター障害時にレプリカが自動昇格

## 📁 設定ファイル構成

```text
config/redis/
├── redis.conf              # メイン設定（全ノード共通）
├── redis-master-1.conf     # マスター1設定
├── redis-master-2.conf     # マスター2設定
├── redis-master-3.conf     # マスター3設定
├── redis-replica-1.conf    # レプリカ1設定
├── redis-replica-2.conf    # レプリカ2設定
└── redis-replica-3.conf    # レプリカ3設定
```

## ⚙️ 主要設定項目

### クラスター設定

```ini
# クラスター機能有効化
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 15000

# フェイルオーバー設定
cluster-require-full-coverage no
cluster-migration-barrier 1
cluster-replica-no-failover no

# 高可用性設定
min-replicas-to-write 1
min-replicas-max-lag 10
```

### セキュリティ設定

```ini
# 認証設定
requirepass sado_redis_2025
protected-mode no

# 危険コマンド無効化
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### 永続化設定

```ini
# RDB + AOF ハイブリッド永続化
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
```

## 🚀 起動手順

### 1. Docker Compose による起動

```bash
# 全サービス起動
docker-compose -f docker-compose.phase3.yml up -d

# Redis Clusterサービスのみ起動
docker-compose -f docker-compose.phase3.yml up -d redis-master-1 redis-master-2 redis-master-3 redis-replica-1 redis-replica-2 redis-replica-3

# クラスター初期化
docker-compose -f docker-compose.phase3.yml up redis-cluster-init
```

### 2. 手動クラスター初期化（必要な場合）

```bash
# クラスター作成
redis-cli --cluster create \
  redis-master-1:7001 redis-master-2:7002 redis-master-3:7003 \
  redis-replica-1:7004 redis-replica-2:7005 redis-replica-3:7006 \
  --cluster-replicas 1 --cluster-yes \
  -a sado_redis_2025
```

## 🛠️ 運用管理

### 管理スクリプト

```bash
# 健全性チェック
./tools/scripts/redis-cluster-manager.sh health

# クラスター状態確認
./tools/scripts/redis-cluster-manager.sh status

# フェイルオーバーテスト
./tools/scripts/redis-cluster-manager.sh failover redis-master-1:7001

# 設定検証
python ./tools/scripts/validate-redis-config.py
```

### 監視・アラート

```bash
# 継続監視開始
./tools/scripts/redis-cluster-monitor.sh monitor

# 単発健全性チェック
./tools/scripts/redis-cluster-monitor.sh check

# 自動修復実行
./tools/scripts/redis-cluster-monitor.sh repair
```

## 📊 監視項目

### 基本メトリクス

- **可用性**: ノード稼働状況
- **パフォーマンス**: レスポンス時間、スループット
- **メモリ使用量**: 各ノードのメモリ消費
- **レプリケーション遅延**: マスター・レプリカ間の同期状況

### Prometheus 監視

```yaml
# 各マスターノード用のRedis Exporter
redis-exporter-master-1: ポート 9121
redis-exporter-master-2: ポート 9122
redis-exporter-master-3: ポート 9123
```

### アラート条件

- ノード停止（3 分以上応答なし）
- メモリ使用率 > 80%
- レプリケーション遅延 > 10 秒
- クラスター状態 != OK

## 🔧 トラブルシューティング

### よくある問題

#### 1. クラスター初期化失敗

```bash
# 症状: "Node is not empty" エラー
# 解決: 各ノードのデータをリセット
for port in 7001 7002 7003 7004 7005 7006; do
    redis-cli -p $port -a sado_redis_2025 CLUSTER RESET HARD
    redis-cli -p $port -a sado_redis_2025 FLUSHALL
done
```

#### 2. フェイルオーバーが発生しない

```bash
# 確認項目
1. cluster-require-full-coverage no 設定確認
2. min-replicas-to-write 設定確認
3. レプリカノードの健全性確認
4. ネットワーク接続性確認
```

#### 3. データが見つからない

```bash
# クラスター全体でキーを検索
redis-cli --cluster call redis-master-1:7001 -a sado_redis_2025 keys "*pattern*"

# 特定スロットの担当ノード確認
redis-cli -p 7001 -a sado_redis_2025 CLUSTER KEYSLOT "your-key"
```

### パフォーマンス最適化

#### メモリ最適化

```ini
# ハッシュテーブル最適化
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# リスト構造最適化
list-max-ziplist-size -2
list-compress-depth 0
```

#### ネットワーク最適化

```ini
# TCP設定
tcp-keepalive 300
tcp-backlog 511
timeout 0

# バックログサイズ
repl-backlog-size 128mb
repl-backlog-ttl 3600
```

## 🔐 セキュリティ対策

### アクセス制御

- **パスワード認証**: 全ノードで統一パスワード
- **ネットワーク分離**: Docker 内部ネットワーク使用
- **ポート制限**: 必要ポートのみ公開

### 監査ログ

- **操作ログ**: 各ノードでログ出力
- **アクセスログ**: 接続・認証ログ
- **エラーログ**: 異常時の詳細ログ

## 📈 パフォーマンス指標

### ベンチマーク結果（参考値）

```text
設定: 6ノード Redis Cluster (Docker環境)
CPU: 4コア, メモリ: 16GB

┌─────────────────┬──────────────┬──────────────┐
│ 操作            │ スループット │ レイテンシ   │
├─────────────────┼──────────────┼──────────────┤
│ SET             │ 85,000 ops/s │ 0.12ms       │
│ GET             │ 95,000 ops/s │ 0.10ms       │
│ MSET            │ 45,000 ops/s │ 0.22ms       │
│ Pipeline (10)   │ 450,000 ops/s│ 0.02ms       │
└─────────────────┴──────────────┴──────────────┘
```

### 推奨運用指標

- **CPU 使用率**: < 70%
- **メモリ使用率**: < 80%
- **ディスク I/O**: < 80%
- **ネットワーク帯域**: < 70%

## 🔄 バックアップ・復旧

### 自動バックアップ

```bash
# RDB + AOF ファイルの定期バックアップ
# Crontabに設定
0 2 * * * /path/to/backup-redis-cluster.sh
```

### 災害復旧手順

1. **バックアップデータ確認**
2. **新クラスター構築**
3. **データ復元**
4. **整合性確認**
5. **アプリケーション切り替え**

## 📚 参考資料

- [Redis Cluster 公式ドキュメント](https://redis.io/docs/reference/cluster-spec/)
- [Redis 設定リファレンス](https://redis.io/docs/manual/config/)
- [Docker Redis 設定ベストプラクティス](https://redis.io/docs/stack/get-started/install/docker/)

---

**注意**: 本番環境では、ネットワーク分離、監視強化、定期バックアップの実装を推奨します。
