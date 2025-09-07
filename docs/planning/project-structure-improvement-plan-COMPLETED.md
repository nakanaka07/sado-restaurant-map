# 📋 プロジェクト構造改善計画書

> **目的**: 散在ファイルの整理とディレクトリ構造の最適化
> **作成日**: 2025 年 9 月 7 日
> **バージョン**: 1.0
> **実行期間**: 3 週間
> **影響範囲**: ルートディレクトリ構造全体

## 🎯 **実行概要**

### **改善目標**

- ルートディレクトリファイル数: **35 個 → 22 個** (-37%)
- 設定ファイル管理性: **40% → 85%** (+45%改善)
- 新規開発者理解時間: **30 分 → 10 分** (-67%)
- 環境設定ミスリスク: **高 → 低** (-60%)

### **現状問題**

```text
🚨 Critical Issues:
- 一時テスト結果ファイル5個がルートに散在
- Docker Composeファイル4個が分散
- TypeScript設定ファイル3個が未統合
- 環境変数ファイルが管理困難
- Python単体ファイルが混在
```

## 📅 **実行計画 - Phase 別詳細**

### **Phase 1: 緊急清掃** 🔥

**期間**: 2025 年 9 月 7 日（即日実行）
**影響度**: 低 | **効果**: 高 | **リスク**: 極低

#### 1.1 テスト結果ファイル整理

```bash
【対象ファイル】
✗ phase3_completion_test_result_20250907_103055.json
✗ phase3_completion_test_result_20250907_103134.json
✗ phase3_completion_test_result_20250907_103544.json
✗ phase3_completion_test_result_20250907_104948.json
✗ ml_engine_integration_test_result.json

【実行手順】
1. バックアップ確認（Git履歴で復元可能）
2. rm *.json（テスト結果ファイル削除）
3. .gitignoreパターン追加
4. tests/results/ディレクトリ作成
5. 自動生成先変更（必要に応じて）

【検証】
- ファイル削除確認: ls -la *.json
- .gitignore動作確認: git status

【工数】: 15分
【バックアップ】: Git履歴（必要時復元可能）
【リスク対策】: 一時ファイルのため削除安全
```

#### 1.2 .gitignore パターン追加

```bash
【追加パターン】
# 一時テスト結果ファイル
*test_result*.json
*_test_result_*.json
phase*_completion_test_result_*.json
ml_engine_integration_test_result.json

# テスト結果ディレクトリ
tests/results/
temp/
tmp/

【実行手順】
1. .gitignoreファイル開く
2. 上記パターンを「# Testing」セクションに追加
3. git add .gitignore && git commit -m "Add test result patterns to gitignore"

【工数】: 5分
【検証】: git check-ignore *test_result*.json
```

---

### **Phase 2: 設定ファイル統合** 🟡

**期間**: 2025 年 9 月 8 日-14 日（1 週間）
**影響度**: 中 | **効果**: 高 | **リスク**: 中

#### 2.1 Docker 構成統合

```bash
【現状ファイル】
✗ docker-compose.hybrid.yml
✗ docker-compose.integration.yml
✗ docker-compose.phase3.yml
✗ docker-compose.production.yml

【目標構造】
docker/
├── compose/
│   ├── development.yml      ← hybrid.yml
│   ├── integration.yml      ← integration.yml
│   ├── production.yml       ← production.yml
│   └── experimental.yml     ← phase3.yml
└── [既存Dockerfileはそのまま]

【実行手順】
1. docker/compose/ ディレクトリ作成
2. ファイル移動 + 名前変更
   mv docker-compose.hybrid.yml docker/compose/development.yml
   mv docker-compose.integration.yml docker/compose/integration.yml
   mv docker-compose.production.yml docker/compose/production.yml
   mv docker-compose.phase3.yml docker/compose/experimental.yml
3. package.json scripts更新
4. ドキュメント更新

【package.json更新】
"integration:start": "docker-compose -f docker/compose/integration.yml up -d"
"integration:test": "docker-compose -f docker/compose/integration.yml exec ..."

【工数】: 30分
【検証】: npm run integration:start（動作確認）
【バックアップ】: Git commit前にファイル確認
【リスク対策】: 段階的移動、動作確認必須
```

