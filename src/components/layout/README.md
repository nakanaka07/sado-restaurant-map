# Layout Components Directory

このディレクトリには、佐渡島レストランマップアプリケーションのレイアウト関連コンポーネントが含まれています。主にアプリケーション全体の構造とPWA（Progressive Web App）機能を担当します。

## 📁 ディレクトリ構成

```text
src/components/layout/
├── PWABadge.tsx              # PWA機能のバッジ・通知コンポーネント
└── index.ts                  # バレルエクスポート
```text

## 📱 PWA Badge Component

### 概要

`PWABadge`は、Progressive Web App機能を管理・表示するコンポーネントです。Service Workerの状態を監視し、アプリの更新やオフライン対応を通知します。

### 主要機能

#### 🔄 Service Worker管理

- **自動更新チェック**: 1時間ごとに新しいバージョンをチェック
- **オフライン対応**: アプリがオフラインで動作可能になったことを通知
- **更新通知**: 新しいコンテンツが利用可能な際の通知

#### 🎯 ユーザーインタラクション

- **Reloadボタン**: 新しいバージョンへの即座の更新
- **Closeボタン**: 通知の非表示
- **アクセシビリティ対応**: `role="alert"`とARIA属性

### 使用方法

#### 基本的なインポート

```tsx
import { PWABadge } from '@/components/layout';
// または
import PWABadge from '@/components/layout/PWABadge';
```text

#### アプリケーションでの使用

```tsx
import React from 'react';
import PWABadge from '@/components/layout/PWABadge';

function App() {
  return (
    <div className="app">
      {/* メインアプリケーションコンテンツ */}
      <main>
        {/* アプリケーションの内容 */}
      </main>
      
      {/* PWA機能の通知バッジ */}
      <PWABadge />
    </div>
  );
}
```text

### 技術仕様

#### 依存関係

- **`virtual:pwa-register/react`**: Vite PWAプラグインのReactフック
- **`useRegisterSW`**: Service Worker登録・管理フック

#### 状態管理

```tsx
const {
  offlineReady: [offlineReady, setOfflineReady],
  needRefresh: [needRefresh, setNeedRefresh],
  updateServiceWorker,
} = useRegisterSW({
  onRegisteredSW(swUrl, r) {
    // 定期的な更新チェックの登録
    registerPeriodicSync(period, swUrl, r);
  },
});
```text

#### 自動更新機能

```tsx
// 1時間ごとの更新チェック
const period = 60 * 60 * 1000;

function registerPeriodicSync(period, swUrl, r) {
  setInterval(() => {
    // オンライン状態の確認
    if ("onLine" in navigator && !navigator.onLine) return;
    
    // Service Workerの更新チェック
    fetch(swUrl, { cache: "no-store" })
      .then(resp => {
        if (resp?.status === 200) r.update();
      });
  }, period);
}
```text

### UI/UX設計

#### 表示パターン

1. **オフライン準備完了**

```tsx
<span id="toast-message">
  App ready to work offline
</span>
```text

1. **更新が利用可能**

```tsx
<span id="toast-message">
  New content available, click on reload button to update.
</span>
```text

#### ボタンアクション

- **Reload**: `updateServiceWorker(true)`を実行して即座に更新
- **Close**: 通知を非表示にする

### スタイリング

#### CSS クラス構造

```css
.PWABadge {
  /* バッジコンテナ */
}

.PWABadge-toast {
  /* トースト通知のスタイル */
}

.PWABadge-message {
  /* メッセージエリア */
}

.PWABadge-buttons {
  /* ボタンエリア */
}

.PWABadge-toast-button {
  /* ボタンスタイル */
}
```text

#### レスポンシブ対応

- モバイルファーストデザイン
- タッチフレンドリーなボタンサイズ
- 画面サイズに応じた配置調整

### アクセシビリティ

#### ARIA属性

- **`role="alert"`**: 重要な通知として認識
- **`aria-labelledby="toast-message"`**: メッセージとの関連付け
- **`id="toast-message"`**: スクリーンリーダー対応

#### キーボード操作

- Tabキーによるフォーカス移動
- Enterキー/Spaceキーによるボタン操作
- 適切なフォーカス表示

### 設定とカスタマイズ

#### 更新チェック間隔の変更

```tsx
// デフォルト: 1時間
const period = 60 * 60 * 1000;

// カスタム間隔（例: 30分）
const period = 30 * 60 * 1000;
```text

#### Service Worker設定

```tsx
const swOptions = {
  onRegisteredSW(swUrl, r) {
    // カスタム登録処理
  },
  onRegisterError(error) {
    // エラーハンドリング
  },
};
```text

## 🏗️ 設計原則

### 1. **非侵入的な設計**

- ユーザーの操作を妨げない配置
- 必要な時のみ表示
- 簡単に閉じることができる

### 2. **PWAベストプラクティス**

- Service Workerのライフサイクル管理
- オフライン対応の適切な通知
- 更新プロセスの透明性

### 3. **ユーザビリティ重視**

- 明確なメッセージ表示
- 直感的なボタン配置
- アクセシビリティ対応

### 4. **パフォーマンス最適化**

- 軽量な実装
- 必要最小限のDOM操作
- 効率的な状態管理

## 🚀 PWA機能の活用

### インストール促進

```tsx
// カスタムインストールプロンプト
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  return deferredPrompt && (
    <button onClick={() => deferredPrompt.prompt()}>
      アプリをインストール
    </button>
  );
};
```text

### オフライン機能

```tsx
// オフライン状態の検出
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```text

## 🔧 開発ガイドライン

### 新しいレイアウトコンポーネントの追加

1. **適切な責務の分離**
2. **レスポンシブデザイン対応**
3. **アクセシビリティ考慮**
4. **パフォーマンス最適化**
5. **TypeScript型定義**

### テスト方法

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import PWABadge from './PWABadge';

// Service Workerのモック
jest.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [true, jest.fn()],
    needRefresh: [false, jest.fn()],
    updateServiceWorker: jest.fn(),
  }),
}));

test('PWABadge displays offline ready message', () => {
  render(<PWABadge />);
  expect(screen.getByText('App ready to work offline')).toBeInTheDocument();
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **Service Workerが登録されない**
   - HTTPS環境での実行確認
   - Service Workerファイルの存在確認
   - ブラウザの開発者ツールでの確認

1. **更新通知が表示されない**
   - キャッシュの確認
   - Service Workerの更新状態確認
   - ネットワーク接続の確認

1. **スタイルが適用されない**
   - CSSファイルのインポート確認
   - クラス名の確認
   - CSSの読み込み順序確認

### デバッグ方法

```tsx
// Service Worker状態の確認
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('SW registrations:', registrations);
    });
  }
}, []);

// PWA状態のログ出力
console.log('PWA State:', {
  offlineReady,
  needRefresh,
  isOnline: navigator.onLine,
});
```text

### 開発ツール

- **Chrome DevTools**: Application > Service Workers
- **Firefox DevTools**: Application > Service Workers
- **Lighthouse**: PWA監査ツール
