# ADR-003: データプラットフォーム アーキテクチャ設計

## ステータス

**Accepted** - 2025年8月27日

## コンテキスト

佐渡飲食店マップの`data-platform`モジュールは、Google Places API からデータを収集し、Google Sheets に更新する Python システムです。旧来の`tools/scraper`から名称変更され、以下の要件を満たすアーキテクチャ設計が必要でした：

### 現在の問題

1. **アーキテクチャの問題**
   - 責任分離が不明確（`src/`と`tools/`の役割重複）
   - 密結合したモジュール設計
   - レガシーコードの残存

2. **保守性の問題**
   - テストカバレッジ不足
   - 型安全性の欠如
   - コード重複

3. **拡張性の問題**
   - 新機能追加の困難
   - TypeScript 統合への対応不足

## 決定

以下のクリーンアーキテクチャベースの新構造を採用します：

### 新ディレクトリ構造

```text
data-platform/
├── core/                 # 🧠 ビジネスロジック層
│   ├── processors/       # データ処理エンジン
│   ├── services/         # ドメインサービス
│   └── domain/           # ドメインモデル・バリデーション
├── infrastructure/       # 🏗️ インフラストラクチャ層
│   ├── auth/             # 認証・権限管理
│   ├── storage/          # データ永続化
│   └── external/         # 外部API通信
├── application/          # 🎯 アプリケーション層
│   ├── commands/         # コマンド実行
│   ├── workflows/        # ワークフロー制御
│   └── dto/              # データ転送オブジェクト
├── interface/            # 🎨 インターフェース層
│   ├── cli/              # コマンドライン
│   └── adapters/         # 外部連携アダプター
├── shared/               # 🔗 共有ライブラリ
│   ├── utils/            # ユーティリティ関数
│   ├── constants/        # 定数・設定
│   ├── types/            # 型定義
│   └── exceptions/       # 例外クラス
└── scripts/              # 🚀 スクリプト・ツール
```

### 設計原則

1. **依存性逆転の原則**: 上位レイヤーは下位レイヤーに依存しない
2. **単一責任の原則**: 各モジュールは一つの責任のみ持つ
3. **オープン・クローズドの原則**: 拡張に開かれ、変更に閉じている
4. **依存性注入**: テスト容易性と疎結合を実現

### 主要コンポーネント

#### 1. Core Layer（ビジネスロジック）

```python
# core/domain/interfaces.py
from abc import ABC, abstractmethod

class DataStorage(ABC):
    @abstractmethod
    def save(self, data: Dict, category: str) -> bool: pass

class APIClient(ABC):
    @abstractmethod
    def fetch_place_details(self, place_id: str) -> Dict: pass

# core/processors/data_processor.py
class DataProcessor:
    def __init__(self,
                 api_client: APIClient,
                 storage: DataStorage,
                 validator: DataValidator):
        self._api_client = api_client
        self._storage = storage
        self._validator = validator
```

#### 2. Infrastructure Layer（インフラ）

```python
# infrastructure/external/places_client.py
class PlacesAPIClient(APIClient):
    def fetch_place_details(self, place_id: str) -> Dict:
        # Google Places API実装
        pass

# infrastructure/storage/sheets_storage.py
class SheetsStorage(DataStorage):
    def save(self, data: Dict, category: str) -> bool:
        # Google Sheets実装
        pass
```

#### 3. Application Layer（アプリケーション制御）

```python
# application/workflows/data_processing_workflow.py
class DataProcessingWorkflow:
    def execute(self, category: str, dry_run: bool = False) -> ProcessingResult:
        # ワークフロー実行
        pass
```

#### 4. Interface Layer（外部インターフェース）

```python
# interface/cli/main.py
def main():
    # CLIエントリーポイント
    container = create_container()
    workflow = container.get(DataProcessingWorkflow)
    result = workflow.execute(args.category, args.dry_run)
```

## 根拠

