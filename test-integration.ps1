# 🧪 Google Sheets統合テスト用スクリプト

# 佐渡飲食店マップ - データ統合テスト
# places_data_updater.py → Google Sheets → React App

Write-Host "🚀 佐渡飲食店マップ - データ統合テスト開始" -ForegroundColor Green
Write-Host "=" * 50

# 1. 環境変数チェック
Write-Host "📋 環境変数の確認..." -ForegroundColor Blue

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.localファイルが見つかりません" -ForegroundColor Red
    Write-Host "📝 .env.local.exampleをコピーして設定してください" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "実行コマンド:" -ForegroundColor Green
    Write-Host "Copy-Item .env.local.example .env.local" -ForegroundColor Cyan
    exit 1
}

# 2. Python環境のアクティベート
Write-Host "🐍 Python環境のアクティベート..." -ForegroundColor Blue

try {
    & .\.venv\Scripts\Activate.ps1
    Write-Host "✅ Python環境アクティベート完了" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python環境のアクティベートに失敗" -ForegroundColor Red
    Write-Host "📝 以下のコマンドで仮想環境を作成してください:" -ForegroundColor Yellow
    Write-Host "python -m venv .venv" -ForegroundColor Cyan
    Write-Host "pip install -r scraper/requirements.txt" -ForegroundColor Cyan
    exit 1
}

# 3. スクレイパー実行前チェック
Write-Host "🔍 スクレイパー設定チェック..." -ForegroundColor Blue

if (-not (Test-Path "scraper/places_data_updater.py")) {
    Write-Host "❌ スクレイパーファイルが見つかりません" -ForegroundColor Red
    exit 1
}

# 必要な設定ファイルの確認
$requiredFiles = @("scraper/restaurants.txt", "scraper/parkings.txt", "scraper/toilets.txt")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "⚠️  $file が見つかりません" -ForegroundColor Yellow
    }
}

# 4. テスト用小規模データでスクレイパー実行
Write-Host "🤖 テスト用データでスクレイパー実行..." -ForegroundColor Blue

# 環境変数設定（テスト用）
$env:TARGET_DATA = "restaurants"
$env:API_DELAY = "2"

try {
    python scraper/places_data_updater.py
    Write-Host "✅ スクレイパー実行完了" -ForegroundColor Green
}
catch {
    Write-Host "❌ スクレイパー実行に失敗" -ForegroundColor Red
    Write-Host "📝 エラー内容を確認して設定を見直してください" -ForegroundColor Yellow
    exit 1
}

# 5. フロントエンド依存関係のインストール
Write-Host "📦 フロントエンド依存関係の確認..." -ForegroundColor Blue

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 依存関係をインストール中..." -ForegroundColor Blue
    pnpm install
}

# 6. 型チェックとビルドテスト
Write-Host "🔧 TypeScript型チェック..." -ForegroundColor Blue

try {
    pnpm tsc --noEmit
    Write-Host "✅ 型チェック完了" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  型エラーがあります（続行可能）" -ForegroundColor Yellow
}

# 7. テスト用開発サーバー起動
Write-Host "🌐 開発サーバーを起動します..." -ForegroundColor Blue
Write-Host "📍 ブラウザで http://localhost:5173 を開いてテストしてください" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  テスト項目:" -ForegroundColor Yellow
Write-Host "   1. マップが正常に表示される" -ForegroundColor White
Write-Host "   2. スプレッドシートからデータが読み込まれる" -ForegroundColor White
Write-Host "   3. マーカーが地図上に表示される" -ForegroundColor White
Write-Host "   4. マーカークリックで詳細情報が表示される" -ForegroundColor White
Write-Host "   5. フィルター機能が動作する" -ForegroundColor White
Write-Host ""
Write-Host "🛑 テスト完了後は Ctrl+C で終了してください" -ForegroundColor Red
Write-Host ""

# バックグラウンドで開発サーバー起動
Start-Process powershell -ArgumentList "-Command", "pnpm dev" -WindowStyle Minimized

# ブラウザを自動で開く
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "🎉 統合テスト準備完了！" -ForegroundColor Green
