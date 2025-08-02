# 🗄️ 佐渡飲食店マップ - データベース運用スクリプト
# 手動実行専用（API料金コントロール対応）

param(
    [Parameter(Position = 0)]
    [ValidateSet("dev", "update-test", "update-all", "restaurants", "parkings", "toilets", "status", "help")]
    [string]$Action = "help",
    
    [switch]$SkipConfirm,
    [switch]$Force
)

# 設定
$VENV_PATH = ".\.venv\Scripts\Activate.ps1"
$SCRAPER_PATH = "scraper\places_data_updater.py"

# 色付きログ関数
function Write-Log {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param($Message) Write-Log "✅ $Message" "Green" }
function Write-Error { param($Message) Write-Log "❌ $Message" "Red" }
function Write-Warning { param($Message) Write-Log "⚠️  $Message" "Yellow" }
function Write-Info { param($Message) Write-Log "ℹ️  $Message" "Blue" }

# ヘルプ表示
function Show-Help {
    Write-Log "🗄️ 佐渡飲食店マップ - データベース運用コマンド" "Cyan"
    Write-Log ("=" * 60)
    Write-Log ""
    Write-Log "使用方法: .\database-operations.ps1 <action> [options]" "Green"
    Write-Log ""
    Write-Log "📋 利用可能なアクション:" "Blue"
    Write-Log ""
    Write-Log "  dev                開発サーバー起動（API料金なし）" "White"
    Write-Log "  status             現在のデータベース状態確認" "White"
    Write-Log ""
    Write-Log "  update-test        小規模テスト実行（飲食店のみ、料金: ~$4）" "Yellow"
    Write-Log "  update-all         全データ更新（料金: ~$7-10）" "Yellow"
    Write-Log "  restaurants        飲食店データのみ更新（料金: ~$4）" "Yellow"
    Write-Log "  parkings           駐車場データのみ更新（料金: ~$1-2）" "Yellow"
    Write-Log "  toilets            公衆トイレデータのみ更新（料金: ~$1-2）" "Yellow"
    Write-Log ""
    Write-Log "📊 推奨運用パターン:" "Blue"
    Write-Log ""
    Write-Log "  # 日常開発（料金なし）"
    Write-Log "  .\database-operations.ps1 dev"
    Write-Log ""
    Write-Log "  # 月1回データ更新"
    Write-Log "  .\database-operations.ps1 update-test    # まずテスト"
    Write-Log "  .\database-operations.ps1 update-all     # 結果確認後に全更新"
    Write-Log ""
    Write-Log "🔧 オプション:" "Blue"
    Write-Log "  -SkipConfirm       確認プロンプトをスキップ"
    Write-Log "  -Force             強制実行（キャッシュクリア等）"
}

# 環境チェック
function Test-Environment {
    Write-Info "環境チェック実行中..."
    
    $issues = @()
    
    # .env.local チェック
    if (-not (Test-Path ".env.local")) {
        $issues += ".env.localファイルが存在しません"
    }
    
    # Python環境チェック
    if (-not (Test-Path $VENV_PATH)) {
        $issues += "Python仮想環境が見つかりません (.venv)"
    }
    
    # スクレイパーチェック
    if (-not (Test-Path $SCRAPER_PATH)) {
        $issues += "スクレイパーファイルが見つかりません"
    }
    
    # node_modules チェック
    if (-not (Test-Path "node_modules")) {
        $issues += "Node.js依存関係がインストールされていません"
    }
    
    if ($issues.Count -gt 0) {
        Write-Error "環境に問題があります:"
        foreach ($issue in $issues) {
            Write-Log "  • $issue" "Red"
        }
        return $false
    }
    
    Write-Success "環境チェック完了"
    return $true
}

