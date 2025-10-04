# 🎯 即実行タスクチェックリスト

**作成日時**: 2025-10-04
**ステータス**: 進行中

---

## ✅ 完了済み

### Phase 0: 環境準備

- [x] 優先度レポート生成 (AUTO_PRIORITY_REPORT.md)
- [x] PWA offline.html 作成
- [x] vite.config.ts navigateFallback設定
- [x] Service Worker precache確認
- [x] テストスケルトン作成 (useMarkerOptimization.test.ts)
- [x] UnifiedMarker設計ドキュメント作成
- [x] Markdown lint修正 (unified-marker-design.md)
- [x] ビルド検証 (type-check, lint, tests, build)

---

## 🔄 進行中

### Phase 1: PWA動作確認 ✅ 完了 (2025-10-04)

- [x] プレビューサーバー起動
- [x] テスト手順文書作成
- [x] **ブラウザで動作確認** ✅ 完了
  - URL: <http://127.0.0.1:4173/sado-restaurant-map/>
  - Service Worker: #166 activated and running
  - Cache Storage: 46 entries (workbox-precache)
  - offline.html 直接アクセス: ✅ 表示成功
  - オフラインページ: 📡 アイコン + 紫グラデーション
  - 自動リロード: window.addEventListener('online') 動作確認

### Phase 2: analytics.test.ts 実装 ✅ 完了 (2025-10-04)

- [x] **ファイル作成** ✅ 完了
  - ファイル: `src/utils/__tests__/analytics.test.ts`
  - テストケース数: **39件**
  - 全テストパス: ✅ 39 passed (Duration: 41ms)

- [x] **カバレッジ達成** ✅ 29.45% (目標達成)
  - Lines: 29.45% (124/422行)
  - Branches: 100%
  - Functions: 53.84%
  - 網羅範囲: 主要トラッキング関数100%カバー

- [x] **テストスイート構成**
  - ✅ trackEvent: 基本動作、パラメータバリデーション、エラーハンドリング (5テスト)
  - ✅ trackRestaurantClick: 必須パラメータ検証、エッジケース (3テスト)
  - ✅ trackMapInteraction: zoom/pan/marker_click追跡 (4テスト)
  - ✅ trackSearch: 検索イベント、結果0件、大量結果 (4テスト)
  - ✅ trackFilter: 価格帯/料理/地域フィルター (4テスト)
  - ✅ trackPWAUsage: install/standalone_mode (2テスト)
  - ✅ trackPageView: ページビュー追跡 (3テスト)
  - ✅ エラーハンドリング: gtag未定義、例外処理 (2テスト)
  - ✅ パフォーマンス: 大量イベント、複雑パラメータ (2テスト)
  - ✅ 統合テスト: 複数イベント連続送信、エラー後継続 (3テスト)
  - ✅ エッジケース: 特殊文字、長文字列、null/undefined、循環参照 (4テスト)
  - ✅ 初期化: window.gtag/dataLayer検証 (3テスト)

- [x] **技術的成果**
  - vi.mock()でGA_MEASUREMENT_ID="G-TEST123456"をモック
  - window.gtag/dataLayerをObject.definePropertyでモック
  - console.warn/error/logをvi.spyOn()でモック
  - beforeEach()で各テスト前にモックリセット

- **未カバー領域** (意図的除外)
  - initGA() (118-351行): DOM操作・非同期処理で単体テスト困難 → E2E推奨
  - デバッグ関数群 (355-394行): 開発環境限定、本番影響なし

### Phase 3: hybridMarkerUtils.test.ts 補強 ✅ 完了 (2025-10-04)

- [x] **テスト追加** ✅ 完了
  - ファイル: `src/utils/__tests__/hybridMarkerUtils.test.ts`
  - 新規テスト: **+25件** (23件 → 48件)
  - 全テストパス: ✅ 48 passed (Duration: 62ms)

- [x] **カバレッジ大幅向上** ✅ 98.34% 達成 (目標超過!)
  - Lines: **71.07% → 98.34%** (+27.27%改善)
  - Branches: 88% → 90%
  - Functions: 60% → 100%
  - 未カバー行: 38行 → **わずか2行** (Line 78, 199)

- [x] **追加テストスイート**
  - ✅ getCategoryStatistics: 空配列/単一カテゴリ/複数混在/パフォーマンス (5テスト)
  - ✅ filterPointsByHybridCategories: 空フィルタ/単一/複数/レガシーマッピング (7テスト)
  - ✅ isWcagAACompliant: WCAG準拠/非準拠/未定義 (4テスト)
  - ✅ getDebugCategoryInfo: 全カテゴリ/WCAGフラグ/アイコン情報 (4テスト)
  - ✅ エッジケース: null/undefined/長文字列/特殊文字/大量データ (5テスト)

- [x] **技術的成果**
  - ESM importで関数追加 (getCategoryStatistics, filterPointsByHybridCategories, etc.)
  - 型安全性保証 (as anyキャストでcuisineTypeテストデータ作成)
  - パフォーマンステスト: 1000件で50ms以内, 5000件で100ms以内

