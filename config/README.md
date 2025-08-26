# Configuration Directory

このディレクトリには佐渡飲食店マッププロジェクトの設定ファイルが含まれています。

## 📁 ファイル構成

### `eslint.config.js`

**ESLint 設定** - コード品質とスタイルの統一

- **対象**: TypeScript, React ファイル
- **主要ルール**:
  - TypeScript 厳格型チェック
  - React Hooks ルール
  - 未使用変数の検出
  - `any` 型の禁止
- **React 19 対応**: フック依存配列の最適化
- **ECMAScript**: 2022 対応

### `vitest.config.ts`

**テスト設定** - Vitest + React Testing Library

- **環境**: jsdom（ブラウザ環境模擬）
- **React 19 対応**: Concurrent Features 対応（forks pool）
- **カバレッジ**: v8 provider、HTML/JSON/テキストレポート
- **タイムアウト**: 10 秒（安定性重視）
- **エイリアス**: `@/`, `@components/`, `@hooks/` など
- **モック**: PWA register のバーチャルモジュール

### `pwa-assets.config.ts`

**PWA アセット生成設定** - アイコン自動生成

- **プリセット**: minimal2023Preset（最新標準）
- **ソース**: `public/favicon.svg`
- **生成**: 各種サイズの PWA アイコン
- **使用**: `pnpm run generate:pwa-assets`

## 🚀 使用方法

### 開発時のリンティング

```bash
# 全ファイルをチェック
pnpm run lint

# 自動修正を含む
pnpm run lint -- --fix
```

### テスト実行

```bash
# 監視モード
pnpm run test

# 一回実行
pnpm run test:run

# カバレッジ付き
pnpm run test:coverage
```

### PWA アセット生成

```bash
# アイコン生成
pnpm run generate:pwa-assets
```

## ⚙️ カスタマイズ

### ESLint ルールの追加

`eslint.config.js` の `rules` セクションに追加：

```javascript
rules: {
  // カスタムルール
  'custom-rule': 'error',
}
```

### テスト設定の調整

`vitest.config.ts` でタイムアウトやカバレッジを調整：

```typescript
test: {
  testTimeout: 15000, // より長いタイムアウト
  coverage: {
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
}
```

### PWA アイコンのカスタマイズ

`pwa-assets.config.ts` でソース画像やプリセットを変更：

```typescript
export default defineConfig({
  preset: custom2023Preset, // カスタムプリセット
  images: ["public/custom-icon.svg"],
});
```

## 🔧 トラブルシューティング

### ESLint エラーが解決しない

1. TypeScript プロジェクト設定確認

   ```bash
   # tsconfig.json の構文チェック
   npx tsc --noEmit
   ```

2. ESLint キャッシュクリア

   ```bash
   rm -rf .eslintcache
   pnpm run lint
   ```

### テストが失敗する

1. Node.js バージョン確認（18.x 以上推奨）
2. テストセットアップファイル確認

   ```bash
   # setup.ts の存在確認
   ls src/test/setup.ts
   ```

3. 依存関係の再インストール

   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### PWA アセット生成失敗

1. ソース画像の確認

   ```bash
   ls public/favicon.svg
   ```

2. 権限とディスク容量確認
3. 依存関係の更新

   ```bash
   pnpm update @vite-pwa/assets-generator
   ```

## 📚 関連ドキュメント

- **ESLint**: [公式ドキュメント](https://eslint.org/)
- **Vitest**: [公式ドキュメント](https://vitest.dev/)
- **PWA Assets Generator**: [GitHub](https://github.com/vite-pwa/assets-generator)
- **TypeScript ESLint**: [プロジェクトページ](https://typescript-eslint.io/)

---

**更新日**: 2025 年 8 月 27 日
**対象技術**: ESLint 9.18 + Vitest 3.2 + PWA Assets Generator 0.2
