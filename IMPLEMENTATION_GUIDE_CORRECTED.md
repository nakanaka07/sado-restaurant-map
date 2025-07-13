# 🔧 実装ガイドライン & ベストプラクティス

> **策定日**: 2025年7月13日  
> **対象**: 佐渡飲食店マップ プロジェクト  
> **技術スタック**: React 19 + TypeScript 5.7 + Google Maps API

## 🎯 **診断結果を踏まえた優先度対応**

### 🚨 **即座対応 (今日中)**

#### **ESLint設定修正**

```javascript
// eslint.config.js - 修正版
export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // TypeScript最適化 - 修正済み
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      // '@typescript-eslint/prefer-const': 'error', // ← 削除（重複）
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // React 19対応
      'react-hooks/exhaustive-deps': 'warn',
      // パフォーマンス（JavaScriptビルトイン使用）
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: '19.0'
      }
    }
  }
)
```

### ⚡ **優先実装順序**

#### **Phase 1: App.tsx 完全リライト**

```typescript
// src/App.tsx - 新規実装版
import React, { Suspense } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ErrorBoundary } from 'react-error-boundary';

// 遅延ローディング
const RestaurantMap = React.lazy(() => import('@/components/map/RestaurantMap'));
const FilterPanel = React.lazy(() => import('@/components/restaurant/FilterPanel'));

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <div className="app">
          <header className="app-header">
            <h1>佐渡飲食店マップ</h1>
          </header>
          
          <main className="app-main">
            <Suspense fallback={<LoadingSpinner />}>
              <FilterPanel />
              <RestaurantMap />
            </Suspense>
          </main>
        </div>
      </APIProvider>
    </ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div role="alert" className="error-fallback">
      <h2>エラーが発生しました</h2>
      <button onClick={() => window.location.reload()}>
        リロード
      </button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner" aria-label="読み込み中">
      <div className="spinner"></div>
    </div>
  );
}

export default App;
```

## 🗂️ **プロジェクト構造実装指針**

### **推奨ディレクトリ構造**

```text
src/
├── components/
│   ├── common/              # 汎用UIコンポーネント
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── LoadingSpinner/
│   │   └── ErrorBoundary/
│   ├── map/                 # Google Maps関連
│   │   ├── RestaurantMap/
│   │   ├── MarkerCluster/
│   │   ├── InfoWindow/
│   │   └── MapControls/
│   └── restaurant/          # 飲食店関連
│       ├── RestaurantCard/
│       ├── RestaurantList/
│       ├── FilterPanel/
│       └── SearchBox/
├── hooks/                   # カスタムHooks
│   ├── useRestaurants.ts    # ✅ 実装済み
│   ├── useMap.ts
│   ├── useGeolocation.ts
│   └── useLocalStorage.ts
├── data/                    # データ管理
│   ├── api/
│   │   ├── restaurantApi.ts
│   │   └── sheetsApi.ts
│   ├── constants.ts
│   └── mockData.ts
├── utils/                   # ユーティリティ
│   ├── mapUtils.ts
│   ├── formatUtils.ts
│   ├── validationUtils.ts
│   └── dateUtils.ts
├── types/                   # ✅ 実装済み
│   └── index.ts
└── styles/                  # CSS管理
    ├── globals.css
    ├── components/
    └── variables.css
```

### **命名規則 & ファイル構成**

#### **コンポーネント構成パターン**

```text
ComponentName/
├── index.ts                 # エクスポート
├── ComponentName.tsx        # メインコンポーネント
├── ComponentName.module.css # スタイル
├── ComponentName.test.tsx   # テスト
└── ComponentName.stories.tsx # Storybook（将来）
```

#### **TypeScript型定義パターン**

```typescript
// src/types/restaurant.types.ts
export interface Restaurant {
  readonly id: string;
  readonly name: string;
  // ...既存の型定義を活用
}

// src/types/map.types.ts  
export interface MapSettings {
  readonly center: LatLngLiteral;
  readonly zoom: number;
  // ...既存の型定義を活用
}
```

## 🔧 **技術実装ベストプラクティス**

### **React 19 活用方針**

#### **Concurrent Features の活用**

```typescript
// src/hooks/useRestaurants.ts - 既存実装の拡張
import { startTransition, useDeferredValue } from 'react';

export function useRestaurants() {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  
  // 重い検索処理を非ブロッキングに
  const filteredRestaurants = useMemo(() => {
    return filterRestaurants(restaurants, deferredQuery);
  }, [restaurants, deferredQuery]);
  
  const updateSearch = useCallback((query: string) => {
    startTransition(() => {
      setSearchQuery(query);
    });
  }, []);
  
  return { filteredRestaurants, updateSearch };
}
```

#### **Error Boundary の活用**

```typescript
// src/components/common/ErrorBoundary/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('アプリケーションエラー:', error, errorInfo);
        // 将来: エラー報告サービスに送信
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### **Google Maps 統合ベストプラクティス**

#### **Advanced Markers の実装**

```typescript
// src/components/map/RestaurantMarker/RestaurantMarker.tsx
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Restaurant } from '@/types';

interface Props {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
  isSelected?: boolean;
}

