#!/usr/bin/env pwsh

<#
.SYNOPSIS
    GitHub Pages デプロイメント問題診断スクリプト
    
.DESCRIPTION
    GitHub Actionsでのビルド・デプロイメント問題を診断し、解決策を提示します。
    
.EXAMPLE
    ./diagnose-github-deployment.ps1
    
.NOTES
    対象: GitHub Actions・CI/CD担当者
    最終更新: 2025年8月8日
#>

param(
    [switch]$Verbose = $false
)

# カラー出力の設定
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error   = "Red"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-Status {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $color = $Colors[$Type]
    if ($color) {
        Write-Host $Message -ForegroundColor $color
    }
    else {
        Write-Host $Message
    }
}

Write-Status "🔍 GitHub Pages デプロイメント問題診断" -Type Header
Write-Status "実行日時: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Type Info
Write-Status ""

# 1. ローカル環境設定確認
Write-Status "🏠 ローカル環境設定確認:" -Type Header

$localEnvFile = ".env.local"
if (Test-Path $localEnvFile) {
    Write-Status "✅ .env.local ファイル: 存在" -Type Success
    
    # ローカル環境変数の確認
    $envContent = Get-Content $localEnvFile | Where-Object { $_ -match "^VITE_" -and $_ -notmatch "^#" }
    $localVars = @{}
    
    foreach ($line in $envContent) {
        if ($line -match "^(VITE_[^=]+)=(.*)$") {
            $localVars[$matches[1]] = $matches[2]
        }
    }
    
    Write-Status "   設定済み変数: $($localVars.Count)個" -Type Info
    if ($Verbose) {
        foreach ($key in $localVars.Keys) {
            $value = $localVars[$key]
            $maskedValue = if ($value.Length -gt 10) { 
                "***(${value.Length}文字)" 
            }
            else { 
                $value 
            }
            Write-Status "   - $key = $maskedValue" -Type Info
        }
    }
}
else {
    Write-Status "❌ .env.local ファイル: 不在" -Type Error
}

Write-Status ""

# 2. GitHub Actions Workflow確認
Write-Status "🚀 GitHub Actions Workflow確認:" -Type Header

$workflowFile = ".github/workflows/deploy.yml"
if (Test-Path $workflowFile) {
    Write-Status "✅ Workflow ファイル: 存在" -Type Success
    
    $workflowContent = Get-Content $workflowFile -Raw
    
    # 環境変数設定の確認
    $envPattern = 'VITE_([^:]+):\s*\$\{\{\s*secrets\.([^}]+)'
    $envMatches = [regex]::Matches($workflowContent, $envPattern)
    
    Write-Status "   検出された環境変数マッピング:" -Type Info
    $secretNames = @()
    
    foreach ($match in $envMatches) {
        $viteVar = "VITE_" + $match.Groups[1].Value
        $secretName = $match.Groups[2].Value
        Write-Status "   - $viteVar → secrets.$secretName" -Type Info
        $secretNames += $secretName
    }
    
    # 必須Secretsのチェック
    $requiredSecrets = @(
        "GOOGLE_MAPS_API_KEY",
        "GOOGLE_MAPS_MAP_ID", 
        "GOOGLE_SHEETS_API_KEY",
        "SPREADSHEET_ID"
    )
    
    Write-Status "   必須Secrets確認:" -Type Info
    foreach ($secret in $requiredSecrets) {
        if ($secretNames -contains $secret) {
            Write-Status "   ✅ ${secret}: Workflowで使用済み" -Type Success
        }
        else {
            Write-Status "   ❌ ${secret}: Workflowで未使用" -Type Error
        }
    }
    
}
else {
    Write-Status "❌ Workflow ファイル: 不在" -Type Error
}

Write-Status ""

# 3. package.json scripts確認
Write-Status "📦 package.json scripts確認:" -Type Header

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    if ($packageJson.scripts) {
        $scripts = $packageJson.scripts
        
        $importantScripts = @("dev", "build", "test", "preview")
        foreach ($script in $importantScripts) {
            if ($scripts.$script) {
                Write-Status "   ✅ ${script}: $($scripts.$script)" -Type Success
            }
            else {
                Write-Status "   ❌ ${script}: 未定義" -Type Warning
            }
        }
    }
}
else {
    Write-Status "❌ package.json: 不在" -Type Error
}

Write-Status ""

