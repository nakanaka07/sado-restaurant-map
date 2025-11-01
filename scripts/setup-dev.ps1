# ==========================================
# 開発環境セットアップスクリプト (PowerShell)
# 佐渡飲食店マップ - React 19 + TypeScript 5.7 + Vite 7
# ==========================================

param(
  [switch]$Clean,
  [switch]$SkipInstall,
  [switch]$Verbose,
  [switch]$Help
)

# エラーハンドリング設定
$ErrorActionPreference = "Stop"

# ヘルプ表示
if ($Help) {
  @"
🚀 開発環境セットアップスクリプト
=====================================

目的: プロジェクトクローン後の初回開発環境構築

パラメータ:
  -Clean        : node_modules等をクリーンアップ後セットアップ
  -SkipInstall  : 依存関係インストールをスキップ
  -Verbose      : 詳細ログ出力
  -Help         : このヘルプを表示

使用例:
  .\scripts\setup-dev.ps1
  .\scripts\setup-dev.ps1 -Clean
  .\scripts\setup-dev.ps1 -Verbose

前提条件:
  - Node.js 20.19+
  - Git
  - インターネット接続

"@
  exit 0
}

Write-Host "🚀 佐渡飲食店マップ 開発環境セットアップ開始" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Blue

# 環境確認
function Test-Prerequisites {
  Write-Host "🔍 前提条件確認中..." -ForegroundColor Yellow

  # Node.js確認
  try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

    # Node.js 20.19+の確認
    $version = $nodeVersion -replace 'v', ''
    $major = [int]($version.Split('.')[0])
    $minor = [int]($version.Split('.')[1])

    if ($major -lt 20 -or ($major -eq 20 -and $minor -lt 19)) {
      Write-Host "⚠️  Node.js 20.19+ が推奨です (現在: $nodeVersion)" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "❌ Node.jsが見つかりません。https://nodejs.org からインストールしてください" -ForegroundColor Red
    exit 1
  }

  # pnpm確認
  try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm: v$pnpmVersion" -ForegroundColor Green
  }
  catch {
    Write-Host "⚠️  pnpmが見つかりません。npm install -g pnpm でインストールします..." -ForegroundColor Yellow
    npm install -g pnpm
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm: v$pnpmVersion インストール完了" -ForegroundColor Green
  }

  # Git確認
  try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
  }
  catch {
    Write-Host "❌ Gitが見つかりません" -ForegroundColor Red
    exit 1
  }
}

# クリーンアップ
function Invoke-Cleanup {
  if ($Clean) {
    Write-Host "🧹 プロジェクトクリーンアップ中..." -ForegroundColor Yellow

    $dirsToRemove = @("node_modules", "dist", "dev-dist", "coverage", ".vite")
    foreach ($dir in $dirsToRemove) {
      if (Test-Path $dir) {
        Write-Host "  🗑️  $dir を削除中..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $dir
      }
    }

    # pnpm cache clean
    try {
      pnpm store prune
      Write-Host "✅ pnpmキャッシュクリーンアップ完了" -ForegroundColor Green
    }
    catch {
      Write-Host "⚠️  pnpmキャッシュクリーンアップに失敗" -ForegroundColor Yellow
    }
  }
}

# 依存関係インストール
function Install-Dependencies {
  if (-not $SkipInstall) {
    Write-Host "📦 依存関係インストール中..." -ForegroundColor Yellow

    # pnpm install
    try {
      pnpm install
      Write-Host "✅ 依存関係インストール完了" -ForegroundColor Green
    }
    catch {
      Write-Host "❌ 依存関係インストールに失敗しました" -ForegroundColor Red
      Write-Host "以下を試してください:" -ForegroundColor Yellow
      Write-Host "  1. pnpm cache clean" -ForegroundColor Cyan
      Write-Host "  2. Remove-Item node_modules -Recurse -Force" -ForegroundColor Cyan
      Write-Host "  3. pnpm install" -ForegroundColor Cyan
      exit 1
    }
  }
}

# 環境変数設定確認
function Test-Environment {
  Write-Host "🔧 環境設定確認中..." -ForegroundColor Yellow

  # .env.local確認
  if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.localが見つかりません" -ForegroundColor Yellow
    Write-Host "Google Maps APIキーの設定が必要です:" -ForegroundColor Cyan
    Write-Host "  VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" -ForegroundColor Cyan

    # テンプレート作成
    $envTemplate = @"
# Google Maps API設定
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# 開発環境設定
VITE_ENV=development
VITE_DEBUG=true

# GitHub Pages設定
VITE_BASE_URL=/sado-restaurant-map/
"@
    $envTemplate | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.localテンプレートを作成しました" -ForegroundColor Green
  }
  else {
    Write-Host "✅ .env.local設定ファイル確認済み" -ForegroundColor Green
  }
}

# TypeScript設定確認
function Test-TypeScriptConfig {
  Write-Host "📝 TypeScript設定確認中..." -ForegroundColor Yellow

  if (Test-Path "tsconfig.json") {
    try {
      # TypeScriptチェック
      npx tsc --noEmit
      Write-Host "✅ TypeScript設定確認完了" -ForegroundColor Green
    }
    catch {
      Write-Host "⚠️  TypeScript設定に問題があります" -ForegroundColor Yellow
      if ($Verbose) {
        Write-Host "詳細エラー情報:" -ForegroundColor Cyan
        npx tsc --noEmit --listFiles
      }
    }
  }
}

# PWA設定確認
function Test-PWAConfig {
  Write-Host "📱 PWA設定確認中..." -ForegroundColor Yellow

  $requiredFiles = @(
    "public/manifest.json",
    "public/favicon.ico",
    "public/apple-touch-icon.png"
  )

  $missingFiles = @()
  foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
      $missingFiles += $file
    }
  }

  if ($missingFiles.Count -eq 0) {
    Write-Host "✅ PWA設定ファイル確認済み" -ForegroundColor Green
  }
  else {
    Write-Host "⚠️  不足しているPWAファイル:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
      Write-Host "  - $file" -ForegroundColor Cyan
    }
    Write-Host "pnpm run generate:pwa-assets で生成可能です" -ForegroundColor Cyan
  }
}

# 開発サーバー起動
function Start-DevServer {
  Write-Host "🔥 開発サーバー起動準備完了" -ForegroundColor Green
  Write-Host "" -ForegroundColor White
  Write-Host "次のコマンドで開発を開始できます:" -ForegroundColor Yellow
  Write-Host "  pnpm run dev      # 開発サーバー起動" -ForegroundColor Cyan
  Write-Host "  pnpm run build    # 本番ビルド" -ForegroundColor Cyan
  Write-Host "  pnpm run test     # テスト実行" -ForegroundColor Cyan
  Write-Host "  pnpm run lint     # コード品質チェック" -ForegroundColor Cyan
  Write-Host "" -ForegroundColor White

  $startDev = Read-Host "開発サーバーを今すぐ起動しますか？ (y/N)"
  if ($startDev -eq "y" -or $startDev -eq "Y") {
    Write-Host "🚀 開発サーバー起動中..." -ForegroundColor Green
    pnpm run dev
  }
}

# メイン実行
try {
  Test-Prerequisites
  Invoke-Cleanup
  Install-Dependencies
  Test-Environment
  Test-TypeScriptConfig
  Test-PWAConfig
  Start-DevServer

  Write-Host "🎉 開発環境セットアップ完了！" -ForegroundColor Green
  Write-Host "佐渡飲食店マップの開発を開始できます。" -ForegroundColor Green
}
catch {
  Write-Host "❌ セットアップ中にエラーが発生しました: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
