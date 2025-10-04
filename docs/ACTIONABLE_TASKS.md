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

### Phase 1: PWA動作確認 (今日中)

- [x] プレビューサーバー起動
- [x] テスト手順文書作成
- [ ] **ブラウザで動作確認** ← 次のアクション
  - URL: <http://127.0.0.1:4173/sado-restaurant-map/>
  - DevTools → Network → Offline → リロード
  - offline.htmlが表示されることを確認

---

## ⏭️ 次のタスク (優先度順)

### P1-A: テストカバレッジ向上 (Week 1-2)

**目標**: 30.55% → 40%

#### Day 1-2: useMarkerOptimization.test.ts 実装

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

#### Day 3-4: hybridMarkerUtils.test.ts 作成

- [ ] 全25カテゴリのアイコンマッピングテスト
- [ ] エッジケース (undefined, null, 未知カテゴリ)
- [ ] デフォルトアイコンフォールバック確認

**見積**: 2日

---

#### Day 5: CI閾値更新

- [ ] `.github/workflows/ci.yml` 編集

  ```yaml
  # Before: coverage-threshold: 20%
  # After:  coverage-threshold: 35%
  ```

- [ ] コミット & push
- [ ] CI成功確認

**見積**: 0.5日

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

#### analytics.test.ts + abtest/\* テスト (4日)

- [ ] トラッキング関数ユニットテスト
- [ ] A/Bテスト統計的正確性テスト
- [ ] イベント送信テスト (モック)

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
- Week 1 目標: 35%
- Week 2 目標: 40%
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

1. **ブラウザでPWA動作確認** (5分)
   - <http://127.0.0.1:4173/sado-restaurant-map/>
   - DevTools → Offline → リロード
   - 📸 スクリーンショット推奨

2. **useMarkerOptimization.test.ts 実装開始** (2時間)
   - Test 1, 2を実装
   - `pnpm test` で確認

---

**Last Updated**: 2025-10-04
**Next Review**: 2025-10-11 (週次)
