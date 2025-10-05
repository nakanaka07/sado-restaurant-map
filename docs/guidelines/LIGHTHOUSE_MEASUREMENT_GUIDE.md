# 🚀 Lighthouse 測定ガイド - Phase 7 WebP/AVIF 最適化効果検証

**測定対象**: Phase 7 (WebP/AVIF最適化) の効果測定
**日時**: 2025-10-05
**プレビューサーバー**: 起動済み ✅

---

## ✅ 準備完了

プレビューサーバーは既に起動しています：

- **URL**: <http://127.0.0.1:4173/sado-restaurant-map/>
- **ステータス**: ✅ Running

---

## 📋 測定手順 (Chrome/Edge DevTools推奨)

### Step 1: Chrome/Edge で開く

1. 新しいタブを開く
2. URLバーに入力: `http://127.0.0.1:4173/sado-restaurant-map/`
3. Enter キー

### Step 2: DevTools起動

- **Windows**: `F12` キー
- **Mac**: `Cmd + Option + I`

または:

- 右クリック → 「検証」

### Step 3: Lighthouse タブ選択

DevToolsの上部タブから「Lighthouse」を選択

（見つからない場合: `>>` アイコン → 「Lighthouse」）

### Step 4: 測定設定 (Mobile)

```
Categories (すべて選択):
☑️ Performance
☑️ Accessibility
☑️ Best Practices
☑️ SEO

Device:
🔘 Mobile (デフォルト)

Mode:
🔘 Navigation
```

### Step 5: 測定開始

1. 「Analyze page load」ボタンをクリック
2. 30-60秒待機（自動リロード・測定）

### Step 6: 結果記録 (Mobile)

**Performance** セクション:

- [ ] **Score**: \_\_\_ / 100 (目標: 90+)
- [ ] **FCP**: \_\_\_ s (目標: <1.8s)
- [ ] **LCP**: \_\_\_ s (目標: <2.5s) ⭐ **Phase 7で改善期待**
- [ ] **TBT**: \_\_\_ ms (目標: <200ms)
- [ ] **CLS**: \_\_\_ (目標: <0.1)
- [ ] **Speed Index**: \_\_\_ s

**Opportunities** (改善提案):

- 「Properly size images」: \_\_\_ KB節約可能 (Phase 7で解決済みのはず!)
- 「Serve images in next-gen formats」: ✅ 解決済み (WebP/AVIF)
- その他: \_\_\_

**Diagnostics** (診断):

- 警告数: \_\_\_
- エラー数: \_\_\_

**Resources** (Network タブで確認):

- 画像フォーマット配信: AVIF / WebP / PNG のどれが配信されているか？
- 画像合計サイズ: \_\_\_ KB

### Step 7: Desktop でも測定

1. Lighthouse設定で「Device」を **Desktop** に変更
2. 「Analyze page load」再実行
3. 同様に結果を記録

---

## 🔍 重点チェック項目

### Phase 7最適化の効果確認

#### 1. 画像フォーマット配信 (最重要!)

**DevTools → Network タブ**:

1. Network タブを開く
2. `Img` フィルターをクリック
3. ページをリロード (`Ctrl + R`)
4. 画像リクエストを確認:
   - **AVIF配信**: `cafe_icon.avif`, `og-image.avif` など見えますか？
   - **WebP配信**: `cafe_icon.webp` など見えますか？
   - **PNG fallback**: 古いブラウザ用のPNGも見えますか？

**期待結果**:

- ✅ 最新Chrome: **AVIF** ファイルが配信される (-79.17%削減)
- ✅ Safari 15-16.3: **WebP** ファイルが配信される (-57.77%削減)

#### 2. Lighthouse Opportunities

**"Properly size images"**:

- Before (Phase 7前): 「800 KB節約可能」などの警告
- **After (Phase 7後)**: 警告なし or 大幅削減

**"Serve images in next-gen formats"**:

- Before: 「WebP/AVIFを使用してください」警告
- **After**: ✅ **警告消滅** (WebP/AVIF配信中)

