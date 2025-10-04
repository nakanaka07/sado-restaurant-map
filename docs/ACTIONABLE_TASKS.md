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

### Phase 5: Unhandled Errors修正 ✅ 完了 (2025-10-05)

- [x] **checkGAStatus 多層防御実装** ✅ 完了
  - エラー: `TypeError: Cannot read properties of undefined (reading 'catch')`
  - 場所: `App.tsx:228` (GA status check)
  - 修正内容:
    - `typeof window !== 'undefined'` チェック追加
    - `isPromiseLike()` 型ガード実装 (`value?.then` thenability判定)
    - `.catch()` で未処理rejection防止
  - 副次的修正: `scheduleGAStatusCheck()` を useCallback へ抽出 (nesting depth 5→3)

- [x] **SonarQube warnings解決** ✅ 完了
  - typescript:S2004: nesting depth >4 levels → depth 3 に削減
  - typescript:S6544: Promise in boolean conditional → isPromiseLike() guard 追加

- **成果**
  - Unhandled Errors: **10 → 0** (100%解決)
  - 工数: **5分** (Quick Fix達成!)
  - 品質ゲート: type-check ✅, lint ✅, test ✅

### Phase 6: analytics.ts カバレッジ向上 ✅ 完了 (2025-10-05)

- [x] **テスト追加: runGADiagnostics() 詳細テスト** ✅ 完了
  - 新規テスト: **22件追加**
  - テストスイート:
    - runGADiagnostics(): 基本動作、エラーケース、統合検証 (8テスト)
    - sendTestEvents(): イベント送信、エラーハンドリング (3テスト)
    - autoFixGA(): GA自動修復、dataLayer操作 (6テスト)
    - window.gaDebug: デバッグ情報出力、エラーケース (5テスト)
  - 全テストパス: ✅ 416 tests (24 files)

- [x] **カバレッジ向上: 39.17% → 74.14%** ✅ 達成
  - Lines: **+34.97%改善** (39.17% → 74.14%)
  - Branches: 81.08% (30/37)
  - Functions: 84.61% (11/13)
  - Statements: 74.13% (156/211)

- [x] **Type errors解決** ✅ 完了
  - 場所: `analytics.test.ts` (runGADiagnostics() 戻り値)
  - 問題: union type `DiagnosticResult | { error: string }` で型ガード未実装
  - 修正: `if ("error" in diagnostics) { throw new Error(...) }` を7箇所追加

- **成果**
  - 工数: **3時間**
  - カバレッジ改善: **+34.97%** (目標70%達成、+4.14%超過!)
  - 全体カバレッジ: **35.2%** (Week 1目標35%達成 ✅)

### Phase 6.5: SVG最適化 (svgo導入) ✅ 完了 (2025-10-05)

- [x] **svgo 4.3.0 インストール** ✅ 完了
  - devDependency追加: svgo@4.3.0
  - 実行環境: Node.js 22.13.1

- [x] **optimize-svg.js スクリプト作成** ✅ 完了
  - 場所: `scripts/optimize-svg.js`
  - 機能: 再帰的SVG最適化、進捗表示、結果サマリー
  - プラグイン設定:
    - removeViewBox: false (レスポンシブ維持)
    - removeDimensions: true (width/height削除)
    - cleanupIds: true (ID最適化)

- [x] **バッチ最適化実行** ✅ 完了
  - 対象: `src/assets/svg` 配下の全SVGファイル
  - 処理ファイル数: **16ファイル**
  - 元サイズ: 434.67 KB
  - 最適化後: 170.20 KB
  - **削減率: -60.84%** (-264.47 KB)

- [x] **package.json スクリプト統合** ✅ 完了
  - 追加: `"optimize-svg": "node scripts/optimize-svg.js"`

- **成果**
  - 工数: **1時間** (Quick Win達成!)
  - 削減率: **-60.84%** (264.47 KB削減)
  - 品質ゲート: type-check ✅, lint ✅, test ✅, build ✅

### Phase 7: WebP/AVIF 画像最適化 ✅ 完了 (2025-10-05)

