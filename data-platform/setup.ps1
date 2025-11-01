#!/usr/bin/env pwsh
# Sado Restaurant Map - Data Platform Setup Script
# Usage: .\setup.ps1

Write-Host "🚀 Sado Restaurant Map - Data Platform セットアップ" -ForegroundColor Cyan
Write-Host "=" * 60

# Check Python version
Write-Host "`n📋 Python バージョン確認中..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python が見つかりません。Python 3.10以上をインストールしてください。" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $pythonVersion" -ForegroundColor Green

# Check Python version number
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 10)) {
        Write-Host "❌ Python 3.10以上が必要です。現在: Python $major.$minor" -ForegroundColor Red
        exit 1
    }
}

# Create virtual environment
Write-Host "`n🔧 仮想環境を作成中..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "⚠️  既存の仮想環境が見つかりました。削除しますか? (y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item -Recurse -Force venv
        Write-Host "✅ 既存の仮想環境を削除しました" -ForegroundColor Green
    }
    else {
        Write-Host "⏭️  既存の仮想環境を使用します" -ForegroundColor Cyan
    }
}

if (-not (Test-Path "venv")) {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 仮想環境の作成に失敗しました" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 仮想環境を作成しました" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n🔌 仮想環境をアクティベート中..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 仮想環境のアクティベートに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 仮想環境をアクティベートしました" -ForegroundColor Green

# Upgrade pip
Write-Host "`n📦 pip をアップグレード中..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pip をアップグレードしました" -ForegroundColor Green
}

# Install dependencies
Write-Host "`n📥 依存パッケージをインストール中..." -ForegroundColor Yellow
Write-Host "   これには数分かかる場合があります..." -ForegroundColor Gray

pip install -r config/requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依存パッケージのインストールに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依存パッケージをインストールしました" -ForegroundColor Green

# Check for .env file
Write-Host "`n🔐 環境変数ファイルを確認中..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env ファイルを作成しました (.env.example からコピー)" -ForegroundColor Green
        Write-Host "⚠️  .env ファイルを編集して、APIキーなどを設定してください" -ForegroundColor Yellow
    }
    else {
        Write-Host "⚠️  .env.example が見つかりません" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✅ .env ファイルが既に存在します" -ForegroundColor Green
}

# Check for service account
Write-Host "`n🔑 サービスアカウントキーを確認中..." -ForegroundColor Yellow
if (-not (Test-Path "config/service-account.json")) {
    Write-Host "⚠️  config/service-account.json が見つかりません" -ForegroundColor Yellow
    Write-Host "   Google Cloud Console からサービスアカウントキーをダウンロードして配置してください" -ForegroundColor Gray
}
else {
    Write-Host "✅ サービスアカウントキーが存在します" -ForegroundColor Green
}

# Run configuration check
Write-Host "`n🔍 設定を検証中..." -ForegroundColor Yellow
Write-Host "   環境変数が正しく設定されているか確認します" -ForegroundColor Gray
python interface/cli/main.py --config-check
$configCheckResult = $LASTEXITCODE

Write-Host "`n" + "=" * 60
Write-Host "🎉 セットアップが完了しました!" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "`n📚 次のステップ:" -ForegroundColor Cyan
Write-Host "1. .env ファイルを編集して APIキー を設定"
Write-Host "2. config/service-account.json にサービスアカウントキーを配置"
Write-Host "3. 設定を検証: python interface/cli/main.py --config-check"
Write-Host "4. API接続テスト: python interface/cli/main.py --test-connections"
Write-Host "5. ドライラン実行: python interface/cli/main.py --target restaurants --dry-run"

if ($configCheckResult -eq 0) {
    Write-Host "`n✅ 設定検証に成功しました。すぐに実行できます!" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  設定に問題があります。上記の手順を完了してください。" -ForegroundColor Yellow
}

Write-Host "`n📖 詳細は README.md を参照してください" -ForegroundColor Cyan
Write-Host ""