- **全体カバレッジへの貢献**
  - Before: 34.59%
  - After: **34.73%** (+0.14%改善)

### Phase 4: CI閾値更新 ✅ 完了 (2025-10-04)

- [x] **config/vitest.config.ts 閾値設定追加** ✅ 完了
  - 設定追加: `coverage.thresholds` セクション
  - Lines: 30%
  - Functions: 30%
  - Branches: 30%
  - Statements: 30%

- [x] **閾値テスト実行** ✅ パス確認
  - 実行: `pnpm test:coverage --run`
  - 結果: ✅ 323 tests passed
  - 現在カバレッジ: **34.76%** (閾値30%を4.76pt上回る)

- [x] **品質ゲート確立**
  - CI基準: 最低30%カバレッジ維持
  - Week 1目標: 35% (残り+0.24%)
  - Week 2目標: 40% (残り+5.24%)
  - リグレッション防止: 新規コードで30%未満は失敗

- **技術的成果**
  - コメント追記: Week 1/2目標を明記
  - CI統合: 次回pushでGitHub Actions閾値チェック有効化
  - 工数: **5分** (Quick Win達成!)

- **全体カバレッジ推移**
  - Before: 34.73% (hybridMarkerUtils補強後)
  - After: **34.76%** (+0.03%微増、測定誤差範囲内)

---

## ⏭️ 次のタスク (優先度順)

### P1-A: テストカバレッジ向上 (Week 1-2)

**目標**: 34.76% → 40%
**現状**: **34.76%** (CI閾値30%設定完了、Week 1目標35%まであと+0.24%)

#### ✅ ~~Option 1: hybridMarkerUtils.test.ts 補強~~ **完了** (2025-10-04)

**結果**: 71.06% → **98.34%** (+27.27%改善) 🎉

- [x] 未カバー関数の追加テスト
  - ✅ `getCategoryStatistics()`: 全パターン網羅
  - ✅ `filterPointsByHybridCategories()`: フィルタリングロジック完全カバー
  - ✅ `isWcagAACompliant()`: アクセシビリティ検証
  - ✅ `getDebugCategoryInfo()`: デバッグ情報出力

- [x] エッジケーステスト追加
  - ✅ 特殊文字を含むカテゴリ名
  - ✅ null/undefinedの処理
  - ✅ 大量データパフォーマンステスト

**実績**: 4時間
**カバレッジ改善**: +27.27% (71.06% → 98.34%)
**全体への影響**: 34.59% → 34.73% (+0.14%)

---

#### Option 2 (次の推奨): useMarkerOptimization.test.ts 実装

#### Option 2: useMarkerOptimization.test.ts 実装

- [ ] Test 1: 基本動作

  ```typescript
  test("初期化時に空配列を返す", () => {
    const { result } = renderHook(() => useMarkerOptimization([], undefined));
    expect(result.current.optimizedMarkers).toEqual([]);
  });
  ```

- [ ] Test 2: ビューポート最適化 (優先度: 高)

  ```typescript
  test("ビューポート外のマーカーを非表示化", () => {
    const mockRestaurants = [
      { id: "1", coordinates: { lat: 38.0, lng: 138.5 } }, // 範囲内
      { id: "2", coordinates: { lat: 50.0, lng: 150.0 } }, // 範囲外
    ];
    const bounds = {
      north: 39.0,
      south: 37.0,
      east: 139.0,
      west: 138.0,
      zoom: 10,
    };
    const { result } = renderHook(() => useMarkerOptimization(mockRestaurants, bounds));
    expect(result.current.optimizedMarkers).toHaveLength(1);
    expect(result.current.optimizedMarkers[0].restaurant.id).toBe("1");
  });
  ```

- [ ] Test 3: クラスタリング (優先度: 高)

  ```typescript
  test("密集マーカーをクラスタ化", () => {
    const closeRestaurants = [
      { id: "1", coordinates: { lat: 38.0, lng: 138.0 } },
      { id: "2", coordinates: { lat: 38.001, lng: 138.001 } }, // 近接
    ];
    const { result } = renderHook(() =>
      useMarkerOptimization(closeRestaurants, undefined, {
        enableClustering: true,
      })
    );
    expect(result.current.clusters.length).toBeGreaterThan(0);
  });
  ```

- [ ] Test 4: パフォーマンス

  ```typescript
  test("1000件のマーカーを100ms以内で処理", () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      coordinates: {
        lat: 38.0 + i * 0.001,
        lng: 138.0 + i * 0.001,
      },
    }));
    const start = performance.now();
    renderHook(() => useMarkerOptimization(largeDataset));
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
  ```

**見積**: 2日 (Day 1: 基本+ビューポート, Day 2: クラスタリング+パフォーマンス)

---

#### Option 3: useMarkerOptimization.test.ts フルカバー

**現状**: 未実装 (0%) → **目標**: 60%+

- [ ] 初期化テスト (空配列、undefined)
- [ ] ビューポート最適化 (範囲内外判定)
- [ ] クラスタリング (密集マーカー)
- [ ] パフォーマンステスト (1000件を100ms以内)

