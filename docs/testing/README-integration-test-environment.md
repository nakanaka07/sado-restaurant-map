# Phase 3-Full 統合テスト環境

## 概要

Phase 3-Full の統合テスト環境は、実装済み 70%のコンポーネントを統合し、以下の機能をテストします：

- **Redis + Celery 分散処理システム**
- **パフォーマンステスト環境**
- **セキュリティテスト設定**
- **監視・メトリクス収集**
- **ログ集約・分析**

## アーキテクチャ

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Frontend App  │  │  Load Balancer  │  │   Monitoring    │
│   (React/Vite)  │  │     (Nginx)     │  │ (Prometheus)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  App Server 1   │  │  App Server 2   │  │    Grafana      │
│   (Node.js)     │  │   (Node.js)     │  │  (Dashboard)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis Cluster                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Master1   │  │   Master2   │  │   Master3   │       │
│  │   :7001     │  │   :7002     │  │   :7003     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Celery Worker   │  │ Celery Worker   │  │  Security Test  │
│ (High Priority) │  │ (Background)    │  │   (SonarQube)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## クイックスタート

### 1. 環境起動

```powershell
# 統合テスト環境を起動
.\tools\testing\integration-test-manager.ps1 -Action start

# 詳細ログ付きで起動
.\tools\testing\integration-test-manager.ps1 -Action start -Verbose
```

### 2. テスト実行

```powershell
# 全テスト実行
.\tools\testing\integration-test-manager.ps1 -Action test -TestType all

# 統合テストのみ
.\tools\testing\integration-test-manager.ps1 -Action test -TestType integration

# パフォーマンステストのみ
.\tools\testing\integration-test-manager.ps1 -Action test -TestType performance

# セキュリティテストのみ
.\tools\testing\integration-test-manager.ps1 -Action test -TestType security
```

### 3. 完全自動テスト

```powershell
# 起動→テスト→停止を自動実行
.\tools\testing\integration-test-manager.ps1 -Action full -TestType all
```

### 4. 環境停止

```powershell
# 環境停止
.\tools\testing\integration-test-manager.ps1 -Action stop

# 完全クリーンアップ
.\tools\testing\integration-test-manager.ps1 -Action cleanup
```

## サービスアクセス

| サービス       | URL                   | 用途                                  |
| -------------- | --------------------- | ------------------------------------- |
| フロントエンド | http://localhost:3001 | メインアプリケーション                |
| Prometheus     | http://localhost:9090 | メトリクス監視                        |
| Grafana        | http://localhost:3000 | ダッシュボード (admin/integration123) |
| SonarQube      | http://localhost:9000 | セキュリティ分析 (admin/admin)        |
| Locust         | http://localhost:8089 | ロードテスト管理                      |
| Kibana         | http://localhost:5601 | ログ分析                              |
| Elasticsearch  | http://localhost:9200 | ログストレージ                        |

## 手動 Docker 操作

### 環境起動

```bash
docker-compose -f docker-compose.integration.yml -p sado-integration-test up -d
```

### サービス状況確認

```bash
docker-compose -f docker-compose.integration.yml -p sado-integration-test ps
```

### ログ確認

```bash
# 全サービスのログ
docker-compose -f docker-compose.integration.yml -p sado-integration-test logs -f

# 特定サービスのログ
docker-compose -f docker-compose.integration.yml -p sado-integration-test logs -f redis-master-1
docker-compose -f docker-compose.integration.yml -p sado-integration-test logs -f celery-worker-high
```

### 環境停止・クリーンアップ

```bash
# 停止
docker-compose -f docker-compose.integration.yml -p sado-integration-test down

# ボリューム含む完全削除
docker-compose -f docker-compose.integration.yml -p sado-integration-test down --volumes --remove-orphans
```

## テスト種類

### 1. 統合テスト

- Redis Cluster 接続テスト
- Celery 分散処理テスト
- アプリケーション間通信テスト
- ヘルスチェック

