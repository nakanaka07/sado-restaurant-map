# Common Components Directory

このディレクトリには、佐渡島レストランマップアプリケーション全体で使用される共通コンポーネントが含まれています。特にアクセシビリティ対応に特化したコンポーネント群を提供します。

## 📁 ディレクトリ構成

```text
src/components/common/
├── AccessibilityComponents.tsx    # アクセシビリティ専用コンポーネント集
└── index.ts                      # バレルエクスポート
```text

## ♿ アクセシビリティコンポーネント

### `VisuallyHidden`

スクリーンリーダー専用のテキストコンポーネント

**用途**: 視覚的には見えないが、スクリーンリーダーには読み上げられるテキスト

```tsx
interface VisuallyHiddenProps {
  children: React.ReactNode;
}

// 使用例
<VisuallyHidden>検索結果が更新されました</VisuallyHidden>;
```text

**実装の特徴**:

- `position: absolute` で視覚的に隠す
- スクリーンリーダーからはアクセス可能
- WCAG 2.1 準拠の隠しテキスト実装

### `SkipLink`

キーボードナビゲーション用のスキップリンク

**用途**: キーボードユーザーがメインコンテンツに素早く移動できるリンク

```tsx
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

// 使用例
<SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>;
```text

**実装の特徴**:

- フォーカス時のみ表示
- 高コントラストの視覚デザイン
- キーボードナビゲーション最適化

### `AccessibleButton`

アクセシブルなボタンコンポーネント

**用途**: ARIA 属性とキーボード操作に対応した汎用ボタン

```tsx
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

// 使用例
<AccessibleButton
  onClick={handleSearch}
  ariaLabel="レストランを検索"
  variant="primary"
  size="medium"
>
  検索
</AccessibleButton>;
```text

**実装の特徴**:

- 適切な ARIA 属性の自動設定
- キーボード操作対応（Enter、Space）
- 視覚的なフォーカス表示
- バリアント・サイズ対応

### `AccessibleInput`

アクセシブルな入力フィールドコンポーネント

**用途**: ラベル・エラー・説明文に対応した入力フィールド

```tsx
interface AccessibleInputProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  description?: string;
}

// 使用例
<AccessibleInput
  id="restaurant-search"
  label="レストラン名"
  type="search"
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="レストラン名を入力してください"
  description="部分一致で検索できます"
  error={validationError}
  required
/>;
```text

**実装の特徴**:

- ラベルとの適切な関連付け
- エラーメッセージの読み上げ対応
- 説明文の ARIA 記述
- バリデーション状態の視覚表示

### `LiveRegion`

動的コンテンツの読み上げ対応コンポーネント

**用途**: 動的に変化するコンテンツをスクリーンリーダーに通知

```tsx
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: "polite" | "assertive";
}

// 使用例
<LiveRegion priority="assertive">
  {searchResults.length}件のレストランが見つかりました
</LiveRegion>;
```text

**実装の特徴**:

- `aria-live`属性による動的更新通知
- 優先度設定（polite/assertive）
- 検索結果やエラーメッセージの読み上げ

### `AccessibleLoadingSpinner`

アクセシブルなローディング表示コンポーネント

**用途**: 読み込み状態をスクリーンリーダーにも伝える

```tsx
interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  label?: string;
}

// 使用例
<AccessibleLoadingSpinner size="medium" label="レストランデータを読み込み中" />;
```text

**実装の特徴**:

- `aria-label`による状態説明
- `role="status"`による読み上げ対応
- サイズバリエーション対応

### `FocusTrap`

フォーカス制御コンポーネント

**用途**: モーダルダイアログ等でフォーカスを適切に管理

```tsx
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
}

// 使用例
<FocusTrap isActive={isModalOpen} onEscape={closeModal}>
  <div role="dialog" aria-labelledby="modal-title">
    <h2 id="modal-title">レストラン詳細</h2>
    {/* モーダルコンテンツ */}
  </div>
</FocusTrap>;
```text

**実装の特徴**:

- フォーカス可能要素の循環制御
- Escape キーによる閉じる機能
- 初期フォーカス設定

## 🎯 使用方法

### 基本的なインポート

```tsx
// 統一エクスポートからのインポート
import {
  VisuallyHidden,
  SkipLink,
  AccessibleButton,
  AccessibleInput,
  LiveRegion,
  AccessibleLoadingSpinner,
  FocusTrap,
} from "@/components/common";

// 個別インポート
import { AccessibleButton } from "@/components/common/AccessibilityComponents";
```text

### 実用的な使用例

#### 検索フォーム

```tsx
const SearchForm = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <form>
      <SkipLink href="#search-results">検索結果にスキップ</SkipLink>

      <AccessibleInput
        id="search-query"
        label="レストラン検索"
        type="search"
        value={query}
        onChange={setQuery}
        placeholder="レストラン名、料理名で検索"
        error={error}
        description="部分一致で検索できます"
      />

      <AccessibleButton
        type="submit"
        variant="primary"
        ariaLabel="レストランを検索する"
        disabled={loading}
      >
        検索
      </AccessibleButton>

      {loading && <AccessibleLoadingSpinner label="検索中..." />}

      <LiveRegion priority="polite">
        {results.length > 0 &&
          `${results.length}件のレストランが見つかりました`}
      </LiveRegion>
    </form>
  );
};
```text

