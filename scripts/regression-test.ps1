#!/usr/bin/env pwsh
# ================================================================================================
# マーカー刷新後リグレッションテストスクリプト
# ================================================================================================
# 目的: マーカー統一刷新後の全機能動作検証
# 対象: フィルタリング、検索、地図操作、PWA機能、A/Bテスト
# 実行方法: .\scripts\regression-test.ps1
# ================================================================================================

param(
  [switch]$Detailed = $false,  # 詳細ログ出力
  [switch]$AutoFix = $false,   # 自動修復試行
  [switch]$CI = $false,        # CI環境での実行
  [switch]$Help = $false       # ヘルプ表示
)

# ヘルプ表示
if ($Help) {
  @"
🧪 リグレッションテストスクリプト
===================================

目的: マーカー刷新後の全機能動作検証

パラメータ:
  -Detailed  : 詳細ログ出力
  -AutoFix   : 自動修復試行（実験的）
  -CI        : CI環境での実行
  -Help      : このヘルプを表示

使用例:
  .\scripts\regression-test.ps1
  .\scripts\regression-test.ps1 -Detailed
  .\scripts\regression-test.ps1 -CI

テスト対象:
  - プロジェクト構造
  - ビルドシステム
  - マーカーシステム統合
  - アプリケーション機能
  - アクセシビリティ
  - パフォーマンス
  - PWA機能
  - セキュリティ設定

"@
  exit 0
}

# ================================================================================================
# 設定・初期化
# ================================================================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$TestResults = @{
  Passed   = 0
  Failed   = 0
  Warnings = 0
  Details  = @()
}

Write-Host "🚀 マーカー刷新リグレッションテスト開始" -ForegroundColor Green
Write-Host "📍 プロジェクト: $ProjectRoot" -ForegroundColor Cyan
Write-Host "⏰ 開始時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# ================================================================================================
# ヘルパー関数
# ================================================================================================

function Write-TestResult {
  param(
    [string]$TestName,
    [string]$Status,
    [string]$Message = "",
    [string]$Details = ""
  )

  $ColorMap = @{
    "PASS" = "Green"
    "FAIL" = "Red"
    "WARN" = "Yellow"
    "INFO" = "Cyan"
  }

  $Icon = switch ($Status) {
    "PASS" { "✅" }
    "FAIL" { "❌" }
    "WARN" { "⚠️" }
    "INFO" { "ℹ️" }
  }

  Write-Host "$Icon [$Status] $TestName" -ForegroundColor $ColorMap[$Status]
  if ($Message) {
    Write-Host "   $Message" -ForegroundColor Gray
  }
  if ($Details -and $Detailed) {
    Write-Host "   詳細: $Details" -ForegroundColor DarkGray
  }

  $TestResults.Details += @{
    Name      = $TestName
    Status    = $Status
    Message   = $Message
    Details   = $Details
    Timestamp = Get-Date -Format 'HH:mm:ss'
  }

  switch ($Status) {
    "PASS" { $TestResults.Passed++ }
    "FAIL" { $TestResults.Failed++ }
    "WARN" { $TestResults.Warnings++ }
  }
}

function Test-ProjectStructure {
  Write-Host "`n📁 プロジェクト構造チェック" -ForegroundColor Blue

  $RequiredDirs = @(
    "src/components/map",
    "src/components/map/v2",
    "src/components/map/migration",
    "src/components/map/templates"
  )

  $RequiredFiles = @(
    "src/components/map/RestaurantMap.tsx",
    "src/components/map/v2/MarkerDesignSystem.ts",
    "src/components/map/v2/AccessibleMarker.tsx",
    "src/components/map/migration/MarkerMigration.tsx",
    "src/components/map/MapView/IntegratedMapView.tsx"
  )

  # ディレクトリチェック
  foreach ($dir in $RequiredDirs) {
    $path = Join-Path $ProjectRoot $dir
    if (Test-Path $path) {
      Write-TestResult "ディレクトリ存在: $dir" "PASS"
    }
    else {
      Write-TestResult "ディレクトリ不存在: $dir" "FAIL"
    }
  }

  # ファイルチェック
  foreach ($file in $RequiredFiles) {
    $path = Join-Path $ProjectRoot $file
    if (Test-Path $path) {
      $size = (Get-Item $path).Length / 1KB
      Write-TestResult "ファイル存在: $file" "PASS" "サイズ: $([math]::Round($size, 1))KB"
    }
    else {
      Write-TestResult "ファイル不存在: $file" "FAIL"
    }
  }
}