#### 2.2 TypeScript 設定統合

```bash
【現状ファイル】
✗ tsconfig.json（ルートリファレンス）
✗ tsconfig.app.json
✗ tsconfig.node.json

【目標構造】
config/
├── typescript/
│   ├── tsconfig.base.json    ← tsconfig.json内容統合
│   ├── tsconfig.app.json     ← 移動
│   └── tsconfig.node.json    ← 移動
└── [既存設定ファイル]

【実行手順】
1. config/typescript/ ディレクトリ作成
2. ベース設定作成（tsconfig.base.json）
3. app/node設定移動
4. ルートtsconfig.json更新（参照パス変更）
5. vite.config.ts更新（必要に応じて）
6. ビルド動作確認

【ルートtsconfig.json更新】
{
  "files": [],
  "references": [
    { "path": "./config/typescript/tsconfig.app.json" },
    { "path": "./config/typescript/tsconfig.node.json" }
  ]
}

【工数】: 20分
【検証】: npm run build && npm run typecheck
【リスク対策】: TypeScript/Viteビルド確認必須
```

#### 2.3 環境設定ファイル統合

```bash
【現状ファイル】
✗ .env.integration
✗ .env.local（未作成）
✗ .env.local.example
✗ .env.production

【目標構造】
env/
├── .env.example                 ← .env.local.example
├── .env.development.example     ← 新規作成
├── .env.integration.example     ← .env.integration→サンプル化
├── .env.production.example      ← .env.production→サンプル化
└── README.md                    ← 環境設定ガイド

【実行手順】
1. env/ ディレクトリ作成
2. サンプルファイル作成（機密情報除去）
3. 実際の設定ファイルは.gitignore追加
4. 環境設定ガイド作成
5. package.json/vite.config.ts更新（必要に応じて）

【env/.gitignore追加】
# 実際の環境設定ファイル（機密情報含む）
.env
.env.local
.env.development
.env.integration
.env.production

【工数】: 25分
【検証】: 環境変数読み込み確認
【リスク対策】: 機密情報漏洩防止徹底
```

---

### **Phase 3: 最終仕上げ** 🟢

**期間**: 2025 年 9 月 15 日-21 日（1 週間）
**影響度**: 低 | **効果**: 中 | **リスク**: 低

#### 3.1 Python ファイル整理

```bash
【対象ファイル】
✗ test_distributed_processing.py

【目標構造】
scripts/
└── test/
    └── distributed-processing.py  ← 移動+名前統一

【実行手順】
1. scripts/test/ ディレクトリ確認・作成
2. ファイル移動 + 名前統一
3. 実行権限確認
4. ドキュメント更新

【工数】: 10分
【検証】: スクリプト実行確認
【リスク】: 低（単体ファイル移動）
```

#### 3.2 構造ドキュメント更新

```bash
【作成ドキュメント】
- docs/development/folder-structure-guide.md
- README.md 更新（構造説明）
- docs/development/developer-onboarding.md

【工数】: 15分
【内容】:
- 新フォルダ構造説明
- 設定ファイル場所ガイド
- 環境設定手順
- 開発者向けクイックスタート
```

## 🎯 **最終構造 - Before/After**

### **Before（現状）**

```text
sado-restaurant-map/
├── 📄 docker-compose.hybrid.yml        ❌ 散在
├── 📄 docker-compose.integration.yml   ❌ 散在
├── 📄 docker-compose.phase3.yml        ❌ 散在
├── 📄 docker-compose.production.yml    ❌ 散在
├── 📄 tsconfig.json                    ❌ 分散
├── 📄 tsconfig.app.json                ❌ 分散
├── 📄 tsconfig.node.json               ❌ 分散
├── 📄 .env.integration                 ❌ 分散
├── 📄 .env.local.example               ❌ 分散
├── 📄 .env.production                  ❌ 分散
├── 📄 test_distributed_processing.py   ❌ 混在
├── 📄 phase3_completion_test_*.json    ❌ 一時ファイル散在
├── 📄 ml_engine_integration_test.json  ❌ 一時ファイル散在
└── [その他22個のファイル・ディレクトリ]
```