### 1. **保守性向上**

- **明確な責任分離**: 各レイヤーの役割が明確
- **テスト容易性**: 依存性注入によるモック化
- **型安全性**: 厳密な型定義

### 2. **拡張性確保**

- **新機能追加**: プラグイン方式での機能拡張
- **外部システム統合**: アダプターパターンでの対応
- **プロトコル対応**: 新 API・新サービスへの対応

### 3. **品質向上**

- **エラーハンドリング**: 階層化された例外処理
- **ログ管理**: 構造化ログによる運用支援
- **パフォーマンス**: 効率的なデータフロー

### 4. **開発者体験**

- **IDE 支援**: 型ヒントによる補完・検証
- **デバッグ容易性**: レイヤー別のデバッグ
- **学習コスト**: 標準的なアーキテクチャパターン

## 影響

### 正の影響

- **コード品質**: 可読性・保守性の大幅向上
- **開発速度**: 新機能開発の高速化
- **バグ削減**: 型安全性・テストによる品質向上
- **技術的負債**: レガシーコードの完全解消

### 負の影響

- **学習コスト**: 新アーキテクチャの理解が必要
- **移行工数**: 15 日間の開発工数
- **一時的複雑性**: 移行期間中の複雑性増加

### リスク軽減策

- **段階的移行**: 4 フェーズでのリスク分散
- **後方互換性**: レガシーインターフェースの一時維持
- **包括的テスト**: 機能・パフォーマンステスト
- **ロールバック計画**: 問題発生時の迅速復旧

## 実装計画

### フェーズ別スケジュール

| フェーズ | 期間 | 主要活動                     |
| -------- | ---- | ---------------------------- |
| Phase 1  | 3 日 | 構造整理・ファイル移動       |
| Phase 2  | 5 日 | アーキテクチャ改善・DI 導入  |
| Phase 3  | 4 日 | 型安全性・エラーハンドリング |
| Phase 4  | 3 日 | テスト・品質保証             |

### 成功指標

- **コード行数**: 20%削減
- **重複コード**: 50%削減
- **テストカバレッジ**: 80%以上
- **型チェック**: mypy エラー 0 件
- **パフォーマンス**: 既存と同等以上

## 代替案

### 代替案 A: 最小限リファクタリング

既存構造を維持し、部分的改善のみ実施

**却下理由**:

- 根本的問題が解決されない
- 技術的負債が蓄積し続ける
- 将来の拡張性に制限

### 代替案 B: TypeScript 完全移行

Python から TypeScript への完全移行

**却下理由**:

- 移行コストが過大
- Google API ライブラリの制約
- 運用環境の大幅変更が必要

### 代替案 C: マイクロサービス化

機能別に独立したサービスに分割

**却下理由**:

- 現在の規模に対してオーバーエンジニアリング
- 運用複雑性の増加
- インフラコストの増加

## 関連資料

- [SCRAPER_REFACTORING_PLAN.md](./SCRAPER_REFACTORING_PLAN.md) - 詳細リファクタリング計画
- [SCRAPER_REFACTORING_IMPLEMENTATION.md](./SCRAPER_REFACTORING_IMPLEMENTATION.md) - 実装手順書
- [ADR-001-frontend-architecture.md](../architecture/ADR-001-frontend-architecture.md) - フロントエンドアーキテクチャ
- [ADR-002-google-maps-integration.md](../architecture/ADR-002-google-maps-integration.md) - Google Maps 統合

## 承認

| 役割               | 名前           | 承認日     | 署名 |
| ------------------ | -------------- | ---------- | ---- |
| アーキテクト       | GitHub Copilot | 2025-08-27 | ✅   |
| 開発リーダー       | -              | -          | -    |
| プロダクトオーナー | -              | -          | -    |

---

**この決定により、`data-platform`は現代的で保守性の高いアーキテクチャに生まれ変わり、プロジェクト全体の品質向上に貢献します。**
