# UnifiedMarker 統合設計

## 目的

9種類のマーカー実装を3種類に集約し、保守性とパフォーマンスを向上

## アーキテクチャ

\\\
UnifiedMarker (Strategy Pattern)
├── PinMarker (シンプル版)
├── IconMarker (ICOOON版)
└── SVGMarker (スケーラブル版)
\\\

## インターフェース

```typescript
interface UnifiedMarkerProps {
  point: MapPoint;
  onClick: (point: MapPoint) => void;
  variant?: "pin" | "icon" | "svg"; // A/Bテストで切替
  size?: "small" | "medium" | "large";
}

export function UnifiedMarker({
  point,
  onClick,
  variant = "icon", // デフォルト
  size = "medium",
}: UnifiedMarkerProps) {
  const MarkerComponent = useMemo(() => {
    switch (variant) {
      case "pin":
        return PinMarker;
      case "icon":
        return IconMarker;
      case "svg":
        return SVGMarker;
      default:
        return IconMarker;
    }
  }, [variant]);

  // Strategy Patternでマーカーを動的に選択
  return MarkerComponent({ point, onClick, size });
}
```

## 移行計画

### Phase 1: 実装 ✅ **完了** (2025-10-04)

- [x] UnifiedMarker インターフェース作成
- [x] 3つの実装クラス作成 (PinMarker/IconMarker/SVGMarker)
- [x] テスト追加 (型定義テスト 11件)
- [x] Cognitive Complexity最適化 (markerColorUtils.ts)
- [x] Quality Gates全通過 (394 tests passing)

### Phase 2: 統合 ✅ **完了** (2025-10-04)

- [x] EnhancedMapContainer で UnifiedMarker 使用開始
  - [x] CircularMarkerContainer との共存設定 (5マーカータイプ共存)
  - [x] props マッピング実装 (MapPoint → UnifiedMarkerProps)
  - [x] デフォルト variant="icon" で既存動作維持
- [x] A/Bテスト設定を variant prop に接続
  - [x] abTestConfig.ts から classifyUser() で variant 値取得
  - [x] mapABTestVariantToMarkerVariant マッピング実装
  - [x] testingModeAvailable && isInTest で自動 "unified-marker" 選択
  - [x] A/B情報パネル追加 (開発環境)
- [ ] パフォーマンスベンチマーク (Phase 3に延期)
  - [ ] バンドルサイズ測定 (before/after)
  - [ ] レンダリング時間計測
  - [ ] メモリプロファイリング
- [ ] E2Eテスト準備 (Phase 3に延期)
  - [ ] Playwright導入検討
  - [ ] マーカークリック/選択/variant切替テスト

### Phase 3: クリーンアップ ✅ (完了: 2025-10-04)

- [x] 旧実装を legacy/ に移動 (9実装 + 1ユーティリティ)
- [x] deprecation warning 追加 (全レガシーファイル)
- [x] ドキュメント更新 (legacy/README.md, IMPLEMENTATION_SUMMARY.md)
- [x] Import参照更新 (6ファイル)
- [x] 型定義統一 (MarkerType簡略化)
- [x] パフォーマンスベンチマーク実行
- [x] **legacy/ ディレクトリ完全削除** (2025-10-05) ✅

## 成功指標

### Phase 1完了時点 ✅

- [x] UnifiedMarker Strategy Pattern実装
- [x] 3つの実装クラス作成
- [x] 型安全性確保 (exactOptionalPropertyTypes対応)
- [x] Quality Gates全通過 (394 tests)

### Phase 2完了時点 ✅

- [x] EnhancedMapContainer統合
- [x] A/Bテスト自動選択機能
- [x] variant切り替えUI実装
- [x] SonarQube警告修正 (0 warnings)

### Phase 3完了時点 ✅ (2025-10-04)

- [x] マーカー実装統合: 9 → 3 (-67%) + legacy分離
- [x] import文削減: レガシーimport全廃
- [x] **バンドルサイズ削減: -322.21 KB (-9.31%)** 🎉
  - Total: 3459.48 KB → 3137.27 KB
  - App Chunk: 133.85 KB → 119.78 KB (-10.51%)
  - Files: 58 → 53 (-5 files)
- [x] ファイル削減: 5ファイル (-8.62%)
- [x] Quality Gates全通過 (394 tests, 0 errors)

### Phase 4-7達成状況 ✅ (2025-10-05時点)

- [x] **バンドルサイズ最終目標: -14%** → **-48.88%達成** 🎉 (目標の3.5倍)
- [x] Tree-shaking最適化 (Phase 4完了)
- [x] 動的import追加 (Phase 4.5完了: APIProvider, IntegratedMapView)
- [x] 画像最適化 (Phase 5-7完了: SVG置換, PNG最適化, WebP/AVIF)
- [x] legacy/ディレクトリ完全削除 (2025-10-05) ✅
- [ ] E2Eテスト導入 (Playwright) - Phase 9検討

## 参考リンク

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [React Component Patterns](https://kentcdodds.com/blog/compound-components-with-react-hooks)
