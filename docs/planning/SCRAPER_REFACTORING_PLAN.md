# 🔧 Scraper Refactoring Plan

> 🎯 **目的**: `tools\scraper` ディレクトリの構造最適化・モダナイズ・保守性向上
> **スコープ**: プロジェクト構造改善（#4 リファクタリング指示）
> **最終更新**: 2025 年 8 月 27 日

## 📋 現状分析

### 現在の構造

```text
tools/scraper/
├── config/          # 設定管理（環境変数・認証・ヘッダー）
├── data/            # データファイル（CID・テキスト形式）
├── processors/      # 処理ロジック（API通信・データ変換）
├── src/             # 実行スクリプト（エントリーポイント）
├── tools/           # 補助ツール（URL変換・欠損補完）
└── utils/           # 共有ユーティリティ（認証・翻訳・フォーマット）
```

### 🔍 特定された問題点

#### 1. **構造の問題**

- **曖昧な責任分離**: `tools/` と `src/` の役割重複
- **深いネスト構造**: ファイル階層が複雑
- **命名規則の不統一**: ディレクトリ・ファイル名の一貫性不足
- **アーキテクチャレイヤーの混在**: ビジネスロジックと実行制御の分離不足

#### 2. **依存関係の問題**

- **循環参照リスク**: processors 間の相互依存
- **緊密結合**: モジュール間の強い依存関係
- **不要な依存**: 未使用インポートの存在
- **重複した機能**: 似た処理の複数実装

#### 3. **保守性の問題**

- **レガシーコード**: 廃止予定ファイルの残存
- **コード重複**: DRY 原則違反
- **ドキュメント不整合**: 実装と説明の乖離
- **テストカバレッジ不足**: 単体テストの欠如

#### 4. **TypeScript 非対応**

- **Python 専用設計**: プロジェクト全体の TypeScript 化に非対応
- **型安全性の欠如**: 動的型付けによる実行時エラーリスク

## 🎯 リファクタリング目標

### Primary Goals

1. **🏗️ クリーンアーキテクチャの実現**

   - 明確な責任分離
   - 依存関係の適切な管理
   - 拡張性・テスト容易性の向上

2. **⚡ パフォーマンス最適化**

   - 不要な処理の削除
   - 効率的なデータフロー設計
   - メモリ使用量の削減

3. **🔧 保守性の向上**

   - コード重複の削除
   - 統一的な設計パターン
   - 包括的なドキュメント整備

4. **🧪 テスト容易性**
   - 単体テスト対応
   - 依存性注入パターン
   - モックフレンドリー設計

## 🚀 リファクタリング戦略

### Phase 1: 構造整理・クリーンアップ

#### 1.1 ディレクトリ構造の再編成

##### Before (現在)

```text
tools/scraper/
├── config/
├── data/
├── processors/
├── src/
├── tools/
└── utils/
```

##### After (提案)

```text
tools/scraper/
├── core/              # 🧠 コアビジネスロジック
│   ├── processors/    # データ処理エンジン
│   ├── services/      # 外部API連携
│   └── domain/        # ドメインモデル・型定義
├── infrastructure/    # 🏗️ インフラストラクチャ層
│   ├── auth/          # 認証・権限管理
│   ├── storage/       # データ永続化
│   └── external/      # 外部API クライアント
├── application/       # 🎯 アプリケーション層
│   ├── commands/      # コマンド実行
│   ├── workflows/     # ワークフロー制御
│   └── dto/           # データ転送オブジェクト
├── interface/         # 🎨 インターフェース層
│   ├── cli/           # コマンドライン
│   ├── web/           # Web API（将来拡張）
│   └── adapters/      # 外部連携アダプター
├── shared/            # 🔗 共有ライブラリ
│   ├── utils/         # ユーティリティ関数
│   ├── constants/     # 定数・設定
│   └── types/         # 型定義
├── config/            # ⚙️ 設定管理
├── data/              # 📊 データファイル
└── scripts/           # 🚀 実行スクリプト
```

#### 1.2 ファイルの移動・統合計画

