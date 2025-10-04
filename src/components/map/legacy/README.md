# Legacy Marker Components

⚠️ **DEPRECATED**: これらのコンポーネントは非推奨です。新規コードでは使用しないでください。

## 概要

このディレクトリには、UnifiedMarkerシステム導入前の旧マーカー実装が格納されています。
段階的な移行をサポートするため、一時的に保持されていますが、将来のバージョンで削除予定です。

## 移行先

すべてのマーカー表示には `UnifiedMarker` を使用してください：

```typescript
import { UnifiedMarker } from "@/components/map/UnifiedMarker";

// 推奨される使用方法
<UnifiedMarker
  point={point}
  onClick={handleClick}
  variant="icon" // "pin" | "icon" | "svg"
  size="medium"  // "small" | "medium" | "large"
/>
```

## 非推奨コンポーネント一覧

### 1. `OptimizedRestaurantMarker.tsx`

- **移行先**: `UnifiedMarker` with `variant="pin"`
- **理由**: Strategy Patternによる統一実装に移行

### 2. `legacy/v2/AccessibleMarker.tsx`

- **移行先**: `UnifiedMarker` with `variant="icon"`
- **理由**: UnifiedMarkerに全アクセシビリティ機能統合済み

### 3. `legacy/v2/HybridIconMarker.tsx`

- **移行先**: `UnifiedMarker` with `variant="icon"`
- **理由**: IconMarker実装に統合済み

### 4. `legacy/templates/SVGMarkerTemplate.tsx`

- **移行先**: `UnifiedMarker` with `variant="svg"`
- **理由**: SVGMarker実装に統合済み

### 5. `legacy/templates/MarkerShapeSystem.tsx`

- **移行先**: SVGマーカー内部ユーティリティに統合
- **理由**: SVGMarkerに直接組み込み

### 6. `legacy/MapView/EnhancedPNGMarker.tsx`

- **移行先**: `UnifiedMarker` with `variant="icon"`
- **理由**: IconMarkerがPNG機能をカバー

### 7. `legacy/MapView/SVGMarkerSystem.tsx`

- **移行先**: `UnifiedMarker` with `variant="svg"`
- **理由**: SVGMarker実装に統合済み

### 8. `legacy/MapView/MapMarker.tsx`

- **移行先**: `UnifiedMarker` with `variant="pin"`
- **理由**: 基本Pinマーカーに統合

### 9. `legacy/MapView/MarkerComparisonDemo.tsx`

- **移行先**: 削除予定（デモコンポーネント）
- **理由**: UnifiedMarkerで統一され、比較不要

## バンドルサイズへの影響

これらのレガシーコンポーネントをimportしないことで、約485 KB（-14%）のバンドルサイズ削減が期待されます。

## サポート期限

- **Phase 3 (2025-10-04)**: legacy/ディレクトリに移動、deprecation警告追加
- **Phase 4 (予定)**: 完全削除

## 関連ドキュメント

- [unified-marker-design.md](../../../docs/unified-marker-design.md)
- [IMPLEMENTATION_SUMMARY.md](../../../docs/IMPLEMENTATION_SUMMARY.md)
- [ab-test-marker-sync.md](../../../docs/ab-test-marker-sync.md)