#### 3. LCP (Largest Contentful Paint)

**画像最適化の直接効果**:

- 大きな画像の読み込み時間が短縮 → LCP改善
- 目標: **<2.5秒** (Mobile), **<1.5秒** (Desktop)

**確認方法**:

- Lighthouse Performance → "Largest Contentful Paint" 行
- 「LCP element」をクリック → どの要素がLCPか確認

#### 4. Total Transfer Size

**DevTools → Network タブ下部**:

- "Transferred" の値を確認
- Phase 7前 (推定): 2500-3000 KB
- **Phase 7後 (期待)**: 1500-2000 KB (AVIF配信時 -30-40%削減)

---

## 📊 結果の記録先

測定結果を記録してください:

- **テンプレート**: `docs/LIGHTHOUSE_MEASUREMENT_TEMPLATE.md`
- **最終レポート**: `docs/PHASE7_LIGHTHOUSE_RESULTS.md` (測定後作成)

---

## 🎯 成功基準

### Minimum (最低目標)

- ✅ Performance (Mobile): **85+**
- ✅ LCP: **<3.5秒**
- ✅ AVIF/WebP配信確認
- ✅ 「Serve images in next-gen formats」警告消滅

### Target (目標)

- ✅ Performance (Mobile): **90+**
- ✅ Performance (Desktop): **95+**
- ✅ LCP: **<2.5秒** (Mobile), **<1.5秒** (Desktop)
- ✅ Total Transfer: **<2000 KB** (AVIF配信時)

### Stretch (ストレッチゴール)

- ✅ Performance (Mobile): **95+**
- ✅ LCP: **<2.0秒** (Mobile)
- ✅ 全カテゴリ (A11y, Best Practices, SEO): **90+**

---

## 🐛 トラブルシューティング

### Q1: "Serve images in next-gen formats" 警告が消えない

**原因**: Picture要素が正しくレンダリングされていない

**確認**:

1. DevTools → Elements タブ
2. `<picture>` タグを検索
3. `<source srcSet="....avif" type="image/avif" />` があるか確認

**修正**: OptimizedImage コンポーネントが正しく使用されているか確認

### Q2: PNG がまだ配信されている (AVIF/WebP にならない)

**原因**: ブラウザが古い or Picture要素未対応

**確認**:

- Chrome バージョン: 85+ 必須 (AVIF)
- `chrome://version` で確認

**対応**: 最新のChromeで再測定

### Q3: Network タブに画像が表示されない

**原因**: キャッシュが効いている

**解決**:

1. Network タブで「Disable cache」にチェック
2. `Ctrl + Shift + R` でハードリロード

---

## 📈 比較測定 (オプション)

Phase 7前後の比較を行う場合:

### Before (Phase 7前) を再現

```bash
# Phase 6時点のコミットにチェックアウト
git log --oneline | grep "Phase 6"
git checkout <commit-hash>

# ビルド & プレビュー
pnpm build
pnpm preview

# Lighthouse測定
# → 結果を "Before" として記録
```

### After (Phase 7後) - 現在

```bash
# main ブランチに戻る
git checkout main

# プレビューは既に起動中
# → Lighthouse測定
# → 結果を "After" として記録
```

---

## 🎉 測定完了後

1. **結果をテンプレートに記入**
   - `docs/LIGHTHOUSE_MEASUREMENT_TEMPLATE.md`

2. **スクリーンショット保存**
   - Lighthouse レポート全体
   - Network タブ (AVIF/WebP配信確認)

3. **最終レポート作成**
   - `docs/PHASE7_LIGHTHOUSE_RESULTS.md`
   - Before/After 比較
   - 達成度評価

4. **次のアクション決定**
   - 目標達成 → 本番デプロイ
   - 未達成 → 追加最適化検討

---

**準備完了！測定を開始してください！** 🚀

測定完了後、結果を共有いただければ、詳細分析とレポート作成をサポートします。
