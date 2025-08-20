# Assets Directory

このディレクトリには、佐渡島レストランマップアプリケーションで使用される画像アセット・アイコン・グラフィック素材が含まれています。

## 📁 アセット分類

### 🏷️ タイトル・ロゴ関連

- **`title_row1.png`** (56KB): タイトル画像（1行目）
- **`title_row2.png`** (70KB): タイトル画像（2行目）

### 🗺️ 地域・エリアアイコン

佐渡島の各地域を表すマップアイコン：

- **`area_ryotsu-aikawa_icon_map.png`** (133KB): 両津・相川エリア
- **`area_akadomari-hamochi_icon_map.png`** (137KB): 赤泊・羽茂エリア
- **`area_kanai-sawada-niibo-hatano-mano_icon_map.png`** (138KB): 金井・佐和田・新穂・畑野・真野エリア

### 🍽️ レストラン分類アイコン

#### あの系（ANO系）レストラン

- **`ano_icon01.png`** (119KB): あの系アイコン1
- **`ano_icon02.png`** (120KB): あの系アイコン2
- **`ano_icon03.png`** (113KB): あの系アイコン3

#### 志系（SHI系）レストラン

- **`shi_icon01.png`** (68KB): 志系アイコン1
- **`shi_icon02.png`** (74KB): 志系アイコン2
- **`shi_icon03.png`** (76KB): 志系アイコン3

### 🧭 ナビゲーション・位置関連

- **`current_location_icon.png`** (78KB): 現在位置アイコン
- **`facing_north_icon.png`** (122KB): 北向き方向アイコン

### 🏆 特別表示アイコン

- **`recommend_icon.png`** (101KB): おすすめ・推奨マーク

### 🚗 設備・サービスアイコン

- **`parking_icon.png`** (28KB): 駐車場アイコン
- **`toilette_icon.png`** (26KB): トイレ設備アイコン

## 🎯 使用方法

### 基本的なインポート

```typescript
// 静的インポート
import titleRow1 from '@/assets/title_row1.png';
import currentLocationIcon from '@/assets/current_location_icon.png';
import parkingIcon from '@/assets/parking_icon.png';

// 動的インポート
const loadAreaIcon = async (area: string) => {
  const { default: icon } = await import(`@/assets/area_${area}_icon_map.png`);
  return icon;
};
```

### React コンポーネントでの使用

```tsx
import React from 'react';
import titleRow1 from '@/assets/title_row1.png';
import titleRow2 from '@/assets/title_row2.png';
import recommendIcon from '@/assets/recommend_icon.png';

// タイトル表示
const AppTitle = () => (
  <div className="app-title">
    <img src={titleRow1} alt="佐渡島レストランマップ" />
    <img src={titleRow2} alt="グルメガイド" />
  </div>
);

// おすすめマーク表示
const RecommendBadge = () => (
  <img
    src={recommendIcon}
    alt="おすすめ"
    className="recommend-badge"
    width="24"
    height="24"
  />
);
```

### マップマーカーでの使用

```tsx
import { Marker } from '@vis.gl/react-google-maps';
import anoIcon01 from '@/assets/ano_icon01.png';
import shiIcon01 from '@/assets/shi_icon01.png';
import currentLocationIcon from '@/assets/current_location_icon.png';

// レストランタイプ別マーカー
const RestaurantMarker = ({ restaurant, position }) => {
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'ano': return anoIcon01;
      case 'shi': return shiIcon01;
      default: return currentLocationIcon;
    }
  };

  return (
    <Marker
      position={position}
      icon={{
        url: getMarkerIcon(restaurant.type),
        scaledSize: new google.maps.Size(32, 32),
      }}
    />
  );
};
```

### CSS での使用

```css
/* 背景画像として使用 */
.area-ryotsu-aikawa {
  background-image: url('@/assets/area_ryotsu-aikawa_icon_map.png');
  background-size: contain;
  background-repeat: no-repeat;
}

/* アイコンスプライト */
.icon-parking {
  background: url('@/assets/parking_icon.png') no-repeat;
  width: 24px;
  height: 24px;
}

.icon-toilet {
  background: url('@/assets/toilette_icon.png') no-repeat;
  width: 24px;
  height: 24px;
}
```

## 🏗️ アセット管理原則

### 1. **命名規則**

- **`{category}_{description}_icon.png`**: 一般的なアイコン
- **`{category}_icon{number}.png`**: 連番アイコン
- **`area_{region}_icon_map.png`**: 地域マップアイコン
- **`title_row{number}.png`**: タイトル画像

