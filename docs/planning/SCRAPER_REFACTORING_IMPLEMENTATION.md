# 🚀 Scraper Refactoring Implementation Guide

> 🎯 **目的**: `tools\scraper` リファクタリングの段階的実装手順
> **対象**: プロジェクト構造改善（#4 リファクタリング指示）
> **期間**: 15 日間（4 フェーズ）

## 📋 事前準備

### 1. バックアップ作成

```bash
# 現在のコードベース全体をバックアップ
git add .
git commit -m "リファクタリング前のバックアップ"
git tag -a "pre-refactoring-backup" -m "Scraper refactoring starting point"

# 作業ブランチ作成
git checkout -b feature/scraper-refactoring
```

### 2. 環境検証

```bash
# Python環境確認
python --version  # 3.9+
pip list | grep -E "(gspread|requests|google)"

# 現在の動作確認
cd tools/scraper
python src/run_new_unified.py --category restaurants --dry-run
```

### 3. 依存関係分析

```bash
# 既存の依存関係を分析
pip install pipdeptree
pipdeptree --packages gspread,google,requests

# 循環依存チェック
python tools/analysis/check-circular-deps.cjs tools/scraper
```

## 🗓️ Phase 1: 構造整理・クリーンアップ（3 日間）

### Day 1: 新ディレクトリ構造作成

#### Step 1.1: 新構造のディレクトリ作成

```bash
cd tools/scraper

# 新しいディレクトリ構造を作成
mkdir -p core/{processors,services,domain}
mkdir -p infrastructure/{auth,storage,external}
mkdir -p application/{commands,workflows,dto}
mkdir -p interface/{cli,adapters}
mkdir -p shared/{utils,constants,types}
mkdir -p scripts
```

#### Step 1.2: 移行マッピングの確認

```bash
# 移行対象ファイルの確認
find . -name "*.py" -type f | grep -E "(src|processors|utils|tools)" | sort
```

### Day 2: ファイル移動・リネーム

#### Step 2.1: コアモジュールの移動

```bash
# データ処理エンジン
mv processors/new_unified_processor.py core/processors/data_processor.py
mv processors/data_validator.py core/domain/validators.py
mv processors/data_deduplicator.py core/processors/deduplicator.py
mv processors/location_separator.py core/processors/location_processor.py

# 外部サービス連携
mv processors/places_api_client.py infrastructure/external/places_client.py
mv processors/spreadsheet_manager.py infrastructure/storage/sheets_manager.py

# 認証・ユーティリティ
mv utils/google_auth.py infrastructure/auth/google_auth.py
mv utils/translators.py shared/utils/translators.py
mv utils/output_formatter.py shared/utils/formatters.py
```

#### Step 2.2: スクリプト・ツールの移動

```bash
# 実行スクリプト
mv src/run_new_unified.py interface/cli/main.py
mv src/analyze_api_compatibility.py scripts/analyze_compatibility.py

# ツール類
mv tools/complement_missing.py scripts/maintenance/complement_data.py
mv tools/manual_url_extractor.py scripts/utilities/url_extractor.py
mv tools/debug_field_mask.py scripts/debug/field_mask_debug.py
```

### Day 3: レガシーファイル削除・整理

#### Step 3.1: 廃止ファイルの削除

```bash
# 廃止予定ファイルの削除
rm processors/unified_cid_processor.py
rm -rf debug/  # 統合済みデバッグ機能

# 重複ファイルの整理
find . -name "*.py.bak" -delete
find . -name "__pycache__" -type d -exec rm -rf {} +
```

#### Step 3.2: `__init__.py` ファイル作成

```bash
# 各ディレクトリに __init__.py を作成
find . -type d -name "*" -exec touch {}/__init__.py \;
```

## 🗓️ Phase 2: アーキテクチャ改善（5 日間）

### Day 4-5: 依存性注入パターン導入

