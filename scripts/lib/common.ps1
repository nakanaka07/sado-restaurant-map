# ==========================================
# 共通ヘルパー関数ライブラリ
# 全スクリプトで使用可能なユーティリティ関数
# ==========================================

# ==========================================
# カラー出力関数
# ==========================================

function Write-Success {
  param([string]$Message)
  Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
  param([string]$Message)
  Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
  param([string]$Message)
  Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
  param([string]$Message)
  Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Header {
  param([string]$Message)
  Write-Host "`n$Message" -ForegroundColor Blue
}

function Write-Separator {
  param([int]$Length = 50)
  Write-Host ("=" * $Length) -ForegroundColor Blue
}

# ==========================================
# テスト結果管理
# ==========================================

function New-TestResult {
  return @{
    Passed   = 0
    Failed   = 0
    Warnings = 0
    Details  = @()
  }
}

function Add-TestResult {
  param(
    [Parameter(Mandatory)]
    [hashtable]$TestResults,
    [Parameter(Mandatory)]
    [string]$TestName,
    [Parameter(Mandatory)]
    [ValidateSet("PASS", "FAIL", "WARN", "INFO")]
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
  if ($Details) {
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

function Get-TestSummary {
  param([hashtable]$TestResults)

  $total = $TestResults.Passed + $TestResults.Failed + $TestResults.Warnings
  $successRate = if ($total -gt 0) {
    [math]::Round(($TestResults.Passed / $total) * 100, 1)
  }
  else { 0 }

  return @{
    Total       = $total
    Passed      = $TestResults.Passed
    Failed      = $TestResults.Failed
    Warnings    = $TestResults.Warnings
    SuccessRate = $successRate
  }
}

# ==========================================
# 環境確認関数
# ==========================================

function Test-NodeVersion {
  param(
    [string]$MinVersion = "20.19.0"
  )

  try {
    $nodeVersion = node --version
    $version = $nodeVersion -replace 'v', ''
    Write-Success "Node.js: $nodeVersion"

    $minParts = $MinVersion.Split('.')
    $currentParts = $version.Split('.')

    $major = [int]$currentParts[0]
    $minor = [int]$currentParts[1]
    $minMajor = [int]$minParts[0]
    $minMinor = [int]$minParts[1]

    if ($major -lt $minMajor -or ($major -eq $minMajor -and $minor -lt $minMinor)) {
      Write-Warning "Node.js $MinVersion+ が推奨です (現在: $nodeVersion)"
      return $false
    }

    return $true
  }
  catch {
    Write-Error "Node.jsが見つかりません。https://nodejs.org からインストールしてください"
    return $false
  }
}

function Test-PnpmInstalled {
  try {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm: v$pnpmVersion"
    return $true
  }
  catch {
    Write-Warning "pnpmが見つかりません。npm install -g pnpm でインストールします..."
    try {
      npm install -g pnpm
      $pnpmVersion = pnpm --version
      Write-Success "pnpm: v$pnpmVersion インストール完了"
      return $true
    }
    catch {
      Write-Error "pnpmのインストールに失敗しました"
      return $false
    }
  }
}

function Test-GitInstalled {
  try {
    $gitVersion = git --version
    Write-Success "Git: $gitVersion"
    return $true
  }
  catch {
    Write-Error "Gitが見つかりません"
    return $false
  }
}

function Test-Prerequisites {
  Write-Header "🔍 前提条件確認中..."

  $nodeOk = Test-NodeVersion
  $pnpmOk = Test-PnpmInstalled
  $gitOk = Test-GitInstalled

  return ($nodeOk -and $pnpmOk -and $gitOk)
}

# ==========================================
# ファイルシステム関数
# ==========================================

function Get-ProjectRoot {
  param([string]$StartPath = $PSScriptRoot)

  $current = $StartPath
  while ($current) {
    if (Test-Path (Join-Path $current "package.json")) {
      return $current
    }
    $parent = Split-Path $current -Parent
    if ($parent -eq $current) { break }
    $current = $parent
  }

  throw "プロジェクトルートが見つかりません"
}

function Test-RequiredFiles {
  param(
    [string[]]$Files,
    [string]$BaseDir = (Get-ProjectRoot)
  )

  $allExist = $true
  foreach ($file in $Files) {
    $path = Join-Path $BaseDir $file
    if (Test-Path $path) {
      Write-Success "ファイル存在: $file"
    }
    else {
      Write-Error "ファイル不存在: $file"
      $allExist = $false
    }
  }

  return $allExist
}

function Test-RequiredDirectories {
  param(
    [string[]]$Directories,
    [string]$BaseDir = (Get-ProjectRoot)
  )

  $allExist = $true
  foreach ($dir in $Directories) {
    $path = Join-Path $BaseDir $dir
    if (Test-Path $path -PathType Container) {
      Write-Success "ディレクトリ存在: $dir"
    }
    else {
      Write-Error "ディレクトリ不存在: $dir"
      $allExist = $false
    }
  }

  return $allExist
}

# ==========================================
# ビルド・テスト関数
# ==========================================

function Invoke-TypeScriptCheck {
  param([switch]$Verbose)

  Write-Info "TypeScript型チェック実行中..."

  try {
    if ($Verbose) {
      npx tsc --noEmit
    }
    else {
      $output = npx tsc --noEmit 2>&1
    }

    if ($LASTEXITCODE -eq 0) {
      Write-Success "TypeScript型チェック: OK"
      return $true
    }
    else {
      Write-Error "TypeScript型チェック: エラーあり"
      if ($output -and $Verbose) {
        Write-Host $output -ForegroundColor Gray
      }
      return $false
    }
  }
  catch {
    Write-Error "TypeScript型チェック実行エラー: $($_.Exception.Message)"
    return $false
  }
}

function Invoke-LintCheck {
  param([switch]$Verbose)

  Write-Info "ESLintチェック実行中..."

  try {
    if ($Verbose) {
      pnpm run lint
    }
    else {
      $output = pnpm run lint 2>&1
    }

    if ($LASTEXITCODE -eq 0) {
      Write-Success "ESLintチェック: OK"
      return $true
    }
    else {
      Write-Warning "ESLintチェック: 警告あり"
      if ($output -and $Verbose) {
        Write-Host $output -ForegroundColor Gray
      }
      return $false
    }
  }
  catch {
    Write-Error "ESLintチェック実行エラー: $($_.Exception.Message)"
    return $false
  }
}

function Invoke-TestSuite {
  param([switch]$Verbose)

  Write-Info "テスト実行中..."

  try {
    if ($Verbose) {
      pnpm run test:run
    }
    else {
      $output = pnpm run test:run 2>&1
    }

    if ($LASTEXITCODE -eq 0) {
      Write-Success "テスト: OK"
      return $true
    }
    else {
      Write-Error "テスト: 失敗"
      if ($output -and $Verbose) {
        Write-Host $output -ForegroundColor Gray
      }
      return $false
    }
  }
  catch {
    Write-Error "テスト実行エラー: $($_.Exception.Message)"
    return $false
  }
}

# ==========================================
# JSON・レポート関数
# ==========================================

function Save-JsonReport {
  param(
    [Parameter(Mandatory)]
    [hashtable]$Data,
    [Parameter(Mandatory)]
    [string]$FilePath
  )

  try {
    $dir = Split-Path $FilePath -Parent
    if ($dir -and -not (Test-Path $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $Data | ConvertTo-Json -Depth 10 | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Success "レポート保存: $FilePath"
    return $true
  }
  catch {
    Write-Error "レポート保存エラー: $($_.Exception.Message)"
    return $false
  }
}

# ==========================================
# ヘルプ表示関数
# ==========================================

function Show-ScriptHelp {
  param(
    [Parameter(Mandatory)]
    [string]$ScriptName,
    [Parameter(Mandatory)]
    [string]$Description,
    [hashtable]$Parameters = @{},
    [string[]]$Examples = @()
  )

  Write-Host "`n$ScriptName" -ForegroundColor Green
  Write-Separator
  Write-Host $Description -ForegroundColor Cyan
  Write-Host ""

  if ($Parameters.Count -gt 0) {
    Write-Host "パラメータ:" -ForegroundColor Yellow
    foreach ($param in $Parameters.GetEnumerator()) {
      Write-Host "  -$($param.Key)" -ForegroundColor White -NoNewline
      Write-Host " : $($param.Value)" -ForegroundColor Gray
    }
    Write-Host ""
  }

  if ($Examples.Count -gt 0) {
    Write-Host "使用例:" -ForegroundColor Yellow
    foreach ($example in $Examples) {
      Write-Host "  $example" -ForegroundColor Cyan
    }
    Write-Host ""
  }
}

# ==========================================
# エクスポート
# ==========================================

Export-ModuleMember -Function *