- [x] **sharp 0.34.4 インストール** ✅ 完了
  - devDependency追加: sharp@0.34.4 + @img/sharp-win32-x64@0.34.4
  - インストール時間: 11.9s

- [x] **optimize-images.js スクリプト作成** ✅ 完了
  - 場所: `scripts/optimize-images.js` (217行)
  - 機能: PNG/JPG/JPEG → WebP/AVIF 変換
  - 設定:
    - WebP: quality 85, effort 6
    - AVIF: quality 60, effort 9, chromaSubsampling '4:2:0'

- [x] **バッチ変換実行** ✅ 完了
  - 対象: 31ファイル (src/assets/png, public)
  - 元サイズ: 2298.96 KB
  - **WebP出力: 970.83 KB (-57.77%, -1328.13 KB)**
  - **AVIF出力: 478.90 KB (-79.17%, -1820.06 KB)**
  - 成功率: **100%** (31/31ファイル)
  - トップ5削減率:
    1. og-image.png: -93.53%
    2. chinese_icon.png: -90.14%
    3. maskable-icon-512x512.png: -88.07%
    4. pwa-512x512.png: -88.07%
    5. cafe_icon.png: -87.25%

- [x] **OptimizedImage.tsx コンポーネント作成** ✅ 完了
  - 場所: `src/components/common/OptimizedImage.tsx` (98行)
  - 機能: Picture要素によるフォールバック配信
  - フォールバックチェーン: AVIF → WebP → PNG/JPEG
  - Props: src, alt (必須), width, height, loading, decoding, className, style, etc.
  - デフォルト: loading="lazy", decoding="async"

- [x] **package.json スクリプト統合** ✅ 完了
  - 追加: `"optimize-images": "node scripts/optimize-images.js"`
  - 追加: `"optimize-assets": "pnpm optimize-svg && pnpm optimize-images"`

- [x] **ESLint fast-refresh warning解決** ✅ 完了
  - 問題: react-refresh/only-export-components in OptimizedImage.tsx
  - 修正: getPreloadLinks() helper export削除 (コンポーネント専用ファイルに)

- [x] **Production Build** ✅ 完了
  - dist/ サイズ: 1795.68 KB (1.75 MB, 65ファイル)
  - 主要チャンク:
    - index.js: 175.28 KB (gzip: 55.95 KB)
    - App.js: 68.03 KB (gzip: 19.86 KB)
    - IntegratedMapView.js: 55.22 KB (gzip: 16.73 KB)

- **成果**
  - 工数: **6時間** (計画12時間の50%削減!)
  - WebP削減率: **-57.77%** (目標-35%の165%達成!)
  - AVIF削減率: **-79.17%** (目標-60%の132%達成!)
  - 品質ゲート: type-check ✅, lint ✅, test ✅ (416/416), build ✅
  - ドキュメント:
    - `docs/PHASE7_WEBP_AVIF_COMPLETION.md`: 完了レポート
    - `docs/OPTIMIZED_IMAGE_USAGE_GUIDE.md`: 使用ガイド

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
- analytics.test.ts完了 (Phase 2): 34.56% (+4.01%)
- hybridMarkerUtils.test.ts補強 (Phase 3): 34.73% (+0.17%)
- CI閾値30%設定 (Phase 4): 34.76% (+0.03%)
- **analytics.ts向上 (Phase 6): 35.2%** (+0.44%) ✅ **Week 1目標35%達成!**
- Week 2 目標: 40% (残り+4.8%)
- 最終目標: 50%+

### 最適化推移 (バンドルサイズ削減)

- SVG最適化 (Phase 6.5): **-60.84%** (434.67 KB → 170.20 KB, -264.47 KB)
- WebP変換 (Phase 7): **-57.77%** (2298.96 KB → 970.83 KB, -1328.13 KB)
- AVIF変換 (Phase 7): **-79.17%** (2298.96 KB → 478.90 KB, -1820.06 KB)
- **累積削減 (AVIF配信時)**: 約 **-68%** (推定)

