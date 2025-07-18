# 📊 Google Analytics 4 カスタムダッシュボード設定手順

> **対象**: 佐渡飲食店マップ プロジェクト  
> **設定完了日**: 2025年7月14日  
> **前提条件**: Google Analytics 4 でイベントデータが正常に収集されていること

## ✅ **イベント送信確認済み**

以下のイベントが正常に記録されています：

- ✅ `app_initialized` - アプリ初期化
- ✅ `page_view` - ページビュー
- ✅ `restaurant_click` - レストラン詳細表示
- ✅ `search` - 検索実行
- ✅ `filter_applied` - フィルター適用
- ✅ `map_interaction` - 地図操作

測定ID: `G-CENFNHFY8K`

## 📈 **Step 1: 探索レポート（Explore）作成**

### **1-1: 基本レポート作成**

1. **Google Analytics** → 左メニュー **「探索」** をクリック
2. **「空白」** テンプレートを選択
3. **「探索を作成」** をクリック

### **1-2: 佐渡飲食店マップ専用レポート**

#### **🍽️ レストラン人気度レポート**

**設定手順**:

1. **レポート名**: `レストラン人気度ランキング`
2. **ディメンション** → **「+」** → 以下を追加：
   - `イベント名`
   - `カスタム パラメータ > restaurant_name` (または `restaurant_id`)
   - `カスタム パラメータ > restaurant_category`
3. **指標** → **「+」** → 以下を追加：
   - `イベント数`
   - `ユーザー数`
4. **フィルタ** → **「+」** → 以下を設定：
   - **ディメンション**: `イベント名`
   - **演算子**: `完全一致`
   - **値**: `restaurant_click`

**期待される結果**: どのレストランが最も人気かのランキング

#### **🔍 検索行動レポート**

**設定手順**:

1. **レポート名**: `検索キーワード分析`
2. **ディメンション** → 以下を追加：
   - `イベント名`
   - `カスタム パラメータ > search_term`
   - `カスタム パラメータ > result_count`
3. **指標** → 以下を追加：
   - `イベント数`
   - `ユーザー数`
4. **フィルタ** → 以下を設定：
   - **ディメンション**: `イベント名`
   - **演算子**: `完全一致`
   - **値**: `search`

**期待される結果**: ユーザーがよく検索するキーワードの分析

#### **🗺️ 地図利用レポート**

**設定手順**:

1. **レポート名**: `地図操作パターン`
2. **ディメンション** → 以下を追加：
   - `イベント名`
   - `カスタム パラメータ > interaction_type`
3. **指標** → 以下を追加：
   - `イベント数`
   - `ユーザー数`
4. **フィルタ** → 以下を設定：
   - **ディメンション**: `イベント名`
   - **演算子**: `完全一致`
   - **値**: `map_interaction`

**期待される結果**: ズーム、パン、マーカークリックの利用状況

#### **📱 フィルター利用レポート**

**設定手順**:

1. **レポート名**: `フィルター利用状況`
2. **ディメンション** → 以下を追加：
   - `イベント名`
   - `カスタム パラメータ > filter_type`
   - `カスタム パラメータ > filter_value`
3. **指標** → 以下を追加：
   - `イベント数`
   - `ユーザー数`
4. **フィルタ** → 以下を設定：
   - **ディメンション**: `イベント名`
   - **演算子**: `完全一致`
   - **値**: `filter_applied`

**期待される結果**: どのフィルター（価格帯、ジャンル等）がよく使われるか

## 📊 **Step 2: ダッシュボード作成**

### **2-1: カスタムコレクション作成**

1. **Google Analytics** → 左メニュー **「レポート」** → **「ライブラリ」**
2. **「コレクションを作成」** をクリック
3. **コレクション名**: `佐渡飲食店マップ分析ダッシュボード`
4. **説明**: `佐渡飲食店マップの利用状況、人気店舗、検索行動の包括的分析`

### **2-2: レポートをダッシュボードに追加**

1. **「詳細レポートを追加」** をクリック
2. 上記で作成した探索レポートを選択して追加：
   - レストラン人気度ランキング
   - 検索キーワード分析
   - 地図操作パターン
   - フィルター利用状況

### **2-3: 標準レポートの追加**

以下の標準レポートも追加：

- **ユーザー属性 > 地理**（佐渡島内外のアクセス分析）
- **エンゲージメント > ページとスクリーン**（ページ滞在時間）
- **リアルタイム**（リアルタイム利用状況監視）

## 🔔 **Step 3: アラート設定**

### **3-1: インテリジェンス アラート作成**