#### Step 4.1: 設定管理クラス作成

```python
# shared/config/settings.py
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

#### Step 4.2: DI コンテナの実装

```python
# shared/container.py
from typing import Dict, Any, TypeVar, Type

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
```

### Day 6-7: インターフェース・抽象化導入

#### Step 6.1: 抽象基底クラス作成

```python
# core/domain/interfaces.py
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class DataStorage(ABC):
    @abstractmethod
    def save(self, data: Dict, category: str) -> bool:
        pass

    @abstractmethod
    def load(self, identifier: str) -> Dict:
        pass

class APIClient(ABC):
    @abstractmethod
    def fetch_place_details(self, place_id: str) -> Dict:
        pass

    @abstractmethod
    def search_places(self, query: str) -> List[Dict]:
        pass

class DataValidator(ABC):
    @abstractmethod
    def validate(self, data: Dict) -> Dict:
        pass
```

#### Step 6.2: 具象クラスの実装

```python
# infrastructure/storage/sheets_storage.py
from core.domain.interfaces import DataStorage

class SheetsStorage(DataStorage):
    def __init__(self, auth_service, spreadsheet_id: str):
        self._auth_service = auth_service
        self._spreadsheet_id = spreadsheet_id

    def save(self, data: Dict, category: str) -> bool:
        # Google Sheets実装
        pass

    def load(self, identifier: str) -> Dict:
        # Google Sheets実装
        pass
```

### Day 8: エラーハンドリング強化

#### Step 8.1: カスタム例外クラス

```python
# shared/exceptions.py
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

class ConfigurationError(ScraperError):
    """設定エラー"""
    pass
```

## 🗓️ Phase 3: コード品質向上（4 日間）

### Day 9-10: 型安全性向上

#### Step 9.1: 型定義作成

```python
# shared/types/core_types.py
from typing import TypedDict, Literal, Optional, List
from dataclasses import dataclass

class PlaceData(TypedDict):
    place_id: str
    name: str
    address: Optional[str]
    types: List[str]
    rating: Optional[float]
    business_status: Optional[str]

CategoryType = Literal['restaurants', 'parkings', 'toilets']

@dataclass
class ProcessingResult:
    success: bool
    category: CategoryType
    processed_count: int
    error_count: int
    duration: float
    errors: List[str]
```

#### Step 9.2: 型ヒント追加

```python
# 既存のコードに型ヒントを追加
def process_place_data(place_data: PlaceData, category: CategoryType) -> ProcessingResult:
    # 処理実装
    pass
```

### Day 11-12: ログ管理改善

#### Step 11.1: 構造化ログ導入

```python
# shared/logging/logger.py
import logging
import json
from typing import Dict, Any

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, kwargs)

    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, kwargs)

    def _log(self, level: int, message: str, extra_data: Dict[str, Any]):
        log_data = {
            'message': message,
            'timestamp': time.time(),
            **extra_data
        }
        self.logger.log(level, json.dumps(log_data))
```

## 🗓️ Phase 4: テスト・品質保証（3 日間）

### Day 13: 単体テスト導入

#### Step 13.1: テスト環境構築

```bash
# テスト依存関係インストール
pip install pytest pytest-mock pytest-cov

# テストディレクトリ作成
mkdir -p tests/{unit,integration,fixtures}
```

#### Step 13.2: 単体テスト作成

```python
# tests/unit/test_data_processor.py
import pytest
from unittest.mock import Mock
from core.processors.data_processor import DataProcessor

class TestDataProcessor:
    @pytest.fixture
    def mock_api_client(self):
        return Mock()

    @pytest.fixture
    def mock_storage(self):
        return Mock()

    @pytest.fixture
    def processor(self, mock_api_client, mock_storage):
        return DataProcessor(
            api_client=mock_api_client,
            storage=mock_storage
        )

    def test_process_valid_place_data(self, processor, mock_api_client):
        # テスト実装
        pass