### マーカー実装数

- 現状: 9種類
- Phase 1完了後: 12種類 (新規3追加)
- Phase 3完了後: 3種類 (統合完了)

### バンドルサイズ

- 現状: main chunk 175KB
- 目標: 150KB (-14%)

---

## 🎯 今日のNext Action

### ✅ 完了済み (2025-10-05)

1. ✅ ~~checkGAStatus Unhandled Errors修正~~ (Phase 5)
   - 10 Unhandled Errors → 0 ✓
   - 多層防御実装 ✓

2. ✅ ~~analytics.ts カバレッジ向上~~ (Phase 6)
   - 39.17% → 74.14% (+34.97%) ✓
   - Week 1目標35%達成 ✓

3. ✅ ~~SVG最適化~~ (Phase 6.5)
   - -60.84% (16ファイル) ✓
   - svgo導入 ✓

4. ✅ ~~WebP/AVIF画像最適化~~ (Phase 7)
   - WebP -57.77%, AVIF -79.17% ✓
   - OptimizedImage.tsx作成 ✓
   - Production Build成功 ✓

### 📋 次の推奨アクション (優先度順)

#### Option 1: Lighthouse Performance測定 (推奨)

**目的**: Phase 7最適化の実効果を測定

```bash
# 1. プレビューサーバー起動
pnpm preview

# 2. Chrome DevTools → Lighthouse実行
# - Performance, Accessibility, Best Practices, SEO測定
# - Mobile + Desktop両方

# 3. 確認項目:
# - Performance スコア (目標: 90+)
# - LCP (目標: <2.5秒)
# - CLS (目標: <0.1)
# - Total Bundle Size
```

**工数**: 15分
**価値**: 最適化ROI確認、次のボトルネック発見

---

#### Option 2: 本番デプロイ (推奨)

**目的**: GitHub Pages に最適化版をデプロイ

```bash
# 1. ビルド & デプロイ
pnpm deploy  # or `pnpm build && gh-pages -d dist`

# 2. 確認: https://nakanaka07.github.io/sado-restaurant-map/
# - AVIF/WebP配信確認 (DevTools Network tab)
# - Core Web Vitals測定
# - モバイル3G環境でのロード時間
```

**工数**: 30分
**価値**: 実環境でのパフォーマンス検証

---

#### Option 3: OptimizedImage統合 (中期タスク)

**目的**: 既存コンポーネントで OptimizedImage 使用開始

```tsx
// Before:
<img src="/assets/png/cafe_icon.png" alt="カフェ" />

// After:
<OptimizedImage src="/assets/png/cafe_icon.png" alt="カフェ" width={48} height={48} />
```

**対象ファイル** (推定):

- `src/components/markers/*.tsx` (マーカーアイコン)
- `src/components/dashboard/*.tsx` (サムネイル)
- `src/pages/*.tsx` (ヒーロー画像)

**工数**: 4時間
**価値**: さらなるLCP改善、実装パターン確立

---

#### Option 4: 次の最適化フェーズ選択

**候補**:

1. **A/Bテストカバレッジ向上** (推奨度: 中)
   - 工数: 3日
   - 効果: 統計的正確性保証

2. **E2Eテスト導入** (推奨度: 高)
   - 工数: 5日
   - 効果: リグレッション防止、CI品質向上

3. **useMarkerOptimization.test.ts実装** (推奨度: 高)
   - 工数: 2日
   - 効果: カバレッジ +1-2% 見込み

**選択基準**:

- リスク: E2Eテスト > A/Bテスト > useMarkerOptimization
- ROI: E2Eテスト ≈ useMarkerOptimization > A/Bテスト
- 緊急度: useMarkerOptimization > E2Eテスト > A/Bテスト

---

**推奨順序**:

1. **Lighthouse測定** (15分) - 即実行推奨
2. **本番デプロイ** (30分) - 同日実行推奨
3. **OptimizedImage統合** or **次フェーズ選択** - 翌日以降

---

**Last Updated**: 2025-10-05
**Next Review**: 2025-10-12 (週次)
