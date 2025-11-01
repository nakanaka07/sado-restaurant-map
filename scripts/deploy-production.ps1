# ==========================================
# GitHub Pages デプロイスクリプト (PowerShell)
# 佐渡飲食店マップ - Vite 7 + PWA 対応
# ==========================================

param(
  [switch]$SkipBuild,
  [switch]$DryRun,
  [switch]$Verbose,
  [switch]$Help
)

$ErrorActionPreference = "Stop"

# ヘルプ表示
if ($Help) {
  @"
🚀 GitHub Pages デプロイスクリプト
====================================

目的: GitHub Pagesへの本番デプロイ自動化

パラメータ:
  -SkipBuild  : ビルドをスキップ（既存distを使用）
  -DryRun     : デプロイコマンドを表示のみ（実行しない）
  -Verbose    : 詳細ログ出力
  -Help       : このヘルプを表示

使用例:
  .\scripts\deploy-production.ps1
  .\scripts\deploy-production.ps1 -DryRun
  .\scripts\deploy-production.ps1 -SkipBuild

前提条件:
  - mainブランチ推奨
  - 全テストパス
  - gh-pagesパッケージインストール済み

"@
  exit 0
}

Write-Host "🚀 GitHub Pages デプロイ開始" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Blue

# 環境確認
function Test-DeployPrerequisites {
  Write-Host "🔍 デプロイ前提条件確認中..." -ForegroundColor Yellow

  # Git状態確認
  try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
      Write-Host "⚠️  コミットされていない変更があります:" -ForegroundColor Yellow
      git status --short
      $continue = Read-Host "このままデプロイを続行しますか？ (y/N)"
      if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ デプロイを中止しました" -ForegroundColor Red
        exit 1
      }
    }
  }
  catch {
    Write-Host "❌ Git状態の確認に失敗しました" -ForegroundColor Red
    exit 1
  }

  # ブランチ確認
  try {
    $currentBranch = git branch --show-current
    Write-Host "📂 現在のブランチ: $currentBranch" -ForegroundColor Cyan

    if ($currentBranch -ne "main") {
      Write-Host "⚠️  mainブランチ以外からのデプロイです" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "❌ ブランチ情報の取得に失敗しました" -ForegroundColor Red
    exit 1
  }

  # パッケージ確認
  if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.jsonが見つかりません" -ForegroundColor Red
    exit 1
  }

  # gh-pages確認
  try {
    $ghPagesCheck = npm list gh-pages --depth=0 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ gh-pagesパッケージが見つかりません" -ForegroundColor Red
      Write-Host "pnpm install で依存関係をインストールしてください" -ForegroundColor Yellow
      if ($Verbose) {
        Write-Host "詳細: $ghPagesCheck" -ForegroundColor Gray
      }
      exit 1
    }
    Write-Host "✅ gh-pages パッケージ確認済み" -ForegroundColor Green
  }
  catch {
    Write-Host "❌ gh-pages確認に失敗しました" -ForegroundColor Red
    exit 1
  }
}

# 環境変数設定
function Set-ProductionEnvironment {
  Write-Host "🔧 本番環境設定適用中..." -ForegroundColor Yellow

  # 本番環境変数の設定
  $env:NODE_ENV = "production"
  $env:VITE_ENV = "production"

  # GitHub Pages用のベースURL設定
  if (-not $env:VITE_BASE_URL) {
    $env:VITE_BASE_URL = "/sado-restaurant-map/"
    Write-Host "✅ VITE_BASE_URL設定: $env:VITE_BASE_URL" -ForegroundColor Green
  }

  # Google Maps API キー確認
  if (-not $env:VITE_GOOGLE_MAPS_API_KEY) {
    Write-Host "⚠️  VITE_GOOGLE_MAPS_API_KEYが設定されていません" -ForegroundColor Yellow
    Write-Host ".env.local または GitHub Secrets で設定してください" -ForegroundColor Cyan
  }
}

# ビルド前チェック
function Test-PreBuild {
  Write-Host "🔍 ビルド前チェック実行中..." -ForegroundColor Yellow

  # TypeScriptチェック
  try {
    Write-Host "  📝 TypeScript型チェック..." -ForegroundColor Cyan
    npx tsc --noEmit
    Write-Host "  ✅ TypeScript: OK" -ForegroundColor Green
  }
  catch {
    Write-Host "  ❌ TypeScript型エラーがあります" -ForegroundColor Red
    if ($Verbose) {
      npx tsc --noEmit
    }
    exit 1
  }

  # ESLintチェック
  try {
    Write-Host "  🔍 ESLintチェック..." -ForegroundColor Cyan
    pnpm run lint
    Write-Host "  ✅ ESLint: OK" -ForegroundColor Green
  }
  catch {
    Write-Host "  ❌ ESLintエラーがあります" -ForegroundColor Red
    Write-Host "  pnpm run lint:fix で自動修正を試してください" -ForegroundColor Yellow
    exit 1
  }

  # テスト実行
  try {
    Write-Host "  🧪 テスト実行..." -ForegroundColor Cyan
    pnpm run test:run
    Write-Host "  ✅ テスト: OK" -ForegroundColor Green
  }
  catch {
    Write-Host "  ❌ テストが失敗しました" -ForegroundColor Red
    exit 1
  }
}