```

### Day 14: 統合テスト・品質チェック

#### Step 14.1: 統合テスト

```python
# tests/integration/test_end_to_end.py
import pytest

class TestEndToEndProcessing:
    @pytest.mark.integration
    def test_restaurant_processing_workflow(self):
        # エンドツーエンドテスト
        pass
```

#### Step 14.2: コード品質チェック

```bash
# コード品質ツールのインストール
pip install flake8 black mypy pylint

# 品質チェック実行
flake8 tools/scraper/
black tools/scraper/ --check
mypy tools/scraper/
pylint tools/scraper/
```

### Day 15: ドキュメント更新・最終検証

#### Step 15.1: README 更新

````bash
# 新しいREADME作成
cat > tools/scraper/README.md << 'EOF'
# 🍽️ Sado Restaurant Map - Data Scraper

佐渡飲食店マップのデータ収集システム

## 🚀 使用方法

```bash
# 基本実行
python -m interface.cli.main --category restaurants

# ドライラン
python -m interface.cli.main --category restaurants --dry-run
````

## 🏗️ アーキテクチャ

- **core/**: ビジネスロジック
- **infrastructure/**: 外部システム連携
- **application/**: アプリケーション制御
- **interface/**: 外部インターフェース
- **shared/**: 共通ライブラリ

EOF

````text

#### Step 15.2: 最終動作確認

```bash
# 新アーキテクチャでの動作確認
python -m interface.cli.main --category restaurants --dry-run

# テスト実行
pytest tests/ -v --cov=tools/scraper

# 品質チェック
flake8 tools/scraper/
mypy tools/scraper/
````

## 🔧 移行時の注意点

### 1. 既存システムとの互換性

```python
# 互換性レイヤーの提供
# tools/scraper/legacy_compatibility.py
def run_old_style_processor(*args, **kwargs):
    """レガシーインターフェースの互換性維持"""
    warnings.warn("この関数は廃止予定です。新しいAPIを使用してください",
                  DeprecationWarning)
    return new_processor.process(*args, **kwargs)
```

### 2. データ移行

```bash
# 既存データファイルの移行
python scripts/migration/migrate_data_files.py
```

### 3. 設定ファイル更新

```bash
# 新しい設定形式への移行
python scripts/migration/migrate_config.py
```

## 🔍 検証チェックリスト

### 機能検証

- [ ] レストランデータ処理が正常動作
- [ ] 駐車場データ処理が正常動作
- [ ] トイレデータ処理が正常動作
- [ ] Google Sheets 連携が正常動作
- [ ] Places API 連携が正常動作

### 品質検証

- [ ] 単体テストカバレッジ 80%以上
- [ ] 統合テスト実行成功
- [ ] Lint エラーなし
- [ ] 型チェックエラーなし
- [ ] セキュリティ脆弱性なし

### パフォーマンス検証

- [ ] API 呼び出し回数が既存と同等以下
- [ ] メモリ使用量が既存と同等以下
- [ ] 実行時間が既存と同等以下

## 🚨 ロールバック手順

問題が発生した場合の緊急ロールバック：

```bash
# バックアップからの復元
git checkout pre-refactoring-backup
git checkout -b emergency-rollback

# 必要最小限の修正適用
# ...

# 本番反映
git checkout main
git merge emergency-rollback
```

## 📈 成功指標

### 定量的指標

- **コード行数**: 20%削減
- **重複コード**: 50%削減
- **テストカバレッジ**: 80%以上
- **型安全性**: mypy エラー 0 件

### 定性的指標

- **可読性向上**: コードレビュー時間短縮
- **保守性向上**: 新機能追加工数削減
- **開発者体験**: IDE 支援向上

---

**この実装ガイドに従って段階的にリファクタリングを進めることで、安全かつ効率的に`tools\scraper`をモダンなアーキテクチャに移行できます。**
