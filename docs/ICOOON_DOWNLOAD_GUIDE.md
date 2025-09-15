# 🎌 ICOOON MONO アイコン ダウンロードガイド

## 🚀 一括ダウンロード手順

### Step 1: ICOOON MONO サイトアクセス

1. **<https://icooon-mono.com/>** にアクセス
2. 右下の「現在 0アイコン 選択中」パネルを確認

### Step 2: 全10アイコン選択

各URLにアクセスしてアイコンを選択カートに追加：

#### 🍚 レストランカテゴリ（8個）

1. **和食** → [お茶碗と箸](https://icooon-mono.com/11333-お茶碗と箸/) ✅ **最適**
2. **麺類** → [ラーメンのアイコン](https://icooon-mono.com/11337-ラーメンのアイコン。/) 🔄 **改善**
3. **焼肉・グリル** → [ステーキアイコン2](https://icooon-mono.com/14898-ステーキアイコン2/) 🔄 **改善**
4. **多国籍料理** → [地球アイコン12](https://icooon-mono.com/14506-地球アイコン12/) 🔄 **改善**
5. **カフェ・軽食** → [紅茶アイコン](https://icooon-mono.com/16295-紅茶アイコン/) ✅ **最適**
6. **居酒屋・バー** → [ボトルワイン](https://icooon-mono.com/11180-ボトルワインのアイコン素材/) ✅ **最適**
7. **ファストフード** → [ハンバーガー7](https://icooon-mono.com/15591-ハンバーガーの無料アイコン7/) ✅ **最適**
8. **一般レストラン** → [フォーク・ナイフ](https://icooon-mono.com/11164-フォークとナイフのお食事アイコン素材/) ✅ **最適**

#### 🏢 施設カテゴリ（2個）

1. **駐車場** → [パーキングのアイコン](https://icooon-mono.com/12509-パーキングのアイコン/)
2. **トイレ** → [トイレのピクトグラム](https://icooon-mono.com/11553-トイレのピクトグラム/)

### Step 3: ダウンロード設定

1. **select size**: `512px` を選択
2. **select file type**: `SVG` を選択
3. 「選択ファイルを一括ダウンロード」をクリック

### Step 4: ファイル名変更とコピー

ダウンロードしたファイルを以下の名前に変更してコピー：

```powershell
# PowerShell でファイル名変更
$downloadPath = "C:\Users\HPE\Downloads"
$targetPath = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\src\assets\markers\icooon"

# 各ファイルをリネーム&コピー
Copy-Item "$downloadPath\11333.svg" "$targetPath\ochawan-hashi.svg"
Copy-Item "$downloadPath\11337.svg" "$targetPath\ramen-icon.svg"
Copy-Item "$downloadPath\14898.svg" "$targetPath\steak-icon2.svg"
Copy-Item "$downloadPath\14506.svg" "$targetPath\earth-icon12.svg"
Copy-Item "$downloadPath\16295.svg" "$targetPath\tea-icon.svg"
Copy-Item "$downloadPath\11180.svg" "$targetPath\wine-bottle.svg"
Copy-Item "$downloadPath\15591.svg" "$targetPath\hamburger-icon7.svg"
Copy-Item "$downloadPath\11164.svg" "$targetPath\fork-knife.svg"
Copy-Item "$downloadPath\12509.svg" "$targetPath\parking-icon.svg"
Copy-Item "$downloadPath\11553.svg" "$targetPath\toilet-pictogram.svg"
```

## ✅ ダウンロード後の確認

### ファイル構成確認

```
src/assets/markers/icooon/
├── ochawan-hashi.svg        # 和食 🍚 ✅
├── ramen-icon.svg           # 麺類 🍜 🔄 改善
├── steak-icon2.svg          # 焼肉・グリル 🥩 🔄 改善
├── earth-icon12.svg         # 多国籍料理 🔄 改善
├── tea-icon.svg             # カフェ・軽食 ☕ ✅
├── wine-bottle.svg          # 居酒屋・バー 🍷 ✅
├── hamburger-icon7.svg      # ファストフード 🍔 ✅
├── fork-knife.svg           # 一般レストラン 🍽️ ✅
├── parking-icon.svg         # 駐車場 🅿️ ✅
└── toilet-pictogram.svg     # トイレ 🚻 ✅
```

### 品質チェック

- [ ] 全10ファイルが存在
- [ ] 全てSVGフォーマット
- [ ] 512px高解像度
- [ ] ICOOON MONO統一品質

## 🎨 カスタマイズ（任意）

### SVGカラー統一

全アイコンを白色（#ffffff）に統一する場合：

```powershell
# PowerShell でSVGカラー一括変更
Get-ChildItem "$targetPath\*.svg" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $content = $content -replace 'fill="[^"]*"', 'fill="#ffffff"'
  $content = $content -replace 'stroke="[^"]*"', 'stroke="#ffffff"'
  Set-Content $_.FullName $content
}
```

## 🚀 統合テスト

ダウンロード完了後にテストコンポーネントで確認：

```tsx
import { IcooonMarker } from "../components/markers/IcooonMarker";

// 全カテゴリテスト
const categories = [
  "japanese",
  "noodles",
  "yakiniku",
  "international",
  "cafe",
  "izakaya",
  "fastfood",
  "general",
  "parking",
  "toilet",
] as const;

categories.map(category => <IcooonMarker key={category} category={category} size="large" />);
```

## 🎉 完了

全10カテゴリICOOON MONO統一完了で、佐渡島レストランマップが日本最高品質のアイコンシステムを獲得！

## 🔄 アイコン改善履歴

### 改善されたアイコン（2025年9月15日）

| カテゴリ         | 旧アイコン            | 新アイコン                 | 改善理由                                               |
| ---------------- | --------------------- | -------------------------- | ------------------------------------------------------ |
| **麺類**         | 蕎麦アイコン (16160)  | ラーメンのアイコン (11337) | 蕎麦のみではラーメン・うどん・パスタ等をカバーできない |
| **焼肉・グリル** | 火のアイコン (13073)  | ステーキアイコン2 (14898)  | 火は抽象的すぎ、肉料理を直接表現                       |
| **多国籍料理**   | ピザアイコン5 (15999) | 地球アイコン12 (14506)     | ピザはイタリア料理のみ、地球で世界各国料理を表現       |

### 適切だったアイコン（変更なし）

- ✅ **和食**: お茶碗と箸 - 日本料理の完璧な表現
- ✅ **カフェ・軽食**: 紅茶アイコン - カフェ文化を適切に表現
- ✅ **居酒屋・バー**: ボトルワイン - アルコールを明確に表現
- ✅ **ファストフード**: ハンバーガー7 - ファストフードの代表格
- ✅ **一般レストラン**: フォーク・ナイフ - 汎用的で分かりやすい
- ✅ **駐車場**: パーキングのアイコン - 国際標準の「P」記号
- ✅ **トイレ**: トイレのピクトグラム - 明確で認識しやすい
