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

### Phase 1: 実装 (3日)

- [ ] UnifiedMarker インターフェース作成
- [ ] 3つの実装クラス作成
- [ ] テスト追加

### Phase 2: 統合 (2日)

- [ ] RestaurantMap.tsx を UnifiedMarker に置換
- [ ] A/Bテスト設定を variant prop に接続
- [ ] E2Eテスト追加

### Phase 3: クリーンアップ (1日)

- [ ] 旧実装を legacy/ に移動
- [ ] deprecation warning 追加
- [ ] ドキュメント更新

## 成功指標

- マーカー実装数: 9 → 3 (-67%)
- import文: 25 → 8 (-68%)
- バンドルサイズ: -14%
- 理解時間: 60分 → 20分

## 参考リンク

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [React Component Patterns](https://kentcdodds.com/blog/compound-components-with-react-hooks)
