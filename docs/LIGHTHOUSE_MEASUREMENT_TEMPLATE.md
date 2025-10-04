# Lighthouse 測定結果テンプレート

**測定日**: 2025-10-05
**URL**: `http://127.0.0.1:4173/sado-restaurant-map/`
**測定環境**: Chrome DevTools Lighthouse

---

## 📱 Mobile 測定結果

### Performance

| 指標                               | スコア       | 目標   | 達成 |
| ---------------------------------- | ------------ | ------ | ---- |
| **Performance Score**              | \_\_\_ / 100 | 90+    | ⬜   |
| **First Contentful Paint (FCP)**   | \_\_\_ s     | <1.8s  | ⬜   |
| **Largest Contentful Paint (LCP)** | \_\_\_ s     | <2.5s  | ⬜   |
| **Total Blocking Time (TBT)**      | \_\_\_ ms    | <200ms | ⬜   |
| **Cumulative Layout Shift (CLS)**  | \_\_\_       | <0.1   | ⬜   |
| **Speed Index**                    | \_\_\_ s     | <3.4s  | ⬜   |

### Accessibility

| 指標                    | スコア       | 目標 | 達成 |
| ----------------------- | ------------ | ---- | ---- |
| **Accessibility Score** | \_\_\_ / 100 | 95+  | ⬜   |

### Best Practices

| 指標                     | スコア        | 目標 | 達成 |
| ------------------------ | ------------- | ---- | ---- |
| **Best Practices Score** | \_\_\_ / 100  | 90+  | ⬜   |
| **画像フォーマット**     | WebP/AVIF検出 | ✅   | ⬜   |

### SEO

| 指標          | スコア       | 目標 | 達成 |
| ------------- | ------------ | ---- | ---- |
| **SEO Score** | \_\_\_ / 100 | 90+  | ⬜   |

---

## 🖥️ Desktop 測定結果

### Performance

| 指標                               | スコア       | 目標   | 達成 |
| ---------------------------------- | ------------ | ------ | ---- |
| **Performance Score**              | \_\_\_ / 100 | 95+    | ⬜   |
| **First Contentful Paint (FCP)**   | \_\_\_ s     | <1.0s  | ⬜   |
| **Largest Contentful Paint (LCP)** | \_\_\_ s     | <2.5s  | ⬜   |
| **Total Blocking Time (TBT)**      | \_\_\_ ms    | <150ms | ⬜   |
| **Cumulative Layout Shift (CLS)**  | \_\_\_       | <0.1   | ⬜   |
| **Speed Index**                    | \_\_\_ s     | <2.0s  | ⬜   |

### その他カテゴリ

| カテゴリ           | スコア       | 目標 | 達成 |
| ------------------ | ------------ | ---- | ---- |
| **Accessibility**  | \_\_\_ / 100 | 95+  | ⬜   |
| **Best Practices** | \_\_\_ / 100 | 90+  | ⬜   |
| **SEO**            | \_\_\_ / 100 | 90+  | ⬜   |

---

## 📊 リソースサイズ (Budget比較)

### バジェット設定 (lighthouse-budgets.json)

| リソースタイプ | バジェット | 実測      | 差分      | 達成 |
| -------------- | ---------- | --------- | --------- | ---- |
| **Script**     | 260 KB     | \_\_\_ KB | \_\_\_ KB | ⬜   |
| **Total**      | 600 KB     | \_\_\_ KB | \_\_\_ KB | ⬜   |
| **Image**      | 400 KB     | \_\_\_ KB | \_\_\_ KB | ⬜   |

### 詳細内訳

| ファイル              | サイズ    | 形式          | 備考               |
| --------------------- | --------- | ------------- | ------------------ |
| index.js (main chunk) | \_\_\_ KB | JS (gzip)     | React vendor       |
| App.js                | \_\_\_ KB | JS (gzip)     | メインアプリ       |
| IntegratedMapView.js  | \_\_\_ KB | JS (gzip)     | Map component      |
| google-maps.js        | \_\_\_ KB | JS (gzip)     | Google Maps SDK    |
| **画像合計**          | \_\_\_ KB | AVIF/WebP/PNG | フォーマット別内訳 |

---

## 🎯 Phase 7最適化の効果

### Before (Phase 7前) vs After (Phase 7後)

| 指標                     | Before        | After                 | 改善     |
| ------------------------ | ------------- | --------------------- | -------- |
| **Performance (Mobile)** | \_\_\_        | \_\_\_                | \_\_\_   |
| **LCP**                  | \_\_\_ s      | \_\_\_ s              | \_\_\_ s |
| **Image Size**           | 2299 KB (PNG) | \_\_\_ KB (AVIF/WebP) | -\_\_\_% |
| **Total Bundle**         | \_\_\_ KB     | \_\_\_ KB             | -\_\_\_% |

---

## 🔍 Opportunities (改善提案)

Lighthouse が提案した改善項目:

1. **項目名**
   - 説明: (記入欄)
   - 推定削減: (記入欄) KB / (記入欄) ms

2. **項目名**
   - 説明: (記入欄)
   - 推定削減: (記入欄) KB / (記入欄) ms

3. **項目名**
   - 説明: (記入欄)
   - 推定削減: (記入欄) KB / (記入欄) ms

---

## ⚠️ Diagnostics (診断)

警告またはエラー:

- [ ] (記入欄)
- [ ] (記入欄)
- [ ] (記入欄)

---

## 📝 メモ

### 測定環境

- **ブラウザ**: Chrome / Edge (記入欄)
- **ネットワーク**: (記入欄)
- **CPU**: (記入欄)
- **画面サイズ**: (記入欄)

### 観察事項

- (記入欄)
- (記入欄)
- (記入欄)

### 次のアクション

- [ ] (記入欄)
- [ ] (記入欄)
- [ ] (記入欄)

---

## 📸 スクリーンショット

(Lighthouse レポートのスクリーンショットを貼付)

---

**測定者**: (記入欄)
**承認**: (記入欄)
**次回測定予定**: (記入欄)