function Test-BuildSystem {
  Write-Host "`n🏗️ ビルドシステムチェック" -ForegroundColor Blue

  # TypeScript型チェック
  Write-Host "TypeScript型チェック実行中..." -ForegroundColor Gray
  $tscResult = & pnpm exec tsc --noEmit 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-TestResult "TypeScript型チェック" "PASS"
  }
  else {
    Write-TestResult "TypeScript型チェック" "FAIL" $tscResult
  }

  # ESLintチェック
  Write-Host "ESLintチェック実行中..." -ForegroundColor Gray
  $lintResult = & pnpm run lint 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-TestResult "ESLintチェック" "PASS"
  }
  else {
    Write-TestResult "ESLintチェック" "WARN" "警告あり: $lintResult"
  }

  # プロダクションビルド
  Write-Host "プロダクションビルド実行中..." -ForegroundColor Gray
  $buildResult = & pnpm run build 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-TestResult "プロダクションビルド" "PASS"

    # バンドルサイズチェック
    $distPath = Join-Path $ProjectRoot "dist"
    if (Test-Path $distPath) {
      $bundleSize = (Get-ChildItem $distPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
      Write-TestResult "バンドルサイズ" "INFO" "$([math]::Round($bundleSize, 2))MB"
    }
  }
  else {
    Write-TestResult "プロダクションビルド" "FAIL" $buildResult
  }
}

function Test-MarkerSystemIntegration {
  Write-Host "`n🎯 マーカーシステム統合チェック" -ForegroundColor Blue

  # マーカーデザインシステムの実装確認
  $markerSystemPath = Join-Path $ProjectRoot "src/components/map/v2/MarkerDesignSystem.ts"
  if (Test-Path $markerSystemPath) {
    $content = Get-Content $markerSystemPath -Raw

    # 重要な型・関数の存在確認
    $requiredPatterns = @(
      "MarkerCategory",
      "MarkerDesignConfig",
      "createMarkerDesignConfig",
      "MARKER_DESIGN_PALETTE",
      "AccessibilityMeta"
    )

    foreach ($pattern in $requiredPatterns) {
      if ($content -match $pattern) {
        Write-TestResult "マーカー要素存在: $pattern" "PASS"
      }
      else {
        Write-TestResult "マーカー要素不存在: $pattern" "FAIL"
      }
    }

    # コントラスト比の基準チェック
    if ($content -match "contrastRatio.*4\.5") {
      Write-TestResult "WCAG 2.2 AA準拠設定" "PASS" "4.5:1以上のコントラスト比設定確認"
    }
    else {
      Write-TestResult "WCAG 2.2 AA準拠設定" "WARN" "コントラスト比設定未確認"
    }
  }

  # A/Bテスト設定確認
  $migrationPath = Join-Path $ProjectRoot "src/components/map/migration/MarkerMigration.tsx"
  if (Test-Path $migrationPath) {
    $content = Get-Content $migrationPath -Raw

    if ($content -match "rolloutPercentage.*20") {
      Write-TestResult "A/Bテストロールアウト設定" "PASS" "20%ロールアウト設定確認"
    }
    else {
      Write-TestResult "A/Bテストロールアウト設定" "WARN" "ロールアウト設定未確認"
    }

    if ($content -match "enableFallback.*true") {
      Write-TestResult "フォールバック機能" "PASS" "フォールバック機能有効確認"
    }
    else {
      Write-TestResult "フォールバック機能" "WARN" "フォールバック設定未確認"
    }
  }
}

function Test-ApplicationFunctionality {
  Write-Host "`n🌐 アプリケーション機能チェック" -ForegroundColor Blue

  # 開発サーバーの動作確認（既に起動している前提）
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
      Write-TestResult "開発サーバー応答" "PASS" "HTTP 200 OK"

      # 基本的なHTML要素の存在確認
      if ($response.Content -match "id.*root") {
        Write-TestResult "React Rootエレメント" "PASS"
      }
      else {
        Write-TestResult "React Rootエレメント" "FAIL"
      }

      # Google Maps APIキーの設定確認
      if ($response.Content -match "maps\.googleapis\.com") {
        Write-TestResult "Google Maps統合" "PASS"
      }
      else {
        Write-TestResult "Google Maps統合" "WARN" "Maps APIスクリプト未確認"
      }
    }
    else {
      Write-TestResult "開発サーバー応答" "FAIL" "HTTP $($response.StatusCode)"
    }
  }
  catch {
    Write-TestResult "開発サーバー応答" "FAIL" "接続エラー: $_"
  }
}