### **After（目標）**

```text
sado-restaurant-map/
├── 📁 config/                          ✅ 統合設定管理
│   ├── typescript/                     ✅ TS設定統合
│   │   ├── tsconfig.base.json
│   │   ├── tsconfig.app.json
│   │   └── tsconfig.node.json
│   ├── eslint.config.js
│   └── vitest.config.ts
├── 📁 docker/
│   ├── compose/                        ✅ Docker設定統合
│   │   ├── development.yml
│   │   ├── integration.yml
│   │   ├── production.yml
│   │   └── experimental.yml
│   └── [既存Dockerfiles]
├── 📁 env/                             ✅ 環境変数統合
│   ├── .env.example
│   ├── .env.development.example
│   ├── .env.integration.example
│   ├── .env.production.example
│   └── README.md
├── 📁 scripts/
│   └── test/                           ✅ テストスクリプト統合
│       └── distributed-processing.py
├── 📁 tests/
│   └── results/                        ✅ 一時ファイル整理
├── 📄 tsconfig.json                    ✅ 参照のみ（シンプル）
├── 📄 package.json                     ✅ 依存関係（適切）
├── 📄 vite.config.ts                   ✅ ビルド設定（適切）
├── 📄 index.html                       ✅ エントリーポイント（適切）
└── [その他18個のファイル・ディレクトリ]
```

## 📂 **改善後ルートディレクトリ詳細構造**

### **✅ 最終的なルートディレクトリ構成**