#### モーダルダイアログ

```tsx
const RestaurantModal = ({ isOpen, onClose, restaurant }) => {
  if (!isOpen) return null;

  return (
    <FocusTrap isActive={isOpen} onEscape={onClose}>
      <div
        role="dialog"
        aria-labelledby="restaurant-title"
        aria-describedby="restaurant-description"
        className="modal-overlay"
      >
        <div className="modal-content">
          <AccessibleButton
            onClick={onClose}
            ariaLabel="モーダルを閉じる"
            variant="secondary"
            size="small"
          >
            ×
          </AccessibleButton>

          <h2 id="restaurant-title">{restaurant.name}</h2>
          <p id="restaurant-description">{restaurant.description}</p>

          <VisuallyHidden>
            モーダルダイアログが開いています。Escapeキーで閉じることができます。
          </VisuallyHidden>
        </div>
      </div>
    </FocusTrap>
  );
};
```text

## 🏗️ 設計原則

### 1. **WCAG 2.1 AA 準拠**

- 適切なコントラスト比の確保
- キーボードアクセシビリティ
- スクリーンリーダー対応
- フォーカス管理

### 2. **セマンティック HTML**

- 適切な HTML 要素の使用
- ARIA 属性の正しい実装
- ランドマークロールの活用

### 3. **ユーザビリティ**

- 直感的な操作性
- 一貫したインタラクション
- エラー処理とフィードバック

### 4. **再利用性**

- 汎用的なプロパティ設計
- カスタマイズ可能なスタイリング
- 型安全なインターフェース

## 🚀 ベストプラクティス

### アクセシビリティチェックリスト

#### キーボードナビゲーション

- [ ] Tab キーでフォーカス移動可能
- [ ] Enter/Space キーで操作可能
- [ ] Escape キーで閉じる機能
- [ ] フォーカス表示が明確

#### スクリーンリーダー対応

- [ ] 適切な ARIA ラベル
- [ ] 状態変化の通知
- [ ] 構造の明確な伝達
- [ ] エラーメッセージの読み上げ

#### 視覚的配慮

- [ ] 十分なコントラスト比
- [ ] フォーカス表示の視認性
- [ ] 色だけに依存しない情報伝達
- [ ] 適切なフォントサイズ

### 使用時の注意点

1. **適切な ARIA 属性の設定**

```tsx
// ❌ 不適切
<div onClick={handleClick}>ボタン</div>

// ✅ 適切
<AccessibleButton onClick={handleClick} ariaLabel="検索実行">
  検索
</AccessibleButton>
```text

1. **フォーカス管理**

```tsx
// ❌ フォーカストラップなし
<div className="modal">
  <input type="text" />
  <button>OK</button>
</div>

// ✅ フォーカストラップあり
<FocusTrap isActive={isOpen}>
  <div role="dialog">
    <input type="text" />
    <button>OK</button>
  </div>
</FocusTrap>
```text

1. **動的コンテンツの通知**

```tsx
// ❌ 通知なし
<div>{searchResults.length} results found</div>

// ✅ ライブリージョンで通知
<LiveRegion priority="polite">
  {searchResults.length}件の結果が見つかりました
</LiveRegion>
```text

## 🔧 開発ガイドライン

### 新しいアクセシビリティコンポーネントの追加

1. **WCAG 2.1 ガイドラインに準拠**
2. **適切な ARIA 属性を実装**
3. **キーボード操作に対応**
4. **TypeScript 型定義を含める**
5. **使用例とドキュメントを作成**

### テスト方法

```tsx
// アクセシビリティテストの例
import { render, screen } from "@testing-library/react";
import { AccessibleButton } from "./AccessibilityComponents";

test("AccessibleButton has proper ARIA attributes", () => {
  render(
    <AccessibleButton ariaLabel="テストボタン" ariaExpanded={false}>
      ボタン
    </AccessibleButton>
  );

  const button = screen.getByRole("button");
  expect(button).toHaveAttribute("aria-label", "テストボタン");
  expect(button).toHaveAttribute("aria-expanded", "false");
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **スクリーンリーダーで読み上げられない**

   - ARIA 属性の確認
   - セマンティック HTML の使用
   - VisuallyHidden コンポーネントの活用

1. **キーボードで操作できない**

   - tabIndex 属性の確認
   - イベントハンドラーの実装確認
   - フォーカス表示の確認

1. **フォーカストラップが動作しない**
   - isActive プロパティの状態確認
   - フォーカス可能要素の存在確認
   - イベントリスナーの設定確認

### デバッグツール

- **axe-core**: アクセシビリティ自動テスト
- **WAVE**: Web アクセシビリティ評価
- **スクリーンリーダー**: NVDA、JAWS 等での実際のテスト
