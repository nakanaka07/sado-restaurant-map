#!/usr/bin/env pwsh
# -*- coding: utf-8 -*-

<#
.SYNOPSIS
    Google Sheets統合テスト用スクリプト

.DESCRIPTION
    佐渡飲食店マップ - データ統合テスト
    Google Sheets → React App

.EXAMPLE
    ./test-integration.ps1

.NOTES
    対象: 開発者
    最終更新: 2025年8月29日
#>

# 文字エンコーディング設定
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ロケール設定（日本語対応）
try {
    $PSDefaultParameterValues['*:Encoding'] = 'utf8'
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        $PSDefaultParameterValues['Out-File:Encoding'] = 'utf8NoBOM'
    }
} catch {
    # PowerShell 5.x の場合は無視
}

# Windows のコードページを UTF-8 に設定
if ($IsWindows -or $PSVersionTable.PSVersion.Major -le 5) {
    try {
        chcp 65001 > $null
    } catch {
        # chcp コマンドが失敗しても続行
    }
}

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

# 2. フロントエンド依存関係のインストール
Write-Host "📦 フロントエンド依存関係の確認..." -ForegroundColor Blue

if (-not (Test-Path "node_modules")) {
  Write-Host "📦 依存関係をインストール中..." -ForegroundColor Blue
  pnpm install
}

# 3. 型チェックとビルドテスト
Write-Host "🔧 TypeScript型チェック..." -ForegroundColor Blue

try {
  pnpm tsc --noEmit
  Write-Host "✅ 型チェック完了" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  型エラーがあります（続行可能）" -ForegroundColor Yellow
}

# 4. テスト実行
Write-Host "🧪 単体テスト実行..." -ForegroundColor Blue

try {
  pnpm test:run
  Write-Host "✅ テスト実行完了" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  テストでエラーがあります" -ForegroundColor Yellow
}

# 5. テスト用開発サーバー起動
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
