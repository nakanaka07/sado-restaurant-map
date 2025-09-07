# 🎯 正確な実装分析のためのプロンプト指針

## 📋 **実装状況分析の必須手順**

### 1. **実装ファイル直接確認を最優先**

```text
ALWAYS prioritize direct code inspection over documentation:
1. List actual implementation directories first
2. Check file sizes and complexity (line counts)
3. Read actual code implementation before consulting docs
4. Verify class/function implementations exist
```

### 2. **ドキュメント vs 実装の検証**

```text
Never trust documentation progress percentages without verification:
1. Compare documented features with actual code files
2. Check if planning documents contain actual implementation
3. Distinguish between design examples and real implementation
4. Validate progress claims against codebase reality
```

### 3. **Phase 3 実装の正確な調査手順**

```text
For Phase 3-Full implementation analysis:
1. First check: tools/scraper/shared/ directory contents
2. Verify existence of: cache_service.py, celery_config.py, smart_orchestrator.py, ml_engine.py
3. Read file headers and class definitions
4. Count actual implementation lines vs comments/docs
5. Check for working imports and dependencies
```

### 4. **進捗率評価の客観的基準**

```text
Objective implementation progress criteria:
- 0-20%: Basic structure, mostly TODOs
- 21-50%: Core classes defined, partial implementation
- 51-80%: Major functionality implemented, testing needed
- 81-95%: Complete implementation, minor refinements
- 96-100%: Production-ready, fully tested
```

### 5. **必須検証ポイント**

```text
Before stating any progress percentage:
1. Verify actual file existence and size
2. Check class/function implementation completeness
3. Validate against requirements and dependencies
4. Cross-reference with test files and configs
5. Distinguish between planning docs and real code
```

## ⚠️ **避けるべき分析ミス**

### ❌ **ドキュメント依存の罠**

- README.md や計画書の進捗率をそのまま信用
- 設計コード例を実装済みコードと誤認
- タスクマトリックスの状況を検証なしに受け入れ

### ❌ **表面的な調査**

- ディレクトリ構造だけで実装状況を判断
- ファイル存在確認だけで実装完了と判断
- セマンティック検索結果の浅い解釈

## 💡 **推奨分析フロー**

1. **実装ファイル詳細調査** (最優先)
2. **コードレビューと機能確認**
3. **テストファイル・設定ファイル確認**
4. **ドキュメントとの整合性検証**
5. **最終的な進捗率評価**

---

## 重要原則

"Code is the source of truth, documentation is secondary"