export function RestaurantMarker({ restaurant, onClick, isSelected }: Props) {
  return (
    <AdvancedMarker
      position={restaurant.coordinates}
      onClick={() => onClick(restaurant)}
    >
      <Pin
        background={isSelected ? '#ea4335' : '#4285f4'}
        borderColor={isSelected ? '#c5221f' : '#3367d6'}
        glyphColor="#ffffff"
      >
        <span className="restaurant-marker-text">
          {restaurant.name.charAt(0)}
        </span>
      </Pin>
    </AdvancedMarker>
  );
}
```

#### **マーカークラスタリング**

```typescript
// src/components/map/MarkerCluster/MarkerCluster.tsx
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap } from '@vis.gl/react-google-maps';

export function RestaurantMarkerCluster({ restaurants }: Props) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const markers = restaurants.map(restaurant => 
      new google.maps.marker.AdvancedMarkerElement({
        position: restaurant.coordinates,
        map,
        title: restaurant.name,
      })
    );
    
    const clusterer = new MarkerClusterer({ 
      map, 
      markers,
      renderer: {
        render: ({ count, position }) => 
          new google.maps.marker.AdvancedMarkerElement({
            position,
            content: createClusterIcon(count),
          })
      }
    });
    
    return () => clusterer.clearMarkers();
  }, [map, restaurants]);
  
  return null;
}
```

### **データ管理ベストプラクティス**

#### **Google Sheets API 連携**

```typescript
// src/data/api/sheetsApi.ts
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_NAME = 'まとめータベース';

export async function fetchRestaurantData(): Promise<Restaurant[]> {
  try {
    const range = `${SHEET_NAME}!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SheetsApiResponse = await response.json();
    return transformSheetsData(data);
  } catch (error) {
    console.error('レストランデータの取得に失敗:', error);
    throw error;
  }
}

function transformSheetsData(data: SheetsApiResponse): Restaurant[] {
  const [headers, ...rows] = data.values;
  
  return rows.map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    description: row[2] || '',
    cuisineType: row[3] as CuisineType || 'その他',
    priceRange: row[4] as PriceRange || '1000-2000円',
    address: row[5] || '',
    coordinates: {
      lat: parseFloat(row[6]) || 0,
      lng: parseFloat(row[7]) || 0,
    },
    // ...その他のフィールド変換
  }));
}
```

## 🧪 **テスト戦略**

### **テストフレームワーク導入**

```json
// package.json に追加
{
  "devDependencies": {
    "vitest": "^3.2.0",
    "@testing-library/react": "^16.0.0", 
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^25.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### **テスト優先順位**

1. **hooks/useRestaurants.ts** - ビジネスロジック
2. **components/map/RestaurantMap** - コア機能
3. **data/api/sheetsApi.ts** - 外部連携
4. **utils/*.ts** - ユーティリティ関数

## 📊 **パフォーマンス最適化指針**

### **バンドルサイズ最適化**

```typescript
// vite.config.ts - 追加設定
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'google-maps': ['@vis.gl/react-google-maps'],
          'react-vendor': ['react', 'react-dom'],
          'utils': ['src/utils/mapUtils', 'src/utils/formatUtils'],
        },
      },
    },
  },
});
```

### **画像最適化**

```typescript
// src/utils/imageUtils.ts
export function optimizeImageUrl(url: string, width: number): string {
  // Google Sheetsの画像URL最適化
  if (url.includes('drive.google.com')) {
    return `${url}=w${width}-h${Math.round(width * 0.75)}-c`;
  }
  return url;
}
```

## 🔒 **セキュリティ対策**

### **環境変数管理**

```bash
# .env.local
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_GOOGLE_SHEETS_API_KEY=AIza...
VITE_SPREADSHEET_ID=1Bxi...
```

### **API キー保護**

```typescript
// src/utils/validateEnv.ts
export function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_SPREADSHEET_ID'
  ];
  
  const missing = requiredEnvVars.filter(
    key => !import.meta.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

### **バリデーション強化**

```typescript
// src/utils/validationUtils.ts
import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  name: z.string().min(1, '店舗名は必須です'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  priceRange: z.enum(['500円未満', '500-1000円', '1000-2000円', '2000-3000円', '3000円以上']),
});

export function validateRestaurantData(data: unknown): Restaurant {
  return RestaurantSchema.parse(data);
}
```

### **エラーハンドリング強化**

```typescript
// src/hooks/useErrorHandler.ts
import { useCallback, useState } from 'react';

interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    setError({
      message: error.message,
      code: 'code' in error ? String(error.code) : undefined,
      timestamp: new Date(),
    });
    
    // 将来: エラー報告サービスに送信
    if (import.meta.env.PROD) {
      // trackError(error, context);
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
}
```

## ♿ **アクセシビリティ対応**

### **WCAG 2.1 AA 準拠**

```typescript
// src/components/common/Button/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  ariaLabel,
  ariaDescribedBy 
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      type="button"
    >
      {children}
    </button>
  );
}
```

### **キーボードナビゲーション**

```typescript
// src/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(items: Restaurant[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          // 選択されたアイテムのアクション
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);
  
  return { selectedIndex, setSelectedIndex };
}
```

---

**次回更新**: 実装進捗に応じて随時更新  
**重要**: このガイドラインは診断結果を基に策定されており、実装中に発見された課題に応じて柔軟に調整してください。