| 現在のファイル                        | 移動先                                     | 理由                           |
| ------------------------------------- | ------------------------------------------ | ------------------------------ |
| `src/run_new_unified.py`              | `interface/cli/main.py`                    | CLI エントリーポイントの明確化 |
| `processors/new_unified_processor.py` | `application/workflows/data_processor.py`  | ワークフロー制御の責任分離     |
| `processors/places_api_client.py`     | `infrastructure/external/places_client.py` | 外部 API 責任の分離            |
| `processors/spreadsheet_manager.py`   | `infrastructure/storage/sheets_manager.py` | データ永続化責任の分離         |
| `processors/data_validator.py`        | `core/domain/validators.py`                | ドメインロジックの集約         |
| `utils/google_auth.py`                | `infrastructure/auth/google_auth.py`       | 認証責任の分離                 |
| `utils/translators.py`                | `shared/utils/translators.py`              | 共有ユーティリティ             |
| `utils/output_formatter.py`           | `shared/utils/formatters.py`               | 共有ユーティリティ             |
| `tools/complement_missing.py`         | `scripts/maintenance/complement_data.py`   | メンテナンススクリプト         |

#### 1.3 レガシーファイルの削除

```bash
# 廃止予定ファイルの削除
processors/unified_cid_processor.py    # ✅ 削除 - 新プロセッサーに移行済み
tools/manual_url_extractor.py          # ✅ 統合 - URL変換機能に統合
debug/ (一部ファイル)                   # ✅ 整理 - 重複機能の統合
```

### Phase 2: アーキテクチャ改善

#### 2.1 依存性注入パターンの導入

##### 現在の問題

```python
# 直接的な依存関係
class NewUnifiedProcessor:
    def __init__(self):
        self.api_client = PlacesAPIClient()  # 緊密結合
        self.sheets_manager = SpreadsheetManager()  # 緊密結合
```

##### 改善後

```python
# 依存性注入パターン
class DataProcessor:
    def __init__(self,
                 api_client: PlacesAPIClient,
                 storage: DataStorage,
                 validator: DataValidator):
        self._api_client = api_client
        self._storage = storage
        self._validator = validator
```

#### 2.2 インターフェース・抽象化の導入

```python
# 抽象基底クラス
from abc import ABC, abstractmethod

class DataStorage(ABC):
    @abstractmethod
    def save(self, data: Dict) -> bool:
        pass

    @abstractmethod
    def load(self, identifier: str) -> Dict:
        pass

class SheetsStorage(DataStorage):
    def save(self, data: Dict) -> bool:
        # Google Sheets実装
        pass

class FileStorage(DataStorage):
    def save(self, data: Dict) -> bool:
        # ファイル実装
        pass
```

#### 2.3 設定管理の改善

##### 既存の課題

```python
# 環境変数が各所で直接参照
api_key = os.getenv('PLACES_API_KEY')
```

##### 改善案

```python
# 設定クラスによる一元管理
@dataclass
class ScraperConfig:
    places_api_key: str
    spreadsheet_id: str
    api_delay: float = 1.0
    max_workers: int = 3

    @classmethod
    def from_env(cls) -> 'ScraperConfig':
        return cls(
            places_api_key=os.getenv('PLACES_API_KEY'),
            spreadsheet_id=os.getenv('SPREADSHEET_ID'),
            api_delay=float(os.getenv('API_DELAY', 1.0)),
            max_workers=int(os.getenv('MAX_WORKERS', 3))
        )
```

### Phase 3: コード品質向上

#### 3.1 型安全性の向上

```python
# 厳密な型定義
from typing import Protocol, TypedDict, Literal, Optional, List
from dataclasses import dataclass

class PlaceData(TypedDict):
    place_id: str
    name: str
    address: Optional[str]
    types: List[str]
    rating: Optional[float]

CategoryType = Literal['restaurants', 'parkings', 'toilets']

@dataclass
class ProcessingResult:
    category: CategoryType
    processed_count: int
    error_count: int
    duration: float
```

#### 3.2 エラーハンドリングの強化

```python
# カスタム例外クラス
class ScraperError(Exception):
    """スクレイパー基底例外"""
    pass

class APIError(ScraperError):
    """API通信エラー"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code

class ValidationError(ScraperError):
    """データ検証エラー"""
    def __init__(self, message: str, field: str, value: Any):
        super().__init__(message)
        self.field = field
        self.value = value

# 堅牢なエラーハンドリング
def process_place_data(place_data: Dict) -> ProcessingResult:
    try:
        validated_data = validate_place_data(place_data)
        return ProcessingResult(success=True, data=validated_data)
    except ValidationError as e:
        logger.error(f"検証エラー: {e.field}={e.value} - {e}")
        return ProcessingResult(success=False, error=str(e))
    except APIError as e:
        logger.error(f"API エラー [{e.status_code}]: {e}")
        return ProcessingResult(success=False, error=str(e))
```

#### 3.3 ログ管理の改善