### 2. パフォーマンステスト

- Locust による負荷テスト
- 同時ユーザー数: 10 ユーザー
- テスト時間: 2 分間
- レスポンス時間・スループット測定

### 3. セキュリティテスト

- SonarQube による静的解析
- セキュリティホットスポット検出
- 脆弱性スキャン
- コード品質チェック

## 監視・アラート

### Prometheus メトリクス

- Redis Cluster 状態
- Celery ワーカー統計
- アプリケーションメトリクス
- システムリソース使用量

### Grafana ダッシュボード

- 統合テスト概要
- パフォーマンス監視
- セキュリティ状況
- エラー率・レスポンス時間

### アラート設定

- サービスダウン検知
- 高 CPU/メモリ使用率
- エラー率増加
- セキュリティ脅威検知

## トラブルシューティング

### Redis 接続エラー

```bash
# Redis接続確認
docker exec -it sado-redis-master-1-integration redis-cli -p 7001 ping

# Cluster状態確認
docker exec -it sado-redis-master-1-integration redis-cli -p 7001 cluster nodes
```

### Celery ワーカー確認

```bash
# ワーカー状態確認
docker exec -it sado-celery-worker-high-integration celery -A tools.scraper.shared.celery_config inspect ping

# アクティブタスク確認
docker exec -it sado-celery-worker-high-integration celery -A tools.scraper.shared.celery_config inspect active
```

### パフォーマンス問題

1. Grafana ダッシュボードでメトリクス確認
2. Prometheus アラート状況確認
3. Elasticsearch ログ分析
4. リソース使用量チェック

### セキュリティ警告

1. SonarQube レポート確認
2. セキュリティホットスポット対応
3. 脆弱性対策実装
4. 再スキャン実行

## ファイル構成

```text
sado-restaurant-map/
├── docker-compose.integration.yml      # 統合テスト環境定義
├── requirements-test.txt                # Pythonテスト依存関係
├── .env.integration                     # 環境変数設定
├── sonar-project-integration.properties # SonarQube設定
├── config/
│   ├── prometheus/
│   │   ├── prometheus.yml              # Prometheus設定
│   │   └── integration.yml             # アラートルール
│   └── grafana/
│       └── integration/                # Grafana設定
├── docker/
│   └── Dockerfile.test                 # テスト用Dockerfile
├── tools/
│   └── testing/
│       ├── integration-test-manager.ps1 # 管理スクリプト
│       └── load-tests/
│           └── locustfile.py           # ロードテスト定義
└── test-results/                       # テスト結果出力
```

## 環境変数

主要な環境変数は `.env.integration` で定義：

- `REDIS_PASSWORD`: Redis 認証パスワード
- `CELERY_BROKER_URL`: Celery ブローカー URL
- `PROMETHEUS_PORT`: Prometheus ポート
- `GRAFANA_ADMIN_PASSWORD`: Grafana 管理者パスワード
- `TEST_TIMEOUT`: テストタイムアウト時間

## ベストプラクティス

### テスト実行前

1. 既存の開発環境を停止
2. ポート競合を避ける（3000, 3001, 9090 等）
3. 十分なディスク容量を確保（5GB 以上推奨）

### テスト実行中

1. ログを定期的に確認
2. リソース使用量を監視
3. エラー発生時は即座に調査

### テスト完了後

1. 結果レポートを保存
2. 環境を適切にクリーンアップ
3. 問題点を文書化

## 継続的改善

1. **テスト自動化**: CI/CD パイプラインへの統合
2. **監視強化**: より詳細なメトリクス収集
3. **セキュリティ**: 追加のセキュリティテスト
4. **パフォーマンス**: ベンチマーク基準の設定

---

## サポート

問題が発生した場合：

1. ログファイルを確認（`logs/` ディレクトリ）
2. サービス状況を確認（`-Action status`）
3. トラブルシューティングガイドを参照
4. 必要に応じて環境を再構築