### 2. **ファイルサイズ最適化**

- **小さなアイコン**: 20-30KB（parking, toilet）
- **中サイズアイコン**: 60-80KB（shi系アイコン）
- **大きなアイコン**: 100-140KB（ano系、area系）

### 3. **画像形式**

- **PNG形式**: 透明度が必要なアイコン・ロゴ
- **最適化済み**: Web用に圧縮・最適化済み

## 📊 アセット詳細情報

### サイズ別分類

```text
小サイズ (20-30KB):
├── toilette_icon.png (26KB)
└── parking_icon.png (28KB)

中サイズ (50-80KB):
├── title_row1.png (56KB)
├── shi_icon01.png (68KB)
├── title_row2.png (70KB)
├── shi_icon02.png (74KB)
├── shi_icon03.png (76KB)
└── current_location_icon.png (78KB)

大サイズ (100KB+):
├── recommend_icon.png (101KB)
├── ano_icon03.png (113KB)
├── ano_icon01.png (119KB)
├── ano_icon02.png (120KB)
├── facing_north_icon.png (122KB)
├── area_ryotsu-aikawa_icon_map.png (133KB)
├── area_akadomari-hamochi_icon_map.png (137KB)
└── area_kanai-sawada-niibo-hatano-mano_icon_map.png (138KB)
```

### 用途別分類

```text
UI要素:
├── title_row1.png, title_row2.png (タイトル)
├── recommend_icon.png (推奨マーク)
└── current_location_icon.png (現在位置)

マップマーカー:
├── ano_icon01-03.png (あの系レストラン)
├── shi_icon01-03.png (志系レストラン)
└── area_*.png (地域マーカー)

設備アイコン:
├── parking_icon.png (駐車場)
├── toilette_icon.png (トイレ)
└── facing_north_icon.png (方向指示)
```

## 🚀 パフォーマンス考慮事項

### 1. **遅延読み込み**

```typescript
// 必要な時にのみ読み込み
const LazyIcon = ({ iconName }: { iconName: string }) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null);

  useEffect(() => {
    import(`@/assets/${iconName}.png`)
      .then(module => setIconSrc(module.default))
      .catch(console.error);
  }, [iconName]);

  return iconSrc ? <img src={iconSrc} alt={iconName} /> : null;
};
```

### 2. **プリロード**

```typescript
// 重要なアセットの事前読み込み
const preloadCriticalAssets = () => {
  const criticalAssets = [
    'title_row1.png',
    'title_row2.png',
    'current_location_icon.png',
  ];

  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = new URL(`/src/assets/${asset}`, import.meta.url).href;
    document.head.appendChild(link);
  });
};
```

### 3. **レスポンシブ対応**

```css
/* 画面サイズに応じたアイコンサイズ調整 */
.restaurant-icon {
  width: 24px;
  height: 24px;
}

@media (min-width: 768px) {
  .restaurant-icon {
    width: 32px;
    height: 32px;
  }
}

@media (min-width: 1024px) {
  .restaurant-icon {
    width: 40px;
    height: 40px;
  }
}
```

## 🔧 開発ガイドライン

### 新しいアセットの追加

1. **適切な命名規則に従う**
2. **Web用に最適化する**（圧縮・リサイズ）
3. **適切なサイズを維持する**（100KB以下推奨）
4. **透明度が必要な場合はPNG形式を使用**
5. **このREADMEを更新する**

### アセットの更新

1. **既存ファイルを上書きする前にバックアップ**
2. **関連するコンポーネントでの表示確認**
3. **異なる画面サイズでのテスト**
4. **パフォーマンスへの影響確認**

### 削除時の注意

1. **使用箇所の事前確認**（grep検索推奨）
2. **関連するインポート文の削除**
3. **CSSでの参照確認**
4. **テスト環境での動作確認**

## 🔍 トラブルシューティング

### よくある問題

1. **画像が表示されない**
   - インポートパスの確認
   - ファイル名の大文字小文字確認
   - ファイルの存在確認

2. **画像が大きすぎる/小さすぎる**
   - CSS でのサイズ指定確認
   - 元画像の解像度確認
   - レスポンシブ設定の確認

3. **読み込みが遅い**
   - ファイルサイズの確認
   - 圧縮の検討
   - 遅延読み込みの実装

### デバッグ方法

```typescript
// アセット読み込み状況の確認
const checkAssetLoading = () => {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    console.log(`${img.src}: ${img.complete ? 'loaded' : 'loading'}`);
  });
};
```
