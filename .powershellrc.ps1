# PowerShell 設定 - 佐渡飲食店マッププロジェクト
# 文字エンコーディングとロケール設定

# UTF-8 エンコーディング設定
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# パラメータのデフォルトエンコーディング設定
$PSDefaultParameterValues = @{}
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# PowerShell Core 対応
if ($PSVersionTable.PSVersion.Major -ge 6) {
  $PSDefaultParameterValues['Out-File:Encoding'] = 'utf8NoBOM'
  $PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8NoBOM'
}

# Windows コードページ設定
if ($IsWindows -or $PSVersionTable.PSVersion.Major -le 5) {
  try {
    # コードページを UTF-8 に設定
    chcp 65001 > $null
    Write-Verbose "コードページを UTF-8 (65001) に設定しました"
  }
  catch {
    Write-Verbose "コードページの設定に失敗しましたが、処理を続行します"
  }
}

# 日本語ロケール確認
$currentCulture = Get-Culture
if ($currentCulture.Name -ne "ja-JP") {
  Write-Verbose "現在のカルチャ: $($currentCulture.Name) (推奨: ja-JP)"
}

Write-Verbose "PowerShell 設定が読み込まれました (UTF-8 エンコーディング)"