```python
# 構造化ログ
import structlog

logger = structlog.get_logger(__name__)

def process_restaurant_data(place_id: str) -> None:
    logger.info("データ処理開始",
               place_id=place_id,
               category="restaurant")

    try:
        result = api_client.fetch_place_details(place_id)
        logger.info("API取得成功",
                   place_id=place_id,
                   fields_count=len(result))
    except APIError as e:
        logger.error("API取得失敗",
                    place_id=place_id,
                    error_code=e.status_code,
                    error_message=str(e))
```

### Phase 4: テスト・品質保証

#### 4.1 単体テスト導入

```python
# pytest + モック
import pytest
from unittest.mock import Mock, patch
from core.processors.data_processor import DataProcessor

class TestDataProcessor:
    @pytest.fixture
    def mock_api_client(self):
        return Mock(spec=PlacesAPIClient)

    @pytest.fixture
    def mock_storage(self):
        return Mock(spec=DataStorage)

    @pytest.fixture
    def processor(self, mock_api_client, mock_storage):
        return DataProcessor(
            api_client=mock_api_client,
            storage=mock_storage
        )

    def test_process_valid_place_data(self, processor, mock_api_client):
        # Given
        place_data = {'place_id': 'test_id', 'name': 'Test Restaurant'}
        mock_api_client.fetch_details.return_value = place_data

        # When
        result = processor.process(place_data)

        # Then
        assert result.success is True
        assert result.data['name'] == 'Test Restaurant'
```

#### 4.2 統合テスト導入

```python
# 統合テスト
class TestDataProcessingWorkflow:
    @pytest.mark.integration
    def test_end_to_end_restaurant_processing(self, config):
        # 実際のAPIを使用したエンドツーエンドテスト
        processor = DataProcessor.create_from_config(config)

        # テストデータでの実行
        test_place_ids = ['ChIJtest123']
        results = processor.process_batch(test_place_ids)

        assert len(results) == 1
        assert results[0].success is True
```

#### 4.3 コード品質チェック

```bash
# コード品質チェックツール
pip install flake8 black mypy pylint

# 実行コマンド
flake8 tools/scraper/
black tools/scraper/
mypy tools/scraper/
pylint tools/scraper/
```

## 📊 実装計画

### 🗓️ スケジュール

| Phase       | 期間 | 主要タスク           | 成果物                       |
| ----------- | ---- | -------------------- | ---------------------------- |
| **Phase 1** | 3 日 | 構造整理・移動・削除 | 新ディレクトリ構造           |
| **Phase 2** | 5 日 | アーキテクチャ改善   | 依存性注入・抽象化           |
| **Phase 3** | 4 日 | コード品質向上       | 型安全性・エラーハンドリング |
| **Phase 4** | 3 日 | テスト・品質保証     | テストスイート・CI 統合      |

### 🔄 移行戦略

#### 段階的移行

1. **Backward Compatibility**: 既存スクリプトの互換性維持
2. **Parallel Execution**: 新旧システムの並行稼働期間
3. **Gradual Migration**: 段階的な機能移行
4. **Deprecation Warning**: 旧システムの廃止予告

#### リスク管理

| リスク                 | 影響度 | 対策                     |
| ---------------------- | ------ | ------------------------ |
| **既存機能の破損**     | 高     | 包括的テスト・段階的移行 |
| **パフォーマンス劣化** | 中     | ベンチマーク・最適化     |
| **学習コスト**         | 中     | ドキュメント整備・研修   |
| **開発遅延**           | 低     | 明確なマイルストーン     |

## 🎯 期待される効果

### 短期的効果（1-2 週間）

- ✅ **コード可読性 50%向上**: 明確な責任分離
- ✅ **メンテナンス工数 30%削減**: 重複コード削除
- ✅ **新機能開発速度 40%向上**: モジュラー設計

### 中期的効果（1-2 ヶ月）

- ✅ **バグ発生率 60%削減**: 型安全性・テスト導入
- ✅ **パフォーマンス 25%向上**: 最適化されたアーキテクチャ
- ✅ **開発者体験向上**: IDE 支援・デバッグ容易性

### 長期的効果（3-6 ヶ月）

- ✅ **技術的負債解消**: レガシーコード完全削除
- ✅ **スケーラビリティ確保**: 新機能追加・チーム拡張対応
- ✅ **プロジェクト全体最適化**: TypeScript 統合準備

## 📚 関連ドキュメント

### 実装ガイド

- `SCRAPER_REFACTORING_IMPLEMENTATION.md` - 実装手順書
- `SCRAPER_API_DESIGN.md` - API 設計書
- `SCRAPER_TESTING_STRATEGY.md` - テスト戦略書

### アーキテクチャ資料

