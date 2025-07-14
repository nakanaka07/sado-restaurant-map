# 📊 Google Analytics 4 実装ガイド

> **対象**: 佐渡飲食店マップ プロジェクト  
> **設定日**: 2025年7月14日  
> **技術**: React 19 + TypeScript + Google Analytics 4  

## 🎯 **Google Analytics でできること**

### 📈 **佐渡飲食店マップ特有の分析項目**

#### **🗺️ 地理的分析**

- **佐渡島内アクセス**: 地元住民の利用状況
- **島外アクセス**: 観光客・旅行計画者の利用
- **海外アクセス**: インバウンド観光客の関心
- **都道府県別**: どの地域から佐渡に関心があるか

#### **🍽️ 飲食店分析**

- **人気店舗ランキング**: マーカークリック数・詳細表示回数
- **ジャンル別人気度**: 寿司・海鮮・カフェ等の検索頻度
- **価格帯分析**: ユーザーの予算傾向
- **こだわり条件**: 駐車場・禁煙等の重要度

#### **📱 ユーザー行動分析**

- **検索パターン**: どんなキーワードで検索するか
- **フィルター利用**: どの絞り込み条件が使われるか
- **滞在時間**: アプリをどのくらい使うか
- **リピート率**: 再訪問ユーザーの割合

#### **⏰ 時系列分析**

- **観光シーズン**: いつアクセスが増えるか
- **曜日・時間帯**: 利用パターンの分析
- **イベント連動**: 佐渡のイベント時のアクセス変化

## 🔧 **Google Analytics 4 設定手順**

### Step 1: Google Analytics アカウント作成

1. **Google Analytics** (<https://analytics.google.com/>) にアクセス
2. **「測定を開始」** をクリック
3. **アカウント名**: `佐渡飲食店マップ` を入力
4. **プロパティ名**: `sado-restaurant-map` を入力
5. **業種**: `旅行・観光` を選択
6. **ビジネス目標**: `顧客とのエンゲージメントを向上させる` を選択

### Step 2: データストリーム設定

1. **プラットフォーム**: `ウェブ` を選択
2. **ウェブサイト URL**: `https://nakanaka07.github.io`
3. **ストリーム名**: `佐渡飲食店マップ`
4. **測定ID取得**: `G-XXXXXXXXXX` 形式のIDをコピー

### Step 3: 環境変数設定

```bash
# .env.local に追加
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 📊 **React アプリケーション実装**

### gtag設定（推奨手法）

#### src/utils/analytics.ts

```typescript
// Google Analytics 4 設定
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// gtag関数の型定義
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_title?: string;
        page_location?: string;
        custom_map?: Record<string, string>;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}

// Google Analytics初期化
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('GA_MEASUREMENT_ID が設定されていません');
    return;
  }

  // gtag script動的追加
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // gtag設定
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: '佐渡飲食店マップ',
    custom_map: {
      custom_parameter_1: 'restaurant_id',
      custom_parameter_2: 'search_query',
      custom_parameter_3: 'filter_category',
    },
  });
};

// カスタムイベント送信
export const trackEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', eventName, {
    measurement_id: GA_MEASUREMENT_ID,
    ...parameters,
  });
};

// 佐渡飲食店マップ専用イベント関数
export const trackRestaurantClick = (restaurant: {
  id: string;
  name: string;
  category: string;
  priceRange: string;
}) => {
  trackEvent('restaurant_click', {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_category: restaurant.category,
    price_range: restaurant.priceRange,
    event_category: 'restaurant_interaction',
  });
};

export const trackSearch = (query: string, resultCount: number) => {
  trackEvent('search', {
    search_term: query,
    result_count: resultCount,
    event_category: 'search_interaction',
  });
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
    event_category: 'filter_interaction',
  });
};

export const trackMapInteraction = (action: 'zoom' | 'pan' | 'marker_click') => {
  trackEvent('map_interaction', {
    interaction_type: action,
    event_category: 'map_usage',
  });
};
```

#### src/hooks/useAnalytics.ts

```typescript
import { useEffect, useCallback } from 'react';
import {
  trackEvent,
  trackRestaurantClick,
  trackSearch,
  trackFilter,
  trackMapInteraction,
} from '@/utils/analytics';
import type { Restaurant } from '@/types';

export function useAnalytics() {
  // レストラン詳細表示追跡
  const trackRestaurantView = useCallback((restaurant: Restaurant) => {
    trackRestaurantClick(restaurant);
  }, []);

  // 検索行動追跡
  const trackSearchBehavior = useCallback((query: string, resultCount: number) => {
    trackSearch(query, resultCount);
  }, []);

  // フィルター使用追跡
  const trackFilterUsage = useCallback((filterType: string, value: string) => {
    trackFilter(filterType, value);
  }, []);

  // 地図操作追跡
  const trackMapUsage = useCallback((action: 'zoom' | 'pan' | 'marker_click') => {
    trackMapInteraction(action);
  }, []);

  // PWA関連追跡
  const trackPWAUsage = useCallback((action: 'install' | 'standalone_mode') => {
    trackEvent('pwa_usage', {
      pwa_action: action,
      event_category: 'pwa_interaction',
    });
  }, []);

  // ページビュー追跡（SPA対応）
  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      event_category: 'navigation',
    });
  }, []);

  return {
    trackRestaurantView,
    trackSearchBehavior,
    trackFilterUsage,
    trackMapUsage,
    trackPWAUsage,
    trackPageView,
  };
}
```

## 🔌 **コンポーネント統合**

### App.tsx への統合

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { initGA } from '@/utils/analytics';

function App() {
  useEffect(() => {
    // Google Analytics初期化
    initGA();
  }, []);

  // ...existing code...
}
```