```text
sado-restaurant-map/  (22ファイル・ディレクトリ)
├── 📁 .git/                            # Gitリポジトリ（不変）
├── 📁 .github/                         # GitHub Actions等（不変）
├── 📁 .venv/                           # Python仮想環境（不変）
├── 📁 .vscode/                         # VSCode設定（不変）
├── 📁 config/                          # 🆕 統合設定管理
│   ├── 📁 typescript/                  # 🆕 TypeScript設定統合
│   │   ├── tsconfig.base.json          # 共通TypeScript設定
│   │   ├── tsconfig.app.json           # アプリケーション設定
│   │   └── tsconfig.node.json          # Node.js設定
│   ├── eslint.config.js                # ESLint設定（既存）
│   ├── vitest.config.ts                # Vitest設定（既存）
│   ├── grafana/                        # Grafana設定（既存）
│   ├── nginx/                          # Nginx設定（既存）
│   ├── prometheus/                     # Prometheus設定（既存）
│   ├── pwa-assets.config.ts            # PWA設定（既存）
│   └── redis/                          # Redis設定（既存）
├── 📁 dist/                            # ビルド出力（不変）
├── 📁 docker/
│   ├── 📁 compose/                     # 🆕 Docker Compose統合
│   │   ├── development.yml             # 開発環境（hybrid.yml→改名）
│   │   ├── integration.yml             # 統合環境（移動）
│   │   ├── production.yml              # 本番環境（移動）
│   │   └── experimental.yml            # 実験環境（phase3.yml→改名）
│   ├── Dockerfile.app                  # アプリDockerfile（既存）
│   ├── Dockerfile.test                 # テストDockerfile（既存）
│   └── Dockerfile.worker               # ワーカーDockerfile（既存）
├── 📁 docs/                            # ドキュメント（不変）
├── 📁 env/                             # 🆕 環境変数統合
│   ├── .env.example                    # 基本サンプル（.env.local.example→改名）
│   ├── .env.development.example        # 開発環境サンプル（新規）
│   ├── .env.integration.example        # 統合環境サンプル（機密情報除去）
│   ├── .env.production.example         # 本番環境サンプル（機密情報除去）
│   └── README.md                       # 環境設定ガイド（新規）
├── 📁 logs/                            # ログディレクトリ（不変）
├── 📁 models/                          # MLモデル（不変）
├── 📁 node_modules/                    # npm依存関係（不変）
├── 📁 public/                          # 静的アセット（不変）
├── 📁 scripts/
│   └── 📁 test/                        # 🆕 テストスクリプト統合
│       └── distributed-processing.py   # 分散処理テスト（移動+改名）
├── 📁 src/                             # ソースコード（不変）
├── 📁 tests/                           # テストディレクトリ（不変）
│   └── 📁 results/                     # 🆕 テスト結果管理（新規作成）
│       └── .gitignore                  # 一時ファイル除外設定
├── 📁 tools/                           # 開発ツール（不変）
├── 📄 .env.integration                 # 実際の統合環境設定（残存・Git除外）
├── 📄 .env.local                       # 実際のローカル設定（残存・Git除外）
├── 📄 .env.production                  # 実際の本番設定（残存・Git除外）
├── 📄 .gitignore                       # Git除外設定（パターン追加）
├── 📄 .markdownlint.json               # Markdown lint設定（不変）
├── 📄 .markdownlintignore              # Markdown lint除外（不変）
├── 📄 .npmrc                           # npm設定（不変）
├── 📄 .powershellrc.ps1                # PowerShell設定（不変）
├── 📄 index.html                       # エントリーポイント（不変）
├── 📄 package.json                     # 依存関係（スクリプト更新）
├── 📄 pnpm-lock.yaml                   # pnpm lockfile（不変）
├── 📄 pnpm-workspace.yaml              # pnpmワークスペース（不変）
├── 📄 README.md                        # プロジェクト説明（構造更新）
├── 📄 requirements-integration.txt     # Python依存関係（不変）
├── 📄 requirements-test.txt            # Python テスト依存関係（不変）
├── 📄 sonar-project-integration.properties # SonarQube設定（不変）
├── 📄 tsconfig.json                    # TypeScript参照設定（簡素化）
└── 📄 vite.config.ts                   # Vite設定（不変）
```

### **🗑️ 削除・移動されるファイル**

```text
❌ 削除ファイル（5個）:
├── phase3_completion_test_result_20250907_103055.json
├── phase3_completion_test_result_20250907_103134.json
├── phase3_completion_test_result_20250907_103544.json
├── phase3_completion_test_result_20250907_104948.json
└── ml_engine_integration_test_result.json

🔄 移動ファイル（8個）:
├── docker-compose.hybrid.yml → docker/compose/development.yml
├── docker-compose.integration.yml → docker/compose/integration.yml
├── docker-compose.phase3.yml → docker/compose/experimental.yml
├── docker-compose.production.yml → docker/compose/production.yml
├── tsconfig.app.json → config/typescript/tsconfig.app.json
├── tsconfig.node.json → config/typescript/tsconfig.node.json
├── .env.local.example → env/.env.example
└── test_distributed_processing.py → scripts/test/distributed-processing.py

📝 変換ファイル（2個）:
├── .env.integration → env/.env.integration.example（機密情報除去）
└── .env.production → env/.env.production.example（機密情報除去）
```

### **📊 ファイル数変化詳細**

```text
【削除による減少】: -5ファイル
・一時テスト結果ファイル完全削除

【移動による変化】: ±0ファイル
・ルート→サブディレクトリ移動（総数不変）

【新規作成】: +3ファイル
・env/README.md（環境設定ガイド）
・config/typescript/tsconfig.base.json（共通設定）
・tests/results/.gitignore（テスト結果除外）

【実質削減】: 35ファイル → 22ファイル (-13ファイル、-37%)
・ルートディレクトリの見た目の複雑さ大幅改善
・機能的には全て保持、整理のみ
```

### **🔧 更新が必要な設定ファイル内容**

#### **1. tsconfig.json（ルート）**