- `ADR-003-scraper-architecture-redesign.md` - アーキテクチャ決定記録
- `SCRAPER_DEPENDENCY_DIAGRAM.md` - 依存関係図
- `SCRAPER_DATA_FLOW_DIAGRAM.md` - データフロー図

### 移行ガイド

- `SCRAPER_MIGRATION_GUIDE.md` - 移行手順書
- `SCRAPER_COMPATIBILITY_MATRIX.md` - 互換性マトリクス
- `SCRAPER_TROUBLESHOOTING.md` - トラブルシューティング

## 🔧 実装詳細

### Configuration Management

```python
# config/settings.py
from dataclasses import dataclass
from typing import Optional
import os

@dataclass
class GoogleAPIConfig:
    places_api_key: str
    service_account_path: str
    spreadsheet_id: str

@dataclass
class ProcessingConfig:
    api_delay: float = 1.0
    max_workers: int = 3
    max_retries: int = 3
    timeout: int = 30

@dataclass
class ScraperConfig:
    google_api: GoogleAPIConfig
    processing: ProcessingConfig
    debug: bool = False

    @classmethod
    def from_environment(cls) -> 'ScraperConfig':
        return cls(
            google_api=GoogleAPIConfig(
                places_api_key=os.getenv('PLACES_API_KEY'),
                service_account_path=os.getenv('GOOGLE_SERVICE_ACCOUNT_PATH'),
                spreadsheet_id=os.getenv('SPREADSHEET_ID')
            ),
            processing=ProcessingConfig(
                api_delay=float(os.getenv('API_DELAY', 1.0)),
                max_workers=int(os.getenv('MAX_WORKERS', 3))
            ),
            debug=os.getenv('DEBUG', 'false').lower() == 'true'
        )
```

### Dependency Injection Container

```python
# shared/container.py
from typing import Dict, Any, TypeVar, Type
from dataclasses import dataclass

T = TypeVar('T')

class DIContainer:
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, callable] = {}

    def register(self, service_type: Type[T], instance: T) -> None:
        self._services[service_type.__name__] = instance

    def register_factory(self, service_type: Type[T], factory: callable) -> None:
        self._factories[service_type.__name__] = factory

    def get(self, service_type: Type[T]) -> T:
        service_name = service_type.__name__

        if service_name in self._services:
            return self._services[service_name]

        if service_name in self._factories:
            instance = self._factories[service_name]()
            self._services[service_name] = instance
            return instance

        raise ValueError(f"Service {service_name} not registered")

# アプリケーション初期化
def create_container(config: ScraperConfig) -> DIContainer:
    container = DIContainer()

    # Infrastructure
    container.register_factory(
        GoogleAuthService,
        lambda: GoogleAuthService(config.google_api)
    )

    # Core Services
    container.register_factory(
        PlacesAPIClient,
        lambda: PlacesAPIClient(
            api_key=config.google_api.places_api_key,
            delay=config.processing.api_delay
        )
    )

    return container
```

### Event-Driven Architecture

```python
# shared/events.py
from dataclasses import dataclass
from typing import Any, List, Callable
from abc import ABC, abstractmethod

@dataclass
class Event:
    event_type: str
    payload: Any
    timestamp: float

class EventHandler(ABC):
    @abstractmethod
    def handle(self, event: Event) -> None:
        pass

class EventBus:
    def __init__(self):
        self._handlers: Dict[str, List[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event: Event) -> None:
        if event.event_type in self._handlers:
            for handler in self._handlers[event.event_type]:
                handler.handle(event)

# 使用例
class DataProcessedHandler(EventHandler):
    def handle(self, event: Event) -> None:
        logger.info("データ処理完了",
                   place_id=event.payload['place_id'],
                   category=event.payload['category'])

# イベント発行
event_bus.publish(Event(
    event_type="data_processed",
    payload={'place_id': 'test', 'category': 'restaurant'},
    timestamp=time.time()
))
```

## 🚀 次のステップ

### 即座の行動

1. **Phase 1 開始**: ディレクトリ構造の準備
2. **バックアップ作成**: 現在のコードの完全バックアップ
3. **テスト環境構築**: 安全な変更・検証環境

### 今後の拡張

1. **TypeScript 移行準備**: Python → TypeScript 移行戦略
2. **Web API 化**: REST API エンドポイント追加
3. **クラウド対応**: AWS/GCP クラウドサービス統合
4. **リアルタイム処理**: ストリーミング・WebSocket 対応

---

**このリファクタリング計画により、`tools\scraper`は保守性・拡張性・テスト容易性を備えた現代的なアーキテクチャに生まれ変わります。**
