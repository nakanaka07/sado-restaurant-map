# Workbox ログ制御ガイド

> 🎯 **目的**: 開発環境での Workbox ログ出力の制御方法
> **最終更新**: 2025 年 8 月 27 日

## 🚨 問題

開発環境で Workbox が大量のログを出力し、重要なデバッグ情報が見づらくなる問題の解決方法を説明します。

## ✅ 制御方法

### 1. 通常の開発（推奨）

Workbox を完全無効化して快適な開発環境を実現：

```bash
pnpm dev  # Workboxログなし
```

### 2. PWA 機能テスト

PWA 機能をテストしたい場合のみ一時的に有効化：

```bash
$env:ENABLE_PWA_DEV="true"; pnpm dev
```

### 3. 本番確認

```bash
pnpm build && pnpm preview  # 完全なPWA機能
```

## � トラブルシューティング

### ログが出力される場合

1. 開発サーバー再起動：`Ctrl+C` → `pnpm dev`
2. ブラウザキャッシュクリア：`Ctrl+Shift+R`
3. Service Worker 削除：DevTools → Application → Service Workers → Unregister

### PWA 機能が動作しない場合

環境変数を確認：

```bash
echo $env:ENABLE_PWA_DEV
$env:ENABLE_PWA_DEV="true"  # 設定
```

## 📁 関連ファイル

- `vite.config.ts` - Workbox 設定
- `src/utils/logFilter.ts` - ログフィルタリング

## 💡 ベストプラクティス

1. **通常開発**: Workbox オフで快適に作業
2. **PWA 確認**: 環境変数で一時的に有効化
3. **本番前確認**: ビルド後のプレビューで最終確認

---

**参考**: PWA 機能の詳細は `pwa-configuration-guide.md` を参照