1. **Google Analytics** → 左メニュー **「管理」** → **「インテリジェンス」**
2. **「カスタム アラート」** → **「新しいアラートを作成」**

### **3-2: 佐渡飲食店マップ用アラート**

#### **アクセス急増アラート**

- **名前**: `佐渡飲食店マップ - アクセス急増`
- **指標**: `アクティブユーザー`
- **条件**: `前週比で100%以上増加`
- **頻度**: `日次`
- **通知方法**: `メール`

#### **検索急増アラート**

- **名前**: `佐渡飲食店マップ - 検索急増`
- **指標**: `イベント数`
- **ディメンション**: `イベント名 = search`
- **条件**: `前日比で200%以上増加`
- **頻度**: `日次`

#### **エラー監視アラート**

- **名前**: `佐渡飲食店マップ - エラー発生`
- **指標**: `イベント数`
- **ディメンション**: `イベント名 = exception`
- **条件**: `前日比で50%以上増加`
- **頻度**: `日次`

## 📧 **Step 4: 定期レポート自動化**

### **4-1: 週次レポート設定**

1. 作成したダッシュボード画面で **「共有」** → **「スケジュール」**
2. **配信設定**:
   - **頻度**: `週次` (月曜日 9:00)
   - **形式**: `PDF`
   - **件名**: `佐渡飲食店マップ 週次分析レポート`
   - **本文**: `添付の週次レポートをご確認ください。人気店舗ランキング、検索トレンド、利用状況の分析が含まれています。`

### **4-2: 月次詳細レポート設定**

1. **配信設定**:
   - **頻度**: `月次` (毎月1日 10:00)
   - **形式**: `PDF + データ(.csv)`
   - **件名**: `佐渡飲食店マップ 月次包括分析レポート`
   - **本文**: `月次の詳細分析レポートです。ユーザー行動の変化、季節トレンド、機能改善提案が含まれています。`

## 🎯 **Step 5: カスタムディメンション設定（上級）**

### **5-1: カスタムディメンション追加**

より詳細な分析のため、以下のカスタムディメンションを設定：

1. **管理** → **カスタム定義** → **カスタム ディメンション**
2. **作成** をクリックして以下を追加：

#### **レストラン関連**

- `restaurant_id` - レストランID
- `restaurant_category` - レストランカテゴリ
- `price_range` - 価格帯

#### **ユーザー行動関連**

- `search_term` - 検索キーワード
- `filter_type` - フィルタータイプ
- `interaction_type` - 地図操作タイプ

## 📈 **期待される分析データ例**

### **1週間後の予想データ**

```text
📊 総利用状況
- ユニークユーザー: 50-100人
- ページビュー: 200-500回
- 平均セッション時間: 2-5分

🏆 人気店舗ランキング
1. 海鮮市場金太 (35% クリック率)
2. 寿司処金峰 (28% クリック率)
3. そば処竹の子 (20% クリック率)

🔍 検索キーワード
1. "寿司" (25%)
2. "海鮮" (22%)
3. "カフェ" (18%)

📱 デバイス分析
- モバイル: 70%
- デスクトップ: 25%
- タブレット: 5%

🗺️ 地理分析
- 新潟県: 40%
- 東京都: 25%
- その他関東: 20%
- その他地域: 15%
```

### **観光シーズン分析**

```text
📅 利用パターン
- 平日: 午前10-12時、午後15-17時にピーク
- 休日: 午前11-13時にピーク
- 夏季: 7-8月に300%増加
- 春秋: 安定した利用
- 冬季: 50%減少
```

## ✅ **設定完了チェックリスト**

- [ ] **探索レポート作成**: 4つの専用レポート
- [ ] **ダッシュボード設定**: カスタムコレクション作成
- [ ] **アラート設定**: 3つの監視アラート
- [ ] **定期配信設定**: 週次・月次レポート自動化
- [ ] **カスタムディメンション**: 詳細分析項目追加
- [ ] **リアルタイム監視**: 日常的な利用状況確認

## 🚀 **運用開始**

全ての設定が完了したら、以下の運用を開始：

1. **日次**: リアルタイムレポートでの利用状況確認
2. **週次**: 自動配信レポートでのトレンド分析
3. **月次**: 詳細レポートでの機能改善検討
4. **四半期**: 年間トレンドとロードマップ更新

---

**🎉 完了**: Google Analytics 4 カスタムダッシュボード完全設定完了！  
**📊 結果**: 佐渡飲食店マップの利用状況が完全に見える化され、データドリブンな改善が可能に！
