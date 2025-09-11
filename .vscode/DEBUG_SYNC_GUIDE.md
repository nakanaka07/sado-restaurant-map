# VS Code Debug Configuration Guide

## PC間でのデバッグ設定同期について

### 問題

- デバッグポートの競合
- ブラウザインストールパスの違い
- ユーザーデータディレクトリの権限問題

### 解決策

#### 1. ポート競合の解決

各デバッグ設定で異なるポートを使用：

- Edge: 9225
- Edge Safe Mode: 9226
- Chrome: 9227

#### 2. PC固有設定ファイルの作成

`launch.local.json` を作成して、PC固有の設定を分離：

```json
{
  "version": "0.2.0",
  "configurations": [
    // PC固有の設定をここに追加
    {
      "type": "msedge",
      "name": "Local Edge Configuration",
      "request": "launch",
      "url": "http://127.0.0.1:5173/",
      "webRoot": "${workspaceFolder}/src",
      "runtimeExecutable": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
      // このPCのEdgeパスを指定
    }
  ]
}
```

#### 3. .gitignore での除外

PC固有ファイルをGitから除外：

```
.vscode/launch.local.json
.vscode/edge-user-data/
.vscode/chrome-user-data/
```

#### 4. 使用方法

1. 各PCで `launch.template.json` を `launch.json` にコピー
2. 必要に応じて `launch.local.json` で PC固有設定を上書き
3. VS Code の設定で複数の設定ファイルを読み込み

### トラブルシューティング

#### ポート競合の解決

- デバッグポート競合: `netstat -an | Select-String "9225"` でポート使用状況確認
- Viteポート競合: `netstat -ano | Select-String "5173"` でポート使用状況確認
- プロセス終了: `Stop-Process -Id <プロセスID> -Force` で強制終了

#### 開発サーバー関連

- Vite起動エラー: ポート5173が使用中の場合、以下の手順で解決
  1. `netstat -ano | Select-String "5173"` でプロセスID確認
  2. `Stop-Process -Id <プロセスID> -Force` でプロセス終了
  3. `pnpm dev` で再起動

#### その他

- ブラウザパス: PowerShell で `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App` で確認
- 権限問題: `.vscode/` ディレクトリの読み書き権限確認