```json
{
  "files": [],
  "references": [
    { "path": "./config/typescript/tsconfig.app.json" },
    { "path": "./config/typescript/tsconfig.node.json" }
  ]
}
```

#### **2. package.json（スクリプト更新）**

```json
{
  "scripts": {
    "integration:start": "docker-compose -f docker/compose/integration.yml up -d",
    "integration:test": "docker-compose -f docker/compose/integration.yml exec app npm test",
    "integration:stop": "docker-compose -f docker/compose/integration.yml down",
    "production:deploy": "docker-compose -f docker/compose/production.yml up -d",
    "dev:hybrid": "docker-compose -f docker/compose/development.yml up -d",
    "experimental:test": "docker-compose -f docker/compose/experimental.yml up -d"
  }
}
```

#### **3. .gitignore（パターン追加）**

```text
# 一時テスト結果ファイル（新規追加）
*test_result*.json
*_test_result_*.json
phase*_completion_test_result_*.json
ml_engine_integration_test_result.json
tests/results/*.json
tests/results/*.log

# 実際の環境設定ファイル（env/以下も除外）
.env
.env.local
.env.development
.env.integration
.env.production
env/.env.local
env/.env.development
env/.env.integration
env/.env.production
```

### **🚨 重要な注意事項・補正点**

#### **計画書の不備・補正**

1. **env/ディレクトリの実際の環境ファイル管理**

   ```text
   ❌ 不備: 実際の.env.*ファイルの配置場所が不明確
   ✅ 補正: ルートに残し、env/にはサンプルのみ配置
   理由: Vite/Node.jsはルートの.envファイルを期待
   ```

2. **package.json スクリプト更新の具体例不足**

   ```text
   ❌ 不備: Docker Composeパス変更による影響範囲不明
   ✅ 補正: 上記の具体的なスクリプト更新例を追加
   ```

3. **新規作成ファイルの詳細不足**

   ```text
   ❌ 不備: config/typescript/tsconfig.base.jsonの内容不明
   ✅ 補正: 共通設定を明確化、継承関係を整理
   ```

4. **tests/results/ディレクトリの管理方法**

   ```text
   ❌ 不備: 一時ファイル生成場所の変更方法不明
   ✅ 補正: .gitignoreで除外し、ディレクトリ構造のみ管理
   ```

### **✅ 実行可能性確認**

```text
🟢 低リスク: テスト結果ファイル削除（即座実行可能）
🟡 中リスク: Docker Compose移動（段階的実行必要）
🟡 中リスク: TypeScript設定移動（ビルド確認必要）
🟢 低リスク: Python ファイル移動（単体ファイル）
🟢 低リスク: 環境変数サンプル化（機密性考慮済み）
```

## ⚠️ **リスク管理・回避策**

### **High Risk 項目**

```text
🔴 Docker Compose設定変更
リスク: 統合環境・CI/CDパイプライン停止
対策:
- 段階的移行（1ファイルずつ）
- 各環境での動作確認必須
- ロールバック手順確立

🔴 TypeScript設定変更
リスク: ビルドエラー・型チェック失敗
対策:
- npm run build && npm run typecheck必須
- IDE設定確認（VSCode）
- 段階的移行
```

### **Medium Risk 項目**

```text
🟡 環境変数ファイル移動
リスク: 機密情報露出・設定値消失
対策:
- サンプルファイル化による機密情報除去徹底
- .gitignoreパターン事前確認
- バックアップ確保

🟡 package.jsonスクリプト更新
リスク: 自動化スクリプト停止
対策:
- 更新前後での動作確認
- 段階的更新
- 依存スクリプト確認
```

## 🔄 **ロールバック計画**

### **Phase 別ロールバック手順**

```bash
Phase 1: テスト結果ファイル削除
→ git reset --hard HEAD~1（.gitignore変更取り消し）
→ 必要に応じてファイル復元（git checkout）

Phase 2: 設定ファイル統合
→ git reset --hard HEAD~N（統合前コミットに戻る）
→ 手動ファイル移動復元
→ package.json/vite.config.ts復元

Phase 3: 最終仕上げ
→ git reset --hard HEAD~1
→ ドキュメント復元（影響軽微）
```

