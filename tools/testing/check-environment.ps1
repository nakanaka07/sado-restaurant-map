#!/usr/bin/env pwsh
# -*- coding: utf-8 -*-

<#
.SYNOPSIS
    環境変数設定チェックスクリプト

.DESCRIPTION
    佐渡飲食店マップの環境変数設定をチェックし、問題があれば解決方法を提示します。

.EXAMPLE
    ./check-environment.ps1

.NOTES
    対象: 開発者・CI/CD担当者
    最終更新: 2025年8月29日
#>

param(
    [switch]$Verbose = $false,
    [switch]$Fix = $false
)

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

function Test-EnvironmentVariable {
    param(
        [string]$Name,
        [string]$Description,
        [bool]$Required = $true
    )

    $value = Get-ChildItem Env: | Where-Object Name -eq $Name | Select-Object -ExpandProperty Value

    if ($value) {
        Write-Status "✅ $Name : 設定済み" -Type Success
        if ($Verbose) {
            $maskedValue = $value -replace ".{10,}", "***(${value.Length}文字)"
            Write-Status "   値: $maskedValue" -Type Info
        }
        return $true
    }
    else {
        if ($Required) {
            Write-Status "❌ $Name : 未設定（必須）" -Type Error
            Write-Status "   説明: $Description" -Type Warning
        }
        else {
            Write-Status "⚠️  $Name : 未設定（オプション）" -Type Warning
            Write-Status "   説明: $Description" -Type Info
        }
        return $false
    }
}

function Test-FileExists {
    param(
        [string]$Path,
        [string]$Description
    )

    if (Test-Path $Path) {
        Write-Status "✅ $Path : 存在" -Type Success
        return $true
    }
    else {
        Write-Status "❌ $Path : 不在" -Type Error
        Write-Status "   説明: $Description" -Type Warning
        return $false
    }
}

function Show-FixSuggestion {
    param(
        [string[]]$MissingEnvVars,
        [string[]]$MissingFiles
    )

    Write-Status "`n🔧 修正提案:" -Type Header

    if ($MissingFiles -contains ".env.local") {
        Write-Status "1. .env.localファイルを作成:" -Type Info
        Write-Status "   cp .env.local.example .env.local" -Type Info
    }

    if ($MissingEnvVars.Count -gt 0) {
        Write-Status "2. 以下の環境変数を設定:" -Type Info
        foreach ($var in $MissingEnvVars) {
            Write-Status "   - $var" -Type Warning
        }
        Write-Status "   詳細: docs/development/environment-setup-guide.md" -Type Info
    }

    Write-Status "3. Google Cloud Console設定確認:" -Type Info
    Write-Status "   - APIキーが正しく設定されているか" -Type Info
    Write-Status "   - HTTPリファラー制限が適切か" -Type Info
    Write-Status "   - Maps JavaScript API、Sheets APIが有効か" -Type Info

    Write-Status "4. スプレッドシート共有設定確認:" -Type Info
    Write-Status "   - 「リンクを知っている全員が閲覧可」に設定" -Type Info
    Write-Status "   - 編集権限ではなく閲覧権限で共有" -Type Info
}

# メイン処理開始
Write-Status "🔍 佐渡飲食店マップ 環境変数設定チェック" -Type Header
Write-Status "実行日時: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Type Info
Write-Status ""

# ファイル存在チェック
Write-Status "📁 必須ファイルチェック:" -Type Header
$envLocalExists = Test-FileExists ".env.local" "ローカル開発用環境変数ファイル"
$envExampleExists = Test-FileExists ".env.local.example" "環境変数テンプレートファイル"

Write-Status ""

# 環境変数チェック
Write-Status "🔑 環境変数チェック:" -Type Header

$requiredEnvVars = @(
    @{Name = "VITE_GOOGLE_MAPS_API_KEY"; Description = "Google Maps JavaScript API キー"; Required = $true },
    @{Name = "VITE_GOOGLE_MAPS_MAP_ID"; Description = "Google Maps Map ID"; Required = $true },
    @{Name = "VITE_GOOGLE_SHEETS_API_KEY"; Description = "Google Sheets API v4 キー"; Required = $true },
    @{Name = "VITE_SPREADSHEET_ID"; Description = "スプレッドシートID"; Required = $true }
)

$optionalEnvVars = @(
    @{Name = "VITE_GA_MEASUREMENT_ID"; Description = "Google Analytics GA4 測定ID"; Required = $false }
)

$missingRequired = @()
$missingOptional = @()

foreach ($env in $requiredEnvVars) {
    $result = Test-EnvironmentVariable -Name $env.Name -Description $env.Description -Required $env.Required
    if (-not $result) {
        $missingRequired += $env.Name
    }
}

foreach ($env in $optionalEnvVars) {
    $result = Test-EnvironmentVariable -Name $env.Name -Description $env.Description -Required $env.Required
    if (-not $result) {
        $missingOptional += $env.Name
    }
}

Write-Status ""

# 結果まとめ
Write-Status "📊 チェック結果:" -Type Header

$totalRequired = $requiredEnvVars.Count
$setRequired = $totalRequired - $missingRequired.Count
$totalOptional = $optionalEnvVars.Count
$setOptional = $totalOptional - $missingOptional.Count

Write-Status "必須環境変数: $setRequired/$totalRequired 設定済み" -Type $(if ($missingRequired.Count -eq 0) { "Success" } else { "Warning" })
Write-Status "オプション環境変数: $setOptional/$totalOptional 設定済み" -Type Info

if ($missingRequired.Count -eq 0 -and $envLocalExists) {
    Write-Status "✅ すべての必須設定が完了しています！" -Type Success

    # テスト実行提案
    Write-Status "`n🧪 テスト実行確認:" -Type Header
    Write-Status "以下のコマンドでテストを実行して設定を確認してください:" -Type Info
    Write-Status "pnpm test src/services/sheets/sheetsService.test.ts" -Type Info

    exit 0
}
else {
    Write-Status "⚠️  設定が不完全です" -Type Warning

    $missingFiles = @()
    if (-not $envLocalExists) { $missingFiles += ".env.local" }

    Show-FixSuggestion -MissingEnvVars $missingRequired -MissingFiles $missingFiles

    if ($Fix) {
        Write-Status "`n🔧 自動修正を試行しています..." -Type Info

        if (-not $envLocalExists -and $envExampleExists) {
            Copy-Item ".env.local.example" ".env.local"
            Write-Status "✅ .env.localファイルを作成しました" -Type Success
            Write-Status "   次に実際のAPIキー値を設定してください" -Type Warning
        }
    }

    exit 1
}

# 詳細モード時の追加情報
if ($Verbose) {
    Write-Status "`n📚 参考情報:" -Type Header
    Write-Status "設定ガイド: docs/development/environment-setup-guide.md" -Type Info
    Write-Status "Copilot指示: docs/development/copilot-instructions.md" -Type Info
    Write-Status "AI プロンプト: docs/development/ai-prompts.md" -Type Info
}