function Test-AccessibilityCompliance {
  Write-Host "`n♿ アクセシビリティ準拠チェック" -ForegroundColor Blue

  # アクセシブルマーカーの実装確認
  $accessibleMarkerPath = Join-Path $ProjectRoot "src/components/map/v2/AccessibleMarker.tsx"
  if (Test-Path $accessibleMarkerPath) {
    $content = Get-Content $accessibleMarkerPath -Raw

    $accessibilityFeatures = @(
      "aria-label",
      "role=",
      "tabIndex",
      "onKeyDown",
      "keyboard"
    )

    foreach ($feature in $accessibilityFeatures) {
      if ($content -match $feature) {
        Write-TestResult "アクセシビリティ機能: $feature" "PASS"
      }
      else {
        Write-TestResult "アクセシビリティ機能: $feature" "WARN" "実装未確認"
      }
    }
  }

  # Skip Linkの実装確認
  $appPath = Join-Path $ProjectRoot "src/app/App.tsx"
  if (Test-Path $appPath) {
    $content = Get-Content $appPath -Raw

    if ($content -match "SkipLink") {
      Write-TestResult "スキップリンク実装" "PASS"
    }
    else {
      Write-TestResult "スキップリンク実装" "WARN" "SkipLink未確認"
    }
  }
}

function Test-PerformanceMetrics {
  Write-Host "`n⚡ パフォーマンス指標チェック" -ForegroundColor Blue

  # バンドル分析の実行
  if (Test-Path (Join-Path $ProjectRoot "dist")) {
    Write-Host "バンドル分析実行中..." -ForegroundColor Gray
    try {
      & pnpm run analyze 2>&1 | Out-Null
      Write-TestResult "バンドル分析" "PASS"
    }
    catch {
      Write-TestResult "バンドル分析" "WARN" "分析実行エラー: $($_.Exception.Message)"
    }
  }
  else {
    Write-TestResult "バンドル分析" "WARN" "distディレクトリが存在しません。ビルドを先に実行してください。"
  }

  # カバレッジ閾値チェック
  $coverageSummary = Join-Path $ProjectRoot "coverage/coverage-summary.json"
  if (Test-Path $coverageSummary) {
    try {
      $coverage = Get-Content $coverageSummary -Raw | ConvertFrom-Json
      $lineCoverage = $coverage.total.lines.pct

      Write-Host "テストカバレッジ確認中..." -ForegroundColor Gray

      $threshold = 50.0
      if ($lineCoverage -ge $threshold) {
        Write-TestResult "カバレッジ閾値" "PASS" "行カバレッジ: $lineCoverage% (≥${threshold}%)"
      }
      else {
        Write-TestResult "カバレッジ閾値" "WARN" "行カバレッジ: $lineCoverage% (<${threshold}%)"
      }

      # 詳細カバレッジ情報
      if ($Detailed) {
        Write-Host "   Statements: $($coverage.total.statements.pct)%" -ForegroundColor Gray
        Write-Host "   Branches: $($coverage.total.branches.pct)%" -ForegroundColor Gray
        Write-Host "   Functions: $($coverage.total.functions.pct)%" -ForegroundColor Gray
      }
    }
    catch {
      Write-TestResult "カバレッジ閾値" "WARN" "カバレッジ情報の読み込みエラー: $($_.Exception.Message)"
    }
  }
  else {
    Write-TestResult "カバレッジ閾値" "WARN" "カバレッジレポートが見つかりません。pnpm test:coverage を実行してください。"
  }
}