# 4. Vite設定確認
Write-Status "⚡ Vite設定確認:" -Type Header

$viteConfigFiles = @("vite.config.ts", "vite.config.js")
$viteConfigFound = $false

foreach ($configFile in $viteConfigFiles) {
    if (Test-Path $configFile) {
        Write-Status "✅ Vite設定ファイル: $configFile" -Type Success
        $viteConfigFound = $true
        
        $configContent = Get-Content $configFile -Raw
        
        # base設定の確認
        if ($configContent -match "base\s*:\s*['""]([^'""]+)['""]") {
            Write-Status "   base設定: $($matches[1])" -Type Info
        }
        elseif ($configContent -match "base\s*:\s*process\.env\.VITE_BASE_URL") {
            Write-Status "   base設定: 環境変数VITE_BASE_URLから取得" -Type Info
        }
        else {
            Write-Status "   ⚠️  base設定: 明示的な設定なし（GitHub Pagesでは必要）" -Type Warning
        }
        
        break
    }
}

if (-not $viteConfigFound) {
    Write-Status "❌ Vite設定ファイル: 不在" -Type Error
}

Write-Status ""

# 5. 診断結果とトラブルシューティング
Write-Status "🔧 診断結果とトラブルシューティング:" -Type Header

$issues = @()
$suggestions = @()

# 環境変数関連の問題チェック
if (-not (Test-Path $localEnvFile)) {
    $issues += "ローカル環境変数ファイル(.env.local)が存在しない"
    $suggestions += "cp .env.local.example .env.local でファイルを作成"
}

if (-not (Test-Path $workflowFile)) {
    $issues += "GitHub Actions Workflowファイルが存在しない"
    $suggestions += "適切なワークフローファイルを.github/workflows/に配置"
}

# GitHub Secretsの設定確認提案
$suggestions += "GitHub リポジトリのSettings > Secrets and variables > ActionsでSecrets設定を確認"
$suggestions += "以下のSecretsが正しく設定されているか確認:"
$suggestions += "  - GOOGLE_MAPS_API_KEY: Google Maps JavaScript APIキー"
$suggestions += "  - GOOGLE_MAPS_MAP_ID: Map ID"
$suggestions += "  - GOOGLE_SHEETS_API_KEY: Google Sheets APIキー"  
$suggestions += "  - SPREADSHEET_ID: スプレッドシートID"

# API キー制限の確認提案
$suggestions += "Google Cloud ConsoleでAPIキー制限を確認:"
$suggestions += "  - HTTPリファラー制限にGitHub Pagesドメインを追加"
$suggestions += "  - 必要なAPI（Maps JavaScript API、Sheets API）が有効化されているか確認"

if ($issues.Count -eq 0) {
    Write-Status "✅ 重大な設定問題は検出されませんでした" -Type Success
    Write-Status ""
    Write-Status "🎯 GitHub Pages特有の確認ポイント:" -Type Header
    Write-Status "1. GitHub Actions実行ログでエラー詳細を確認" -Type Info
    Write-Status "2. ブラウザのDevToolsでコンソールエラーを確認" -Type Info
    Write-Status "3. GitHub PagesのURLからアプリにアクセスしてテスト" -Type Info
}
else {
    Write-Status "⚠️  以下の問題が検出されました:" -Type Warning
    foreach ($issue in $issues) {
        Write-Status "   - $issue" -Type Error
    }
}

Write-Status ""
Write-Status "💡 推奨される確認・修正手順:" -Type Header
foreach ($suggestion in $suggestions) {
    Write-Status "   $suggestion" -Type Info
}

Write-Status ""
Write-Status "🔗 追加リソース:" -Type Header
Write-Status "   環境変数設定ガイド: docs/development/environment-setup-guide.md" -Type Info
Write-Status "   GitHub Actions ログ: https://github.com/$($env:GITHUB_REPOSITORY)/actions" -Type Info
Write-Status "   Google Cloud Console: https://console.cloud.google.com/" -Type Info

Write-Status ""
Write-Status "📋 次のステップ:" -Type Header
Write-Status "1. GitHub Secretsの設定を再確認" -Type Info
Write-Status "2. GitHub Actionsの実行ログでエラー詳細を確認" -Type Info 
Write-Status "3. 必要に応じてAPIキー制限を調整" -Type Info
Write-Status "4. 再度デプロイを実行してテスト" -Type Info