### RestaurantMap.tsx への統合

```typescript
// src/components/map/RestaurantMap.tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export function RestaurantMap() {
  const { trackRestaurantView, trackMapUsage } = useAnalytics();

  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    // Analytics追跡
    trackRestaurantView(restaurant);
    trackMapUsage('marker_click');
  }, [trackRestaurantView, trackMapUsage]);

  // ...existing code...
}
```

### FilterPanel.tsx への統合

```typescript
// src/components/restaurant/FilterPanel.tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export function FilterPanel() {
  const { trackSearchBehavior, trackFilterUsage } = useAnalytics();

  const handleSearch = useCallback((query: string) => {
    const results = searchRestaurants(query);
    setSearchQuery(query);
    // Analytics追跡
    trackSearchBehavior(query, results.length);
  }, [trackSearchBehavior]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    // Analytics追跡
    trackFilterUsage('category', category);
  }, [trackFilterUsage]);

  // ...existing code...
}
```

## 📊 **カスタムダッシュボード設定**

### 佐渡飲食店マップ専用レポート

1. **Google Analytics** → **レポート** → **ライブラリ**
2. **カスタムレポート作成**:

#### **🍽️ 飲食店人気度レポート**

- **指標**: `restaurant_click`イベント数
- **ディメンション**: `restaurant_name`, `restaurant_category`
- **フィルター**: `event_category = restaurant_interaction`

#### **🔍 検索行動レポート**

- **指標**: `search`イベント数
- **ディメンション**: `search_term`, `result_count`
- **フィルター**: `event_category = search_interaction`

#### **🗺️ 地図利用レポート**

- **指標**: `map_interaction`イベント数
- **ディメンション**: `interaction_type`
- **フィルター**: `event_category = map_usage`

#### **📱 PWA利用レポート**

- **指標**: `pwa_usage`イベント数
- **ディメンション**: `pwa_action`
- **フィルター**: `event_category = pwa_interaction`

## 🎯 **目標設定・コンバージョン**

### 主要KPI設定

```typescript
// 重要な目標イベント設定
export const trackConversion = (conversionType: string, value?: number) => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: 'JPY',
    event_category: 'business_goal',
  });
};

// 具体的なコンバージョン例
export const trackRestaurantContact = (restaurantId: string) => {
  trackConversion('restaurant_contact', 1);
  trackEvent('restaurant_contact', {
    restaurant_id: restaurantId,
    event_category: 'business_goal',
  });
};
```

## 🚀 **デプロイ設定**

### GitHub Actions への組み込み

```yaml
# .github/workflows/deploy.yml に追加
env:
  VITE_GA_MEASUREMENT_ID: ${{ secrets.GA_MEASUREMENT_ID }}
```

### GitHub Secrets 設定

1. GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**:
   - Name: `GA_MEASUREMENT_ID`
   - Secret: `G-XXXXXXXXXX`

## 📈 **期待される分析データ例**

### 📊 **1週間後の予想データ**

```text
ユニークユーザー: 50-100人
ページビュー: 200-500回
平均セッション時間: 2-5分
最人気店舗: 海鮮市場金太（佐渡らしい店舗）
人気検索: "海鮮", "寿司", "カフェ"
デバイス比率: モバイル70%, デスクトップ30%
地域比率: 新潟県50%, 東京都20%, その他30%
```

### 📊 **1ヶ月後の予想データ**

```text
ユニークユーザー: 500-1000人
観光シーズン分析: 夏季ピーク確認
リピート率: 20-30%
PWA利用率: 10-15%
検索行動パターン: 価格帯フィルター高使用率
地図操作: ズーム・パン高頻度
```

## 🔒 **プライバシー対応**

### GDPR・個人情報保護

```typescript
// プライバシー設定
export const configurePrivacy = () => {
  if (!window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    // IP匿名化
    anonymize_ip: true,
    // 広告機能無効化
    allow_google_signals: false,
    // 地域データ削減
    country: 'JP',
  });
};
```

## ✅ **実装チェックリスト**

- [ ] Google Analytics 4 アカウント作成
- [ ] 測定ID取得・環境変数設定
- [ ] analytics.ts実装
- [ ] useAnalytics Hook実装
- [ ] App.tsx統合
- [ ] RestaurantMap.tsx統合
- [ ] FilterPanel.tsx統合
- [ ] GitHub Secrets設定
- [ ] カスタムレポート作成
- [ ] 目標・コンバージョン設定
- [ ] プライバシー設定
- [ ] 本番環境デプロイ確認

---

**🎯 完了**: Google Analytics 4 実装完了で佐渡飲食店マップの利用状況が完全に見える化！