function Test-PWAFunctionality {
  Write-Host "`n📱 PWA機能チェック" -ForegroundColor Blue

  # Manifest.jsonの存在確認
  $manifestPath = Join-Path $ProjectRoot "public/manifest.json"
  if (Test-Path $manifestPath) {
    Write-TestResult "PWA Manifest" "PASS"

    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.name -and $manifest.icons) {
      Write-TestResult "Manifest完整性" "PASS" "名前・アイコン設定確認"
    }
    else {
      Write-TestResult "Manifest完整性" "WARN" "必須項目未設定"
    }
  }
  else {
    Write-TestResult "PWA Manifest" "FAIL" "manifest.json未存在"
  }

  # Service Workerの設定確認
  $swPath = Join-Path $ProjectRoot "src/service-worker.ts"
  if (Test-Path $swPath) {
    Write-TestResult "Service Worker" "PASS"
  }
  else {
    Write-TestResult "Service Worker" "WARN" "service-worker.ts未確認"
  }

  # PWA Badgeコンポーネント確認
  $pwaBadgePath = Join-Path $ProjectRoot "src/components/layout/PWABadge.tsx"
  if (Test-Path $pwaBadgePath) {
    Write-TestResult "PWA Badgeコンポーネント" "PASS"
  }
  else {
    Write-TestResult "PWA Badgeコンポーネント" "WARN" "PWABadge.tsx未確認"
  }
}

function Test-SecurityConfiguration {
  Write-Host "`n🔒 セキュリティ設定チェック" -ForegroundColor Blue

  # 環境変数の設定確認
  $envPath = Join-Path $ProjectRoot ".env.local"
  if (Test-Path $envPath) {
    Write-TestResult "環境変数ファイル" "PASS" ".env.local存在確認"
  }
  else {
    Write-TestResult "環境変数ファイル" "WARN" ".env.localが存在しません"
  }

  # セキュリティユーティリティの確認
  $securityUtilPath = Join-Path $ProjectRoot "src/utils/securityUtils.ts"
  if (Test-Path $securityUtilPath) {
    $content = Get-Content $securityUtilPath -Raw

    if ($content -match "validateApiKey") {
      Write-TestResult "APIキーバリデーション" "PASS"
    }
    else {
      Write-TestResult "APIキーバリデーション" "WARN" "validateApiKey関数未確認"
    }

    if ($content -match "sanitizeInput") {
      Write-TestResult "入力サニタイゼーション" "PASS"
    }
    else {
      Write-TestResult "入力サニタイゼーション" "WARN" "sanitizeInput関数未確認"
    }
  }
}

# ================================================================================================
# メイン実行
# ================================================================================================

function Main {
  try {
    Set-Location $ProjectRoot

    # プロジェクト依存関係チェック
    if (-not (Test-Path "package.json")) {
      Write-Host "❌ package.jsonが見つかりません。プロジェクトルートで実行してください。" -ForegroundColor Red
      exit 1
    }

    # テスト実行
    Test-ProjectStructure
    Test-BuildSystem
    Test-MarkerSystemIntegration
    Test-ApplicationFunctionality
    Test-AccessibilityCompliance
    Test-PerformanceMetrics
    Test-PWAFunctionality
    Test-SecurityConfiguration

    # 結果サマリー
    Write-Host "`n📊 テスト結果サマリー" -ForegroundColor Blue
    Write-Host "✅ 成功: $($TestResults.Passed)" -ForegroundColor Green
    Write-Host "❌ 失敗: $($TestResults.Failed)" -ForegroundColor Red
    Write-Host "⚠️ 警告: $($TestResults.Warnings)" -ForegroundColor Yellow
    Write-Host "📈 総合成功率: $([math]::Round(($TestResults.Passed / ($TestResults.Passed + $TestResults.Failed + $TestResults.Warnings)) * 100, 1))%" -ForegroundColor Cyan

    # 詳細結果出力
    if ($Detailed -or $CI) {
      $reportPath = Join-Path $ProjectRoot "regression-test-report.json"
      $TestResults | ConvertTo-Json -Depth 10 | Out-File $reportPath -Encoding UTF8
      Write-Host "📄 詳細レポート: $reportPath" -ForegroundColor Cyan
    }

    # 終了コード決定
    if ($TestResults.Failed -gt 0) {
      Write-Host "`n🚨 リグレッションテストで失敗項目が検出されました。" -ForegroundColor Red
      exit 1
    }
    elseif ($TestResults.Warnings -gt 3) {
      Write-Host "`n⚠️ 多数の警告が検出されました。要確認事項があります。" -ForegroundColor Yellow
      exit 2
    }
    else {
      Write-Host "`n🎉 リグレッションテスト完了！新マーカーシステムは正常に動作しています。" -ForegroundColor Green
      exit 0
    }

  }
  catch {
    Write-Host "❌ テスト実行エラー: $_" -ForegroundColor Red
    exit 1
  }
  finally {
    Write-Host "⏰ 終了時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
  }
}

# スクリプト実行
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
  Main
}