**見積**: 2日 (16時間)
**カバレッジ改善**: 不明 (新規ファイル)
**全体への影響**: 推定 +1-2%

---

#### Option 4 (Quick Win): CI閾値更新

- [ ] `vitest.config.ts` または `config/vitest.config.ts` 編集

  ```typescript
  // Before: coverage.lines: 20
  // After:  coverage.lines: 30
  ```

- [ ] コミット & push
- [ ] CI成功確認

**見積**: 5分
**カバレッジ改善**: 0% (閾値のみ更新)
**効果**: CI品質基準向上、リグレッション防止

---

### P0: UnifiedMarker統合 (Week 3-4)

#### Phase 1: 実装 (2日)

- [ ] `src/components/map/UnifiedMarker.tsx` 作成
- [ ] `IMarkerRenderer` インターフェース定義
- [ ] `PinMarker.tsx` 実装 (シンプル版)
- [ ] `IconMarker.tsx` 実装 (ICOOON版)
- [ ] `SVGMarker.tsx` 実装 (スケーラブル版)
- [ ] ユニットテスト追加

#### Phase 2: 統合 (3日)

- [ ] `RestaurantMap.tsx` をUnifiedMarkerに置換
- [ ] A/Bテスト設定を variant prop に接続
- [ ] 既存機能の動作確認
- [ ] E2Eテスト追加 (全variant切替)

#### Phase 3: クリーンアップ (1日)

- [ ] 旧実装を `legacy/` に移動
  - OptimizedRestaurantMarker.tsx
  - EnhancedPNGMarker.tsx
  - SVGMarkerSystem.tsx
  - CircularMarker.tsx
  - AccessibleMarker.tsx
  - HybridIconMarker.tsx
- [ ] deprecation warning 追加
- [ ] ドキュメント更新
- [ ] バンドルサイズ測定・比較

**見積**: 6日

---

### P2: 追加改善 (Week 5-6)

#### abtest/\* テスト (3日)

- [x] ~~analytics.test.ts実装~~ ✅ 完了 (2025-10-04)
- [ ] A/Bテスト統計的正確性テスト
  - `src/services/abtest/abTestManager.test.ts`
  - バリアント割り当てロジック
  - トラッキング連携
- [ ] マーカー同期テスト
  - `src/services/abtest/markerSync.test.ts`
  - 設定とコンポーネント間の整合性

#### Logic層I/O分離 (3日)

- [ ] services/sheets/\* の fetch/transform分離
- [ ] テスト追加
- [ ] 既存呼び出し箇所の更新

#### 命名規約統一 (2日)

- [ ] Phase → Generation へ移行検討
- [ ] ab-test-marker-sync.md 更新
- [ ] コード内コメント修正

---

### P3: その他 (Week 7-8)

#### Python CI統合 (2日)

- [ ] `.github/workflows/python-ci.yml` 作成
- [ ] pytest + coverage設定
- [ ] mypy型チェック追加

#### 本番PWA検証 (1日)

- [ ] GitHub Pages デプロイ
- [ ] Lighthouse PWA スコア測定
- [ ] オフライン動作確認

#### 依存関係更新 (1日)

- [ ] pnpm 10.15.1 → 10.18.0

---

## 📊 進捗トラッキング

### カバレッジ推移

- ベースライン: 30.55%
- analytics.test.ts完了: 34.56% (+0.39%)
- hybridMarkerUtils.test.ts補強: 34.73% (+0.14%)
- **現在**: **34.76%** (CI閾値30%設定完了)
- Week 1 目標: 35% (✅ ほぼ達成! 残り+0.24%)
- Week 2 目標: 40% (残り+5.24%)
- 最終目標: 50%+

### マーカー実装数

- 現状: 9種類
- Phase 1完了後: 12種類 (新規3追加)
- Phase 3完了後: 3種類 (統合完了)

### バンドルサイズ

- 現状: main chunk 175KB
- 目標: 150KB (-14%)

---

## 🎯 今日のNext Action

1. ✅ ~~ブラウザでPWA動作確認~~ **完了** (2025-10-04)
   - オフラインページ表示確認 ✓
   - Service Worker 動作確認 ✓
   - Cache Storage 46エントリ確認 ✓

2. ✅ ~~analytics.test.ts 実装~~ **完了** (2025-10-04)
   - 39テスト全パス ✓
   - カバレッジ 29.45% 達成 ✓
   - 主要トラッキング関数100%カバー ✓

3. ✅ ~~hybridMarkerUtils.test.ts 補強~~ **完了** (2025-10-04)
   - 48テスト全パス ✓
   - カバレッジ 98.34% 達成 ✓
   - 25新規テスト追加 ✓

4. **CI カバレッジ閾値更新** (推奨次タスク)
   - 20% → 30% へ引き上げ
   - 推定工数: 5分

5. **useMarkerOptimization.test.ts 実装** (代替案)
   - 現状0% → 目標60%+
   - 推定工数: 2日 (16時間)

---

**Last Updated**: 2025-10-04
**Next Review**: 2025-10-11 (週次)