# ビルド実行
function Invoke-Build {
  if (-not $SkipBuild) {
    Write-Host "🔨 本番ビルド実行中..." -ForegroundColor Yellow

    # 既存のdistディレクトリクリーンアップ
    if (Test-Path "dist") {
      Write-Host "  🗑️  既存のdistディレクトリを削除..." -ForegroundColor Cyan
      Remove-Item -Recurse -Force "dist"
    }

    # Viteビルド実行
    try {
      pnpm run build
      Write-Host "✅ ビルド完了" -ForegroundColor Green
    }
    catch {
      Write-Host "❌ ビルドに失敗しました" -ForegroundColor Red
      exit 1
    }

    # ビルド結果確認
    if (Test-Path "dist/index.html") {
      $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
      $distSizeMB = [math]::Round($distSize / 1MB, 2)
      Write-Host "📊 ビルド結果: ${distSizeMB}MB" -ForegroundColor Cyan
    }
    else {
      Write-Host "❌ ビルド成果物が見つかりません" -ForegroundColor Red
      exit 1
    }
  }
  else {
    Write-Host "⏭️  ビルドをスキップ（--SkipBuildオプション）" -ForegroundColor Yellow
  }
}

# PWA設定確認
function Test-PWAConfig {
  Write-Host "📱 PWA設定確認中..." -ForegroundColor Yellow

  # Service Worker確認
  if (Test-Path "dist/sw.js") {
    Write-Host "  ✅ Service Worker: 生成済み" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️  Service Workerが見つかりません" -ForegroundColor Yellow
  }

  # Manifest確認
  if (Test-Path "dist/manifest.webmanifest") {
    Write-Host "  ✅ Web App Manifest: 生成済み" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️  Web App Manifestが見つかりません" -ForegroundColor Yellow
  }

  # PWAアイコン確認
  $iconFiles = @("pwa-192x192.png", "pwa-512x512.png", "apple-touch-icon.png")
  foreach ($icon in $iconFiles) {
    if (Test-Path "dist/$icon") {
      Write-Host "  ✅ PWAアイコン: $icon" -ForegroundColor Green
    }
    else {
      Write-Host "  ⚠️  PWAアイコンが見つかりません: $icon" -ForegroundColor Yellow
    }
  }
}

# GitHub Pagesデプロイ
function Invoke-Deploy {
  Write-Host "🚀 GitHub Pagesデプロイ実行中..." -ForegroundColor Yellow

  if ($DryRun) {
    Write-Host "  📋 DryRunモード - 実際のデプロイは行いません" -ForegroundColor Cyan
    Write-Host "  以下のコマンドが実行される予定です:" -ForegroundColor Cyan
    Write-Host "  gh-pages -d dist" -ForegroundColor Magenta
    return
  }

  try {
    # gh-pagesでデプロイ
    gh-pages -d dist
    Write-Host "✅ GitHub Pagesデプロイ完了！" -ForegroundColor Green
  }
  catch {
    Write-Host "❌ デプロイに失敗しました" -ForegroundColor Red
    Write-Host "以下を確認してください:" -ForegroundColor Yellow
    Write-Host "  1. GitHub認証設定" -ForegroundColor Cyan
    Write-Host "  2. リポジトリのPages設定" -ForegroundColor Cyan
    Write-Host "  3. ネットワーク接続" -ForegroundColor Cyan
    exit 1
  }
}

# デプロイ結果表示
function Show-DeployResult {
  Write-Host "" -ForegroundColor White
  Write-Host "🎉 デプロイ完了！" -ForegroundColor Green
  Write-Host "====================================" -ForegroundColor Blue

  # GitHub Pages URL
  $repoName = "sado-restaurant-map"
  $githubUser = "nakanaka07"  # 適切なユーザー名に変更してください
  $siteUrl = "https://${githubUser}.github.io/${repoName}/"

  Write-Host "🌐 サイトURL: $siteUrl" -ForegroundColor Cyan
  Write-Host "⏰ 反映時間: 通常5-10分程度" -ForegroundColor Yellow
  Write-Host "" -ForegroundColor White

  Write-Host "📋 確認項目:" -ForegroundColor Yellow
  Write-Host "  ✓ サイトの表示確認" -ForegroundColor Cyan
  Write-Host "  ✓ PWA機能の動作確認" -ForegroundColor Cyan
  Write-Host "  ✓ Google Maps表示確認" -ForegroundColor Cyan
  Write-Host "  ✓ モバイル・レスポンシブ確認" -ForegroundColor Cyan

  Write-Host "" -ForegroundColor White
  Write-Host "🔧 管理機能:" -ForegroundColor Yellow
  Write-Host "  GitHub リポジトリ設定 > Pages" -ForegroundColor Cyan
  Write-Host "  GitHub Actions ワークフロー確認" -ForegroundColor Cyan
}

# メイン実行
try {
  Test-DeployPrerequisites
  Set-ProductionEnvironment
  Test-PreBuild
  Invoke-Build
  Test-PWAConfig
  Invoke-Deploy
  Show-DeployResult
}
catch {
  Write-Host "❌ デプロイ中にエラーが発生しました: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
