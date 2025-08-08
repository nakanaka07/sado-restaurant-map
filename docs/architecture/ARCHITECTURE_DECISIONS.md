# Architecture Decision Records (ADR)

> **目的**: 佐渡飲食店マップアプリケーションの技術的意思決定の記録  
> **更新日**: 2025 年 8 月 8 日

## ADR 一覧

| ADR 番号            | タイトル                               | 決定日     | ステータス |
| ------------------- | -------------------------------------- | ---------- | ---------- |
| [ADR-001](#adr-001) | React 19 + TypeScript 技術スタック選択 | 2025-08-01 | ✅ 採用    |
| [ADR-002](#adr-002) | Google Maps API 統合方式               | 2025-08-02 | ✅ 採用    |
| [ADR-003](#adr-003) | コンポーネント分割戦略                 | 2025-08-06 | ✅ 採用    |
| [ADR-004](#adr-004) | 軽量バリデーション採用                 | 2025-08-07 | ✅ 採用    |
| [ADR-005](#adr-005) | PWA 実装方針                           | 2025-08-08 | ✅ 採用    |

---

## ADR-001

- 決定日: 2025 年 8 月 1 日
- 決定者: 開発チーム
- ステータス: ✅ 採用

### 背景

佐渡飲食店マップアプリケーションの技術スタックを決定する必要があった。

### 検討した選択肢

1. **React 19 + TypeScript** (採用)
2. Vue 3 + TypeScript
3. Next.js 15 + TypeScript
4. Vanilla JavaScript

### 決定理由

#### ✅ React 19 + TypeScript 採用理由

- **最新機能**: React Compiler、use hook、Concurrent Features
- **型安全性**: TypeScript 5.9 の厳格な型チェック
- **エコシステム**: Google Maps 統合ライブラリの豊富さ
- **パフォーマンス**: React Compiler による自動最適化
- **チーム知見**: 開発チームの習熟度

#### ❌ 他選択肢を除外した理由

- **Vue 3**: Google Maps 統合ライブラリが限定的
- **Next.js 15**: SSR 不要、過剰なフレームワーク
- **Vanilla JS**: 型安全性・保守性の問題

### 決定内容

```json
{
  "frontend": "React 19.0.0",
  "language": "TypeScript 5.9",
  "bundler": "Vite 6.0",
  "testing": "Vitest 4.0 + Testing Library",
  "styling": "CSS4 Variables + Modern CSS"
}
```

### 影響

- ✅ 型安全性向上
- ✅ 開発効率向上
- ✅ 最新機能活用
- ⚠️ 学習コスト（新機能）

### 実装詳細

```typescript
// tsconfig.json 厳格設定
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// React 19新機能活用
const App: React.FC = () => {
  const [restaurants] = use(restaurantPromise); // React 19 use hook
  return <RestaurantMap restaurants={restaurants} />;
};
```

---

## ADR-002

- 決定日: 2025 年 8 月 2 日
- 決定者: 開発チーム
- ステータス: ✅ 採用

### 背景

Google Maps の統合方法について複数の選択肢があった。

### 検討した選択肢

1. **@vis.gl/react-google-maps** (採用)
2. google-maps-react
3. @googlemaps/react-wrapper
4. 直接 Google Maps JavaScript API

### 決定理由

#### @vis.gl/react-google-maps 採用理由

- **最新対応**: Advanced Markers v2 対応
- **React 統合**: Hooks、Suspense ネイティブサポート
- **TypeScript**: 完全な型定義
- **パフォーマンス**: React Compiler との互換性
- **保守性**: Google サポートあり

### 決定内容

```typescript
// 推奨実装パターン
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const RestaurantMap: React.FC = () => (
  <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
    <Map defaultCenter={SADO_CENTER} defaultZoom={DEFAULT_ZOOM}>
      {restaurants.map((restaurant) => (
        <AdvancedMarker key={restaurant.id} position={restaurant.coordinates} />
      ))}
    </Map>
  </APIProvider>
);
```

### 技術制約

- Google Maps API キー必須
- Places API (New) v1 対応
- 商用利用時のライセンス考慮

---

## ADR-003

- 決定日: 2025 年 8 月 6 日
- 決定者: 開発チーム
- ステータス: ✅ 採用

### 背景

大型コンポーネント（FilterPanel 891 行、ModernFilterPanel 599 行）の分割が必要。

### 決定内容

#### 分割基準

1. **300 行上限ルール**: 300 行超過で分割検討
2. **単一責任原則**: 1 つの明確な責任のみ
3. **再利用性**: 他箇所での使用可能性
4. **テスト容易性**: 独立したテスト作成可能

#### 実装パターン

```typescript
// Before: 巨大コンポーネント
FilterPanel.tsx (891 lines)

// After: 機能別分割
FilterPanel/
├── FilterPanel.tsx         # メインコンポーネント (120 lines)
├── SearchFilter.tsx        # 検索機能 (80 lines)
├── CuisineFilter.tsx      # 料理フィルター (95 lines)
├── PriceFilter.tsx        # 価格フィルター (70 lines)
├── DistrictFilter.tsx     # 地区フィルター (110 lines)
├── FilterChips.tsx        # 選択状態表示 (60 lines)
├── useFilterState.ts      # 状態管理Hook (150 lines)
└── index.ts               # barrel export
```

### 成果

- ✅ 1,961 行 → 21 個のコンポーネントに分割
- ✅ 平均 93 行/コンポーネント
- ✅ テスト容易性向上
- ✅ 再利用性確保

---

## ADR-004

- 決定日: 2025 年 8 月 7 日
- 決定者: 開発チーム
- ステータス: ✅ 採用

### 背景

データバリデーションライブラリの選択が必要。

### 検討した選択肢

1. **lightValidation.ts (自作)** (採用)
2. Zod
3. Joi
4. Yup

### 決定理由

#### 軽量バリデーション採用理由

- **軽量性**: バンドルサイズ最小限
- **TypeScript 統合**: ネイティブ型ガード
- **カスタマイズ**: 要件に特化した実装
- **学習コスト**: 既存コードベースとの統一

#### 実装特徴

```typescript
// 型ガード関数による型安全性
export const isRestaurant = (value: unknown): value is Restaurant => {
  // 軽量で高速なバリデーション
};

// ドメイン特化バリデーション
const CUISINE_TYPES = ["日本料理", "寿司", "海鮮" /* ... */] as const;

export const isCuisineType = (value: unknown): value is CuisineType => {
  return isString(value) && CUISINE_TYPES.includes(value as CuisineType);
};
```

### メリット

- ✅ バンドルサイズ: ~2KB (vs Zod ~50KB)
- ✅ パフォーマンス: 高速な型チェック
- ✅ 型安全性: TypeScript 完全統合

---

## ADR-005

- 決定日: 2025 年 8 月 8 日
- 決定者: 開発チーム
- ステータス: ✅ 採用

### 背景

モバイル利用を想定した PWA 対応が必要。

### 決定内容

#### PWA 機能範囲

1. **Manifest v3**: アプリライクな体験
2. **Service Worker**: オフライン対応
3. **Web Share API**: ネイティブ共有
4. **Push Notifications**: 更新通知

#### 実装技術

```typescript
// vite-plugin-pwa 使用
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-maps-cache",
            },
          },
        ],
      },
    }),
  ],
});
```

### Progressive Enhancement

- **基本機能**: JavaScript 無効でも動作
- **拡張機能**: PWA 機能は段階的向上
- **フォールバック**: オフライン時の適切な表示

---

## 更新履歴

| 日付       | ADR     | 変更内容               |
| ---------- | ------- | ---------------------- |
| 2025-08-08 | ADR-005 | PWA 実装方針決定       |
| 2025-08-07 | ADR-004 | 軽量バリデーション採用 |
| 2025-08-06 | ADR-003 | コンポーネント分割完了 |
| 2025-08-02 | ADR-002 | Google Maps API 選択   |
| 2025-08-01 | ADR-001 | 技術スタック決定       |

---

## 参考資料

- [Architecture Decision Records (ADR) Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [React 19 Documentation](https://react.dev/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

最終更新: 2025 年 8 月 8 日
