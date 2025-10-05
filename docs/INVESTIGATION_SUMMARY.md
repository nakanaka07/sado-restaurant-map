# 依存関係調査 - 実行サマリー

**調査日**: 2025年10月5日
**対象**: `sado-restaurant-map` プロジェクト
**目的**: パフォーマンス低下とマーカー表示問題の原因特定

---

## 🎯 調査結果サマリー

### 主要な発見

#### ✅ 良好な点

1. **React 19 採用**: Concurrent Features活用済み
2. **動的import戦略**: APIProvider, IntegratedMapViewで適用済み
3. **型安全性**: TypeScript 5.7 strict mode
4. **テストカバレッジ**: 50%以上、CI完備

#### ⚠️ 問題点（Critical）

1. **マーカーシステムの三重構造**
   - CircularMarker（旧）+ UnifiedMarker（新）+ EnhancedMapContainer（統合レイヤー）
   - 二重描画の可能性、メモリ使用量増加

2. **A/Bテスト機構の過剰実装**
   - 800行のコード、5種類のバリアント定義
   - 実際には1種類のみ使用（circular-icooon）
   - 初回レンダリングで複雑な分類処理実行

3. **App.tsx の肥大化**
   - 500行、useState × 15個、useCallback × 10個以上
   - 状態管理の複雑化、再レンダリング頻度増加

#### 🟡 改善余地（Medium）

4. **フィルター処理の複雑性**: 8階層の関数呼び出し
5. **useEffect の多用**: 4つのuseEffectが初期レンダリング時に順次実行

---

## 📊 現状のメトリクス

### バンドルサイズ

- **Total**: 1.77MB (69 files)
- **Main Chunk**: ~250KB
- **Google Maps**: ~40KB
- **Markers**: ~45KB

### パフォーマンス（推定）

- **FCP**: ~2.0s
- **LCP**: ~3.5s
- **TTI**: ~4.0s
- **TBT**: ~400ms

### コード量

- **Total**: ~3000行
- **App.tsx**: 500行
- **A/Bテスト関連**: 800行
- **マーカーシステム**: 9ファイル

---

## 💡 推奨アクション（優先順位順）

### 🔴 Phase 1: 緊急対応（7日間）

1. **A/Bテスト完全削除** ⏱️ 2日
   - Impact: 🔴 High（-50KB, -200ms）
   - Effort: 🟡 Medium

2. **マーカー単一化** ⏱️ 2日
   - Impact: 🔴 High（-40KB, マーカー問題解決）
   - Effort: 🟡 Medium

3. **App.tsx リファクタリング** ⏱️ 2日
   - Impact: 🟡 Medium（可読性向上）
   - Effort: 🟢 Small

4. **テスト・デプロイ** ⏱️ 1日

**期待効果**:

- バンドルサイズ: -90KB
- 初回読み込み: -1秒
- マーカー表示: 100%正常動作

### 🟡 Phase 2: パフォーマンス最適化（7日間）

5. **useMapPoints最適化**: フィルタリング処理の軽量化
6. **動的import追加**: FilterPanel, Analytics
7. **React.memo配置**: MapInfoWindow等

**期待効果**:

- 初回読み込み: さらに-0.5秒
- バンドルサイズ: さらに-30KB

### 🟢 Phase 3: アーキテクチャ整理（14日間）

8. **ディレクトリ再編**: features ベース構造
9. **型定義整理**: 集約と削減
10. **ドキュメント更新**: 最新状態反映

---

## 📁 生成ドキュメント

本調査により、以下のドキュメントを作成しました：

1. **`docs/DEPENDENCY_ANALYSIS_REPORT.md`** (完全版)
   - 詳細な依存関係マップ
   - 問題点の深掘り分析
   - 期待効果の定量化

2. **`docs/PHASE1_CLEANUP_PLAN.md`** (実装計画)
   - Day-by-day実装手順
   - コード変更例
   - テスト・検証手順
   - トラブルシューティング

3. **このファイル** (エグゼクティブサマリー)

---

## 🚀 次のステップ

### 即座に開始可能

Phase 1の実装は、以下の手順で開始できます：

```bash
# 1. 作業ブランチ作成
git checkout -b refactor/phase1-cleanup

# 2. Day 1開始（A/Bテスト削除）
# - docs/PHASE1_CLEANUP_PLAN.md の手順に従う

# 3. 各ステップでコミット
git add .
git commit -m "refactor: [description]"

# 4. テスト実行
pnpm type-check && pnpm lint && pnpm test:run

# 5. プッシュ
git push origin refactor/phase1-cleanup
```

### 推奨実施タイミング

- **Phase 1**: 今週中に開始（緊急度: 高）
- **Phase 2**: Phase 1完了後、即開始
- **Phase 3**: Phase 2の成果測定後、段階実施

---

## ⚖️ リスク評価

### 低リスク

- ✅ A/Bテスト削除（実質未使用）
- ✅ マーカー単一化（安定実装に統一）

### 中リスク

- ⚠️ App.tsx リファクタリング（広範囲変更）
  - 緩和策: 段階的コミット、テスト強化

### 高リスク

- 🔴 本番デプロイ
  - 緩和策: ステージング環境検証、ロールバック準備

---

## 📞 サポート

実装中に問題が発生した場合：

1. **トラブルシューティング**: `docs/PHASE1_CLEANUP_PLAN.md` の該当セクション参照
2. **ロールバック手順**: 各ステップでアーカイブ作成済み
3. **テスト失敗時**: エラーメッセージを分析、段階的修正

---

## ✅ 承認と開始

- [ ] レポート内容を確認
- [ ] Phase 1実装計画を承認
- [ ] 作業ブランチ作成
- [ ] Day 1実装開始

**開始準備完了！**
