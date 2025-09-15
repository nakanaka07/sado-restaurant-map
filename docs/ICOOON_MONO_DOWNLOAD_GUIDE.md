# 🎌 ICOOON MONO 手動ダウンロードガイド

# 佐渡島レストランマップ用 6カテゴリアイコン取得手順

## 📥 ダウンロード対象アイコン

### 1. 和食 - お茶碗と箸

- URL: <https://icooon-mono.com/category/food>
- 検索: 「お茶碗」「箸」「和食」
- ファイル名: ochawan-hashi.svg
- 推奨サイズ: 512px

### 2. 麺類 - 蕎麦・うどんアイコン

- URL: <https://icooon-mono.com/category/food>
- 検索: 「蕎麦」「うどん」「麺」
- ファイル名: soba-udon.svg
- 推奨サイズ: 512px

### 3. 多国籍料理 - ピザアイコン

- URL: <https://icooon-mono.com/category/food>
- 検索: 「ピザ」
- ファイル名: pizza.svg
- 推奨サイズ: 512px

### 4. カフェ・軽食 - 紅茶アイコン

- URL: <https://icooon-mono.com/category/food>
- 検索: 「紅茶」「コップ」「茶」
- ファイル名: kocha-cup.svg
- 推奨サイズ: 512px

### 5. 居酒屋・バー - ボトルワイン

- URL: <https://icooon-mono.com/category/food>
- 検索: 「ワイン」「ボトル」「酒」
- ファイル名: bottle-wine.svg
- 推奨サイズ: 512px

### 6. 一般レストラン - フォークとナイフ

- URL: <https://icooon-mono.com/category/food>
- 検索: 「フォーク」「ナイフ」「食事」
- ファイル名: fork-knife.svg
- 推奨サイズ: 512px

## 🔧 ダウンロード手順

1. **ICOOON MONOサイト訪問**: <https://icooon-mono.com/category/food>
2. **アイコン検索**: 上記検索キーワードで該当アイコンを探す
3. **アイコン選択**: 目的のアイコンをクリック
4. **サイズ選択**: 512px SVGを選択（最高品質）
5. **ダウンロード実行**: 「SVG」形式でダウンロード
6. **ファイル配置**: `src/assets/markers/icooon-mono/` に配置
7. **ファイル名変更**: 上記ファイル名に統一

## 📁 保存先ディレクトリ構造

```
src/assets/markers/icooon-mono/
├── ochawan-hashi.svg    # 和食
├── soba-udon.svg        # 麺類
├── pizza.svg            # 多国籍料理
├── kocha-cup.svg        # カフェ・軽食
├── bottle-wine.svg      # 居酒屋・バー
└── fork-knife.svg       # 一般レストラン
```

## ⚙️ SVG最適化（推奨）

ダウンロード後、以下の最適化を推奨：

1. **色を白に統一**: `fill="white"` に変更
2. **不要な属性削除**: `id`、`class`など除去
3. **viewBox最適化**: `viewBox="0 0 32 32"` に統一
4. **ファイルサイズ最小化**: 不要な空白・改行除去

## 🎨 品質確認ポイント

- ✅ 32x32px で鮮明に表示される
- ✅ 白色（fill="white"）で統一されている
- ✅ ベクター形式で拡大縮小に対応
- ✅ 日本らしいデザイン表現がある

## 📋 次のステップ

1. ICOOON MONO アイコン6つダウンロード完了
2. Phosphor Icons スクリプト実行（4つ）
3. HybridIconMarker.tsx でのSVG統合
4. 動作テスト・品質確認