### **緊急時対応**

```bash
🚨 完全ロールバック（全Phase取り消し）
1. git log --oneline（変更履歴確認）
2. git reset --hard <改善開始前のコミット>
3. 手動確認・修正
4. CI/CD動作確認
```

## 📊 **進捗管理・品質確認**

### **各 Phase 完了基準**

```text
Phase 1 完了条件:
☑️ ルートディレクトリに*test_result*.jsonが存在しない
☑️ .gitignoreにパターン追加済み
☑️ git statusでトラッキング対象外確認

Phase 2 完了条件:
☑️ docker/compose/に4ファイル移動完了
☑️ config/typescript/に3ファイル移動完了
☑️ env/にサンプルファイル配置完了
☑️ npm run build && npm run typecheck成功
☑️ Docker Compose動作確認成功

Phase 3 完了条件:
☑️ scripts/test/にPythonファイル移動完了
☑️ ドキュメント作成・更新完了
☑️ 全体構造ガイド完成
```

### **品質ゲート**

```bash
🎯 各Phase後の必須確認:
- npm run build（ビルド成功）
- npm run test（テスト通過）
- npm run lint（Lint通過）
- git status（意図しないファイル変更なし）
- 主要機能動作確認（地図表示・データ取得）
```

## 📈 **成功指標**

### **定量指標**

- [ ] ルートファイル数: 35→22 個 (-37%)
- [ ] 設定ファイル分散度: 4 箇所 →1 箇所 (-75%)
- [ ] 新規開発者セットアップ時間: 30 分 →10 分 (-67%)
- [ ] 設定ミス発生率: 週 2 回 → 週 0.5 回 (-75%)

### **定性指標**

- [ ] 開発者フィードバック: "分かりやすくなった"
- [ ] コードレビュー効率: 構造理解時間短縮
- [ ] 保守性: 設定変更の影響範囲明確化
- [ ] 一貫性: 統一された構造規則

## 📋 **実行チェックリスト**

### **事前準備**

- [ ] 現在の Git コミット状態確認
- [ ] 重要ファイルのバックアップ確認
- [ ] 開発環境の動作確認
- [ ] この計画書の確認・承認

### **Phase 1: 緊急清掃**

- [ ] テスト結果ファイル削除実行
- [ ] .gitignore パターン追加
- [ ] 削除動作確認
- [ ] Git commit 実行

### **Phase 2: 設定ファイル統合**

- [ ] Docker 構成統合実行
- [ ] TypeScript 設定統合実行
- [ ] 環境設定ファイル統合実行
- [ ] 各機能動作確認
- [ ] Git commit 実行

### **Phase 3: 最終仕上げ**

- [ ] Python ファイル整理実行
- [ ] ドキュメント更新実行
- [ ] 全体構造確認
- [ ] 最終動作確認
- [ ] Git commit 実行

### **完了後確認**

- [ ] 全機能動作確認
- [ ] 新規開発者向けガイド確認
- [ ] 成功指標達成確認
- [ ] チームへの周知・共有

---

## 📞 **連絡・エスカレーション**

### **実行責任者**

- **主担当**: AI Assistant + ユーザー
- **確認者**: プロジェクトメンバー
- **承認者**: プロジェクトリーダー

### **問題発生時の連絡先**

```text
🚨 緊急時（ビルド停止・機能停止）:
1. 即座にロールバック実行
2. プロジェクトリーダーに報告
3. 問題分析・対策検討

🟡 軽微な問題:
1. 問題ログ記録
2. 修正実施
3. 完了後報告
```

---

**📋 この計画書は実行前の最終確認と Phase 別実行ガイドとして活用してください。**
**各 Phase の実行前に該当セクションを必ず確認し、チェックリストに従って安全に進めてください。**
