# Sado Restaurant Map - Data Platform

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Clean Architecture準拠のPython ETLシステム** - Google Places API (New) v1を使用した佐渡島レストラン・駐車場・トイレ情報収集プラットフォーム

## 📋 目次

- [特徴](#特徴)
- [アーキテクチャ](#アーキテクチャ)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [開発](#開発)
- [テスト](#テスト)
- [Phase 3 高度機能](#phase-3-高度機能)

## ✨ 特徴

- **Clean Architecture**: 依存性逆転の原則に基づく堅牢な設計
- **型安全**: TypeScript同等の厳格な型チェック (mypy)
- **Dependency Injection**: テスタブルなコンポーネント設計
- **Phase 3 機能**:
  - 分散処理 (Celery + Redis)
  - ML ベース最適化 (scikit-learn)
  - インテリジェント負荷分散
  - 自動フェイルオーバー
- **非同期処理**: asyncio による高速データ収集
- **包括的エラーハンドリング**: 21種類のカスタム例外

## 🏛️ アーキテクチャ

```
data-platform/
├── interface/          # CLI (ユーザーインターフェース層)
│   └── cli/main.py
├── application/        # Use Cases (アプリケーション層)
│   └── workflows/
├── core/              # Domain Logic (ドメイン層)
│   ├── domain/        # エンティティ・インターフェース
│   ├── processors/    # ビジネスロジック
│   └── services/      # ドメインサービス
├── infrastructure/    # External Adapters (インフラ層)
│   ├── external/      # Google Places API
│   └── storage/       # Google Sheets
└── shared/           # 共有コンポーネント
    ├── config.py
    ├── container.py   # DI Container
    ├── exceptions.py
    ├── logger.py
    └── types/
```

### 依存関係の方向

```
interface → application → core ← infrastructure
                          ↑
                        shared
```

## 🚀 セットアップ

### 前提条件

- Python 3.10以上
- Google Cloud Projectの作成
- Google Places API (New) キーの取得
- Google Sheets API サービスアカウントの作成

### インストール

1.**リポジトリのクローン**

```bash
git clone https://github.com/nakanaka07/sado-restaurant-map.git
cd sado-restaurant-map/data-platform
```

2.**仮想環境の作成**

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
.\venv\Scripts\Activate.ps1  # Windows PowerShell
```

3.**依存パッケージのインストール**

```bash
# 基本パッケージ
pip install -r config/requirements.txt

# または pyproject.toml を使用
pip install -e .

# 開発環境 (推奨)
pip install -e ".[dev]"

# Phase 3 全機能
pip install -e ".[all]"
```

4.**環境変数の設定**

```bash
# .env.example をコピー
cp .env.example .env

# .env ファイルを編集
nano .env
```

必須設定:

- `PLACES_API_KEY`: Google Places API キー
- `GOOGLE_SERVICE_ACCOUNT_PATH`: サービスアカウントJSONファイルのパス
- `SPREADSHEET_ID`: Google SheetsのスプレッドシートID

  5.**サービスアカウントキーの配置**

```bash
# config/service-account.json.example を参考に
cp path/to/your-service-account.json config/service-account.json
```

### 設定の検証

```bash
python interface/cli/main.py --config-check
```

## 💻 使い方

### 基本的な実行

```bash
# 全カテゴリを標準モードで処理
python interface/cli/main.py --target all --mode standard

# ドライラン (見積もりのみ、実際の処理なし)
python interface/cli/main.py --target restaurants --dry-run

# 非同期モード (Phase 2改善、高速処理)
python interface/cli/main.py --target all --mode standard --async-mode
```

### モード選択

- **quick**: 高速モード (CID URLのみ処理)
- **standard**: 標準モード (CID URL + 高精度店舗名) ★推奨
- **comprehensive**: 包括モード (全データ + 詳細検証)

### ターゲット選択

- `all`: 全カテゴリ (restaurants, parkings, toilets)
- `restaurants`: 飲食店のみ
- `parkings`: 駐車場のみ
- `toilets`: トイレのみ

### API接続テスト

```bash
python interface/cli/main.py --test-connections
```

## 🛠️ 開発

### コード品質チェック

```bash
# 型チェック
mypy shared/ core/ application/

# コードフォーマット
black .

# Linter
flake8 .
```

### コーディング規約

- **PEP 8**: 基本スタイルガイド準拠
- **Black**: 自動フォーマッター使用 (line-length: 100)
- **mypy**: 型ヒント必須
- **docstring**: Google Style

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
pytest

# ユニットテストのみ
pytest tests/unit/ -v

# カバレッジレポート付き
pytest --cov=shared --cov=core --cov-report=html

# 統合テストを除外
pytest -m "not integration"

# 高速テスト (slow除外)
pytest -m "not slow"
```

### テストカバレッジ目標

- **現在**: 3.24%
- **短期目標**: 30%
- **中期目標**: 50%
- **長期目標**: 80%

### テスト戦略

| 層                       | 戦略                         | 優先度 |
| ------------------------ | ---------------------------- | ------ |
| `shared/config.py`       | 設定バリデーション全パターン | 高     |
| `shared/exceptions.py`   | 例外階層の動作確認           | 高     |
| `shared/container.py`    | DI動作・循環依存検知         | 高     |
| `core/domain/`           | ビジネスロジックの正確性     | 高     |
| `infrastructure/`        | モックを使用した外部API      | 中     |
| `application/workflows/` | E2Eシナリオテスト            | 中     |

## 🚀 Phase 3 高度機能

### Smart Orchestrator

インテリジェント負荷分散・自動フェイルオーバーシステム

```python
from shared.smart_orchestrator import SmartOrchestrator

orchestrator = SmartOrchestrator(cache_service, performance_monitor)
await orchestrator.start()

# 最適ワーカー選択
worker = await orchestrator.get_optimal_worker("api_call", priority=7)

# システムステータス確認
status = orchestrator.get_system_status()
```

### Machine Learning Engine

データ品質分析・異常検知

```python
from shared.ml_engine import MLEngine

ml_engine = MLEngine()
ml_engine.train_models(historical_data)

# 品質スコア予測
quality = ml_engine.predict_data_quality(place_data)
```

### Cache Service

Redis Cluster分散キャッシュ

```python
from shared.cache_service import CacheService, CacheConfig

config = CacheConfig(redis_nodes=["localhost:6379"])
cache = CacheService(config)
await cache.initialize()

# キャッシュ操作
await cache.set("key", value, ttl=3600)
result = await cache.get("key")
```

## 📊 パフォーマンス指標

| 項目               | 目標   | 現状           |
| ------------------ | ------ | -------------- |
| API呼び出し/秒     | 10 QPS | 制限遵守       |
| 平均応答時間       | <1.5秒 | 測定中         |
| エラー率           | <1%    | モニタリング中 |
| キャッシュヒット率 | >80%   | Phase 3対応    |

## 📝 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) を参照

## 🤝 コントリビューション

1. Issue を作成
2. Feature ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Request を作成

## 📞 サポート

- **バグ報告**: [GitHub Issues](https://github.com/nakanaka07/sado-restaurant-map/issues)
- **機能リクエスト**: [GitHub Discussions](https://github.com/nakanaka07/sado-restaurant-map/discussions)

## 🔗 関連リンク

- [Google Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/place-new)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

---

**Version**: 2.2.0 (Phase 3対応)
**Last Updated**: 2025-11-02