# データベース状態確認
function Get-DatabaseStatus {
    Write-Info "データベース状態を確認中..."
    
    try {
        # ローカルストレージは確認できないので、ファイルベースキャッシュがあれば確認
        Write-Log "💾 ローカルストレージキャッシュ: ブラウザで確認してください" "Yellow"
        Write-Log "   F12 → Application → Local Storage → restaurantData" "Gray"
    }
    catch {
        Write-Log "キャッシュ状態確認をスキップ" "Gray"
    }
    
    # スプレッドシート接続テスト
    if (Test-Path ".env.local") {
        Write-Log "📊 スプレッドシート接続: .env.local設定済み" "Green"
    }
    else {
        Write-Log "📊 スプレッドシート接続: 未設定" "Red"
    }
    
    # 最終更新日推定
    $lastScraperRun = ""
    if (Test-Path "scraper\*.log") {
        $lastLog = Get-ChildItem "scraper\*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $lastScraperRun = $lastLog.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
    }
    
    if ($lastScraperRun) {
        Write-Log "🕒 推定最終データ更新: $lastScraperRun" "Blue"
    }
    else {
        Write-Log "🕒 スクレイパー実行履歴なし" "Yellow"
    }
}

# 料金警告表示
function Show-CostWarning {
    param($EstimatedCost, $Action)
    
    Write-Warning "API利用料金に関する注意"
    Write-Log ("=" * 40) "Yellow"
    Write-Log "  アクション: $Action" "White"
    Write-Log "  推定料金: $EstimatedCost USD" "White"
    Write-Log "  API: Google Places Text Search (New)" "White"
    Write-Log "  料金体系: `$0.017 USD/リクエスト" "White"
    Write-Log ("=" * 40) "Yellow"
    
    if (-not $SkipConfirm) {
        $confirm = Read-Host "実行しますか？ (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Warning "実行をキャンセルしました"
            exit 0
        }
    }
}

# メイン処理
switch ($Action) {
    "help" {
        Show-Help
        exit 0
    }
    
    "dev" {
        Write-Info "開発サーバーを起動します（API料金なし）"
        
        if (-not (Test-Environment)) { exit 1 }
        
        Write-Log "🌐 ブラウザで http://localhost:5173 を開いてください" "Green"
        Write-Log "🔄 既存のスプレッドシートデータを使用します" "Blue"
        Write-Log "⏹️  終了時は Ctrl+C を押してください" "Yellow"
        Write-Log ""
        
        pnpm dev
    }
    
    "status" {
        Get-DatabaseStatus
    }
    
    "update-test" {
        Show-CostWarning "約$4-5" "飲食店データのみテスト更新"
        
        if (-not (Test-Environment)) { exit 1 }
        
        Write-Info "小規模テスト実行中..."
        
        # Python環境アクティベート & 実行
        & $VENV_PATH
        $env:TARGET_DATA = "restaurants"
        $env:API_DELAY = "2"
        
        python $SCRAPER_PATH
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "テスト実行完了"
            Write-Info "結果を確認して、問題なければ update-all を実行してください"
        }
        else {
            Write-Error "テスト実行に失敗しました"
        }
    }
    
    "update-all" {
        Show-CostWarning "約$7-10" "全データ更新（飲食店・駐車場・公衆トイレ）"
        
        if (-not (Test-Environment)) { exit 1 }
        
        Write-Info "全データ更新実行中..."
        
        & $VENV_PATH
        $env:TARGET_DATA = "all"
        $env:API_DELAY = "1"
        
        python $SCRAPER_PATH
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "全データ更新完了"
            Write-Info "開発サーバーでデータを確認: .\database-operations.ps1 dev"
        }
        else {
            Write-Error "データ更新に失敗しました"
        }
    }
    
    "restaurants" {
        Show-CostWarning "約$4-5" "飲食店データのみ更新"
        
        if (-not (Test-Environment)) { exit 1 }
        
        & $VENV_PATH
        $env:TARGET_DATA = "restaurants"
        python $SCRAPER_PATH
    }
    
    "parkings" {
        Show-CostWarning "約$1-2" "駐車場データのみ更新"
        
        if (-not (Test-Environment)) { exit 1 }
        
        & $VENV_PATH
        $env:TARGET_DATA = "parkings"
        python $SCRAPER_PATH
    }
    
    "toilets" {
        Show-CostWarning "約$1-2" "公衆トイレデータのみ更新"
        
        if (-not (Test-Environment)) { exit 1 }
        
        & $VENV_PATH
        $env:TARGET_DATA = "toilets"
        python $SCRAPER_PATH
    }
    
    default {
        Write-Error "不明なアクション: $Action"
        Write-Info "使用可能なアクション: dev, status, update-test, update-all, restaurants, parkings, toilets, help"
        exit 1
    }
}
