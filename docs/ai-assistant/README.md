# AI Assistant ドキュメント - ナビゲーションハブ

> 🎯 **目的**: 佐渡飲食店マップ開発のAI支援ドキュメント群の統合ナビゲーション
> **最終更新**: 2025年9月14日 | **バージョン**: 3.0 - ドキュメント間連携最適化

## 📚 ドキュメント構成

### 🗂️ 3つの主要ドキュメントの役割分担

| ドキュメント                                                        | 用途                   | 使用頻度  | 対象ユーザー             |
| ------------------------------------------------------------------- | ---------------------- | --------- | ------------------------ |
| **🚀 [copilot-instructions.md](./copilot-instructions.md)**         | **設定・環境・自動化** | 📄 設定時 | 開発環境構築・初期設定   |
| **⚡ [ai-prompts.md](./ai-prompts.md)**                             | **日常的なコード改善** | 📄 毎日   | 日常開発・コードレビュー |
| **🔍 [analysis-accuracy-prompt.md](./analysis-accuracy-prompt.md)** | **実装分析・品質保証** | 📄 分析時 | 進捗確認・品質評価       |

## 🎯 使用フロー・連携パターン

### 📋 基本的な開発フロー

```text
1. 🔍 実装状況の正確な分析
   → analysis-accuracy-prompt.md の手法で現状把握

2. ⚡ 適切なプロンプト選択
   → ai-prompts.md から状況に応じた改善プロンプト選択

3. 🚀 環境・設定の最適化
   → copilot-instructions.md の指針で開発環境調整
```

### 🎨 状況別使い分けガイド

#### 🚨 緊急時・バグ対応

```text
1. analysis-accuracy-prompt.md で問題箇所特定
2. ai-prompts.md #1（修正・強化）で即座に修正
3. copilot-instructions.md の型安全性指針で再発防止
```

#### 🧹 定期メンテナンス

```text
1. ai-prompts.md #2（整理・清掃）で基本整理
2. analysis-accuracy-prompt.md で改善効果確認
3. copilot-instructions.md の品質基準と照合
```

#### 🌟 大規模改善・現代化

```text
1. copilot-instructions.md で最新技術スタック確認
2. ai-prompts.md #P1-#P6（プロジェクトレベル）で段階的改善
3. analysis-accuracy-prompt.md で進捗・品質の継続追跡
```

## 📊 効果的な活用パターン

### 🔄 継続的改善サイクル

```text
週次改善サイクル:

月曜日: 📊 analysis-accuracy-prompt.md で週次進捗分析
火-木曜: ⚡ ai-prompts.md #1-#6 でファイルレベル改善
金曜日: 🚀 copilot-instructions.md 指針でコードレビュー・品質確認

月次改善サイクル:

第1週: #1-#3（修正・整理・最適化）- 安定化フェーズ
第2週: #4-#6（リファクタ・モダナイズ・包括改善）- 向上フェーズ
第3週: #D1-#D6（ディレクトリレベル）- 構造改善フェーズ
第4週: #P1-#P6（プロジェクトレベル）- 全体最適化フェーズ
```

### 🎯 成果測定・品質保証

```text
品質保証チェックポイント:

1. 開発開始前: copilot-instructions.md で環境・規約確認
2. コード作成中: ai-prompts.md で継続的改善
3. 完成・レビュー時: analysis-accuracy-prompt.md で品質評価
```

## 🛠️ ドキュメント間の情報連携

### 🔗 相互参照・依存関係

```text
情報の流れ:

copilot-instructions.md (基盤設定)
    ↓ 技術スタック・開発指針提供
ai-prompts.md (日常改善)
    ↓ 改善プロンプト・パターン提供
analysis-accuracy-prompt.md (品質保証)
    ↓ 分析結果・改善効果フィードバック
copilot-instructions.md (設定更新)
```

### 📈 継続的なドキュメント改善

```text
ドキュメントメンテナンスサイクル:

1. 実開発での使用状況収集
2. 各ドキュメントの有効性評価
3. 重複情報の整理・統合
4. 新技術・ベストプラクティスの反映
5. ユーザーフィードバックの収集・反映
```

## 📚 追加リソース

### 🔗 外部技術ドキュメント

- [React 19.1 公式ドキュメント](https://react.dev/) - 最新機能・パターン
- [TypeScript 5.7 リリースノート](https://www.typescriptlang.org/) - 型システム改善
- [Vite 7.1 ドキュメント](https://vitejs.dev/) - ビルドツール最新機能
- [Google Maps Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)

### 📖 プロジェクト特有ドキュメント

- `../planning/project-completion-status.md` - プロジェクト進捗状況
- `../development/README.md` - 開発ガイド・セットアップ
- `../architecture/README.md` - システム設計・アーキテクチャ

---

## 🎯 使用開始ガイド

### 🚀 初回セットアップ（初心者向け）

1. **環境設定**: `copilot-instructions.md` で開発環境・技術スタック確認
2. **基本プロンプト理解**: `ai-prompts.md` の30秒クイックガイドで基本操作習得
3. **分析手法理解**: `analysis-accuracy-prompt.md` で正確な分析手法習得

### ⚡ 日常利用（経験者向け）

1. **状況判断**: 30秒で問題・改善点の特定
2. **プロンプト選択**: #1-#6, #D1-#D6, #P1-#P6から最適選択
3. **効果測定**: 改善前後の定量評価・次回改善計画

---

**最終更新**: 2025年9月14日
**管理者**: 佐渡飲食店マップ開発チーム

> 💡 **活用推奨順序**: copilot-instructions.md（環境整備）→ ai-prompts.md（日常改善）→
> analysis-accuracy-prompt.md（品質確認）の循環で開発効率を最大化できます。
