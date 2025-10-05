# A/Bテストとマーカータイプ同期仕様

目的: 右上バッジ / 左パネル / 右下統計の表示整合性を保証し、計測歪みを防止する。

## 1. 用語

- ABTestVariant: original | enhanced-png | svg | testing | phase4-enhanced
- MarkerType: original | enhanced-png | svg | circular-icooon
- Override: ユーザーが UI で AB 割当由来 markerType を変更した状態

## 2. マッピング

| Variant         | MarkerType      | 理由                                    |
| --------------- | --------------- | --------------------------------------- |
| original        | original        | 従来表示                                |
| enhanced-png    | enhanced-png    | Phase1拡張                              |
| svg             | svg             | Phase2拡張                              |
| phase4-enhanced | circular-icooon | Phase4(将来)は circular 系統想定 (暫定) |
| testing         | svg             | 比較中立 (ユーザーが override 可能)     |

`deriveMarkerType(variant)` で決定。override 時はバッジ末尾に `* (override)` を付加。

## 3. バッジ表示 (Devのみ)

`🧪 A/B: <variant> | 👤 <segment> | 🎯 <phase> | 🗺 <markerType>[*] [| 🔬 TEST]`

## 4. イベント

- `assigned` 初期割当
- `interaction` クリック等
- `override_marker_type` ユーザーが markerType を変更 (metadata: from/to)

## 5. 命名注意

左パネル内の "Phase 1/2/3" はマーカー進化段階で A/B ロールアウトフェーズとは別概念。`// TODO(debt:naming)` で統一表記(Generation等)へ後日変更予定。

## 6. 将来拡張

- phase4-enhanced 専用マーカー導入時に mapping 更新
- override 状態を localStorage に保存し再訪時再現
- Storybook で各 variant + markerType 組合せを可視化

---

Last Updated: 2025-09-29
