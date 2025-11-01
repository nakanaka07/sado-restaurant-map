# ==========================================
# ヘルスチェックスクリプト (PowerShell)
# 佐渡飲食店マップ - React 19 + TypeScript 5.7 + Vite 7
# ==========================================

param(
  [switch]$Verbose,
  [switch]$Json,
  [switch]$Quick,
  [switch]$Help
)

$ErrorActionPreference = "Stop"

# ヘルプ表示
if ($Help) {
  @"
🏥 プロジェクトヘルスチェックスクリプト
========================================

目的: プロジェクト全体の健全性診断

パラメータ:
  -Verbose  : 詳細ログ出力
  -Json     : JSON形式レポート生成
  -Quick    : ビルドシステムチェックをスキップ
  -Help     : このヘルプを表示

使用例:
  .\scripts\health-check.ps1
  .\scripts\health-check.ps1 -Json
  .\scripts\health-check.ps1 -Quick

チェック項目:
  - システムリソース (CPU/メモリ/ディスク)
  - 開発環境 (Node.js/pnpm/Git)
  - プロジェクト構造
  - 依存関係
  - ビルドシステム

"@
  exit 0
}

# 結果を格納するハッシュテーブル
$healthResult = @{
  timestamp      = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  overall_status = ""
  services       = @{}
  summary        = @{}
}

Write-Host "🏥 佐渡飲食店マップ ヘルスチェック開始" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Blue
Write-Host "時刻: $($healthResult.timestamp)" -ForegroundColor Cyan

# 基本システムチェック
function Test-BasicSystem {
  Write-Host "`n💻 基本システムチェック..." -ForegroundColor Yellow

  $systemHealth = @{
    status  = "healthy"
    details = @{}
  }

  try {
    # CPU使用率
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $cpuUsage = [math]::Round($cpu.Average, 1)
    $systemHealth.details.cpu_usage = "$cpuUsage%"

    if ($cpuUsage -gt 80) {
      $systemHealth.status = "warning"
      Write-Host "  ⚠️  CPU使用率: $cpuUsage% (高負荷)" -ForegroundColor Yellow
    }
    else {
      Write-Host "  ✅ CPU使用率: $cpuUsage%" -ForegroundColor Green
    }

    # メモリ使用率
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $totalMemGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
    $freeMemGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    $usedMemGB = $totalMemGB - $freeMemGB
    $memoryUsagePercent = [math]::Round(($usedMemGB / $totalMemGB) * 100, 1)

    $systemHealth.details.memory_usage = "$memoryUsagePercent%"
    $systemHealth.details.memory_total = "${totalMemGB}GB"
    $systemHealth.details.memory_free = "${freeMemGB}GB"

    if ($memoryUsagePercent -gt 85) {
      $systemHealth.status = "warning"
      Write-Host "  ⚠️  メモリ使用率: $memoryUsagePercent% (${usedMemGB}GB / ${totalMemGB}GB)" -ForegroundColor Yellow
    }
    else {
      Write-Host "  ✅ メモリ使用率: $memoryUsagePercent% (${usedMemGB}GB / ${totalMemGB}GB)" -ForegroundColor Green
    }

    # ディスク使用率
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskUsagePercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 1)
    $diskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    $diskTotalGB = [math]::Round($disk.Size / 1GB, 2)

    $systemHealth.details.disk_usage = "$diskUsagePercent%"
    $systemHealth.details.disk_free = "${diskFreeGB}GB"
    $systemHealth.details.disk_total = "${diskTotalGB}GB"

    if ($diskUsagePercent -gt 90) {
      $systemHealth.status = "critical"
      Write-Host "  🔴 ディスク使用率: $diskUsagePercent% (空き: ${diskFreeGB}GB)" -ForegroundColor Red
    }
    elseif ($diskUsagePercent -gt 80) {
      $systemHealth.status = "warning"
      Write-Host "  ⚠️  ディスク使用率: $diskUsagePercent% (空き: ${diskFreeGB}GB)" -ForegroundColor Yellow
    }
    else {
      Write-Host "  ✅ ディスク使用率: $diskUsagePercent% (空き: ${diskFreeGB}GB)" -ForegroundColor Green
    }

  }
  catch {
    $systemHealth.status = "unhealthy"
    $systemHealth.details.error = $_.Exception.Message
    Write-Host "  ❌ システム情報取得エラー: $($_.Exception.Message)" -ForegroundColor Red
  }

  return $systemHealth
}

# 開発環境チェック
function Test-DevelopmentEnvironment {
  Write-Host "`n🔧 開発環境チェック..." -ForegroundColor Yellow

  $devHealth = @{
    status  = "healthy"
    details = @{}
    tools   = @{}
  }

  # Node.js確認
  try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
      $devHealth.tools.nodejs = $nodeVersion
      Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    else {
      throw "Node.jsが見つかりません"
    }
  }
  catch {
    $devHealth.status = "unhealthy"
    $devHealth.tools.nodejs = "not_found"
    Write-Host "  ❌ Node.js: 見つかりません" -ForegroundColor Red
  }

  # pnpm確認
  try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
      $devHealth.tools.pnpm = "v$pnpmVersion"
      Write-Host "  ✅ pnpm: v$pnpmVersion" -ForegroundColor Green
    }
    else {
      throw "pnpmが見つかりません"
    }
  }
  catch {
    $devHealth.tools.pnpm = "not_found"
    Write-Host "  ⚠️  pnpm: 見つかりません" -ForegroundColor Yellow
  }

  # Git確認
  try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
      $devHealth.tools.git = $gitVersion
      Write-Host "  ✅ Git: $gitVersion" -ForegroundColor Green
    }
    else {
      throw "Gitが見つかりません"
    }
  }
  catch {
    $devHealth.tools.git = "not_found"
    Write-Host "  ❌ Git: 見つかりません" -ForegroundColor Red
    $devHealth.status = "unhealthy"
  }

  return $devHealth
}

# プロジェクト状態チェック
function Test-ProjectHealth {
  Write-Host "`n📁 プロジェクト状態チェック..." -ForegroundColor Yellow

  $projectHealth = @{
    status  = "healthy"
    details = @{}
    files   = @{}
  }

  # 必須ファイル確認
  $requiredFiles = @(
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html"
  )

  $missingFiles = @()
  foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
      $projectHealth.files[$file] = "exists"
      Write-Host "  ✅ $file" -ForegroundColor Green
    }
    else {
      $projectHealth.files[$file] = "missing"
      $missingFiles += $file
      Write-Host "  ❌ $file (必須ファイル)" -ForegroundColor Red
    }
  }

  if ($missingFiles.Count -gt 0) {
    $projectHealth.status = "critical"
    $projectHealth.details.missing_files = $missingFiles
  }

  # ディレクトリ確認
  $requiredDirs = @("src", "public")
  foreach ($dir in $requiredDirs) {
    if (Test-Path $dir -PathType Container) {
      $projectHealth.files["$dir/"] = "exists"
      Write-Host "  ✅ $dir/" -ForegroundColor Green
    }
    else {
      $projectHealth.files["$dir/"] = "missing"
      Write-Host "  ❌ $dir/ (必須ディレクトリ)" -ForegroundColor Red
      $projectHealth.status = "critical"
    }
  }

  # 環境設定ファイル確認
  if (Test-Path ".env.local") {
    $projectHealth.files[".env.local"] = "exists"
    Write-Host "  ✅ .env.local" -ForegroundColor Green

    # Google Maps API キー確認
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_GOOGLE_MAPS_API_KEY=(?!your_google_maps_api_key_here)(.+)") {
      $projectHealth.details.google_maps_api = "configured"
      Write-Host "  ✅ Google Maps API Key: 設定済み" -ForegroundColor Green
    }
    else {
      $projectHealth.details.google_maps_api = "not_configured"
      Write-Host "  ⚠️  Google Maps API Key: 未設定" -ForegroundColor Yellow
    }
  }
  else {
    $projectHealth.files[".env.local"] = "missing"
    $projectHealth.details.google_maps_api = "not_configured"
    Write-Host "  ⚠️  .env.local: 見つかりません" -ForegroundColor Yellow
  }

  return $projectHealth
}

# 依存関係チェック
function Test-Dependencies {
  Write-Host "`n📦 依存関係チェック..." -ForegroundColor Yellow

  $depHealth = @{
    status  = "healthy"
    details = @{}
  }

  if (-not (Test-Path "package.json")) {
    $depHealth.status = "critical"
    $depHealth.details.error = "package.json not found"
    Write-Host "  ❌ package.jsonが見つかりません" -ForegroundColor Red
    return $depHealth
  }

  if (-not (Test-Path "node_modules")) {
    $depHealth.status = "warning"
    $depHealth.details.node_modules = "missing"
    Write-Host "  ⚠️  node_modules: 見つかりません（pnpm installが必要）" -ForegroundColor Yellow
    return $depHealth
  }

  try {
    # package.json読み込み
    $packageJson = Get-Content "package.json" | ConvertFrom-Json

    # 主要依存関係確認
    $dependencies = $packageJson.dependencies
    $devDependencies = $packageJson.devDependencies

    # React確認
    if ($dependencies.react) {
      $reactVersion = $dependencies.react
      $depHealth.details.react = $reactVersion
      if ($reactVersion -match "19\.") {
        Write-Host "  ✅ React: $reactVersion" -ForegroundColor Green
      }
      else {
        Write-Host "  ⚠️  React: $reactVersion (19.x推奨)" -ForegroundColor Yellow
      }
    }
    else {
      Write-Host "  ❌ React: 見つかりません" -ForegroundColor Red
      $depHealth.status = "critical"
    }

    # Vite確認
    $viteVersion = if ($devDependencies.vite) { $devDependencies.vite } else { $dependencies.vite }
    if ($viteVersion) {
      $depHealth.details.vite = $viteVersion
      if ($viteVersion -match "7\.") {
        Write-Host "  ✅ Vite: $viteVersion" -ForegroundColor Green
      }
      else {
        Write-Host "  ⚠️  Vite: $viteVersion (7.x推奨)" -ForegroundColor Yellow
      }
    }
    else {
      Write-Host "  ❌ Vite: 見つかりません" -ForegroundColor Red
      $depHealth.status = "critical"
    }

    # TypeScript確認
    if ($devDependencies.typescript) {
      $tsVersion = $devDependencies.typescript
      $depHealth.details.typescript = $tsVersion
      if ($tsVersion -match "5\.7") {
        Write-Host "  ✅ TypeScript: $tsVersion" -ForegroundColor Green
      }
      else {
        Write-Host "  ⚠️  TypeScript: $tsVersion (5.7.x推奨)" -ForegroundColor Yellow
      }
    }
    else {
      Write-Host "  ❌ TypeScript: 見つかりません" -ForegroundColor Red
      $depHealth.status = "warning"
    }

  }
  catch {
    $depHealth.status = "unhealthy"
    $depHealth.details.error = $_.Exception.Message
    Write-Host "  ❌ 依存関係チェックエラー: $($_.Exception.Message)" -ForegroundColor Red
  }

  return $depHealth
}

# ビルドシステムチェック（簡易）
function Test-BuildSystem {
  if ($Quick) {
    Write-Host "`n⏭️  ビルドシステムチェックをスキップ（--Quickオプション）" -ForegroundColor Yellow
    return @{ status = "skipped"; details = @{} }
  }

  Write-Host "`n🔨 ビルドシステムチェック..." -ForegroundColor Yellow

  $buildHealth = @{
    status  = "healthy"
    details = @{}
  }

  # TypeScriptコンパイルチェック（型のみ）
  try {
    Write-Host "  📝 TypeScript型チェック実行中..." -ForegroundColor Cyan
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
      $buildHealth.details.typescript_check = "passed"
      Write-Host "  ✅ TypeScript型チェック: OK" -ForegroundColor Green
    }
    else {
      $buildHealth.status = "warning"
      $buildHealth.details.typescript_check = "failed"
      Write-Host "  ⚠️  TypeScript型チェック: エラーあり" -ForegroundColor Yellow
      if ($Verbose) {
        Write-Host "    詳細: $($tscResult | Select-Object -First 3)" -ForegroundColor Cyan
      }
    }
  }
  catch {
    $buildHealth.details.typescript_check = "error"
    Write-Host "  ❌ TypeScript型チェック実行エラー" -ForegroundColor Red
  }

  return $buildHealth
}

# メイン実行
function Main {
  # 各チェック実行
  $healthResult.services.system = Test-BasicSystem
  $healthResult.services.development = Test-DevelopmentEnvironment
  $healthResult.services.project = Test-ProjectHealth
  $healthResult.services.dependencies = Test-Dependencies
  $healthResult.services.build = Test-BuildSystem

  # 総合ステータス判定
  $criticalCount = 0
  $warningCount = 0
  $healthyCount = 0

  foreach ($service in $healthResult.services.Values) {
    switch ($service.status) {
      "critical" { $criticalCount++ }
      "unhealthy" { $criticalCount++ }
      "warning" { $warningCount++ }
      "healthy" { $healthyCount++ }
      "skipped" { } # カウントしない
    }
  }

  $totalServices = $healthResult.services.Count - ($healthResult.services.Values | Where-Object { $_.status -eq "skipped" }).Count

  if ($criticalCount -gt 0) {
    $healthResult.overall_status = "critical"
    $statusIcon = "🔴"
    $statusColor = "Red"
  }
  elseif ($warningCount -gt 0) {
    $healthResult.overall_status = "warning"
    $statusIcon = "🟡"
    $statusColor = "Yellow"
  }
  else {
    $healthResult.overall_status = "healthy"
    $statusIcon = "🟢"
    $statusColor = "Green"
  }

  $healthResult.summary = @{
    total_services    = $totalServices
    healthy_services  = $healthyCount
    warning_services  = $warningCount
    critical_services = $criticalCount
    health_percentage = if ($totalServices -gt 0) { [math]::Round(($healthyCount / $totalServices) * 100, 1) } else { 0 }
  }

  # 結果表示
  Write-Host "`n📊 ヘルスチェック結果" -ForegroundColor Blue
  Write-Host "=============================" -ForegroundColor Blue
  Write-Host "$statusIcon 総合ステータス: $($healthResult.overall_status.ToUpper())" -ForegroundColor $statusColor
  Write-Host "🔢 サービス状況: $healthyCount 正常 / $warningCount 警告 / $criticalCount 重大" -ForegroundColor Cyan
  Write-Host "📈 健全性: $($healthResult.summary.health_percentage)%" -ForegroundColor Cyan

  # アドバイス表示
  if ($healthResult.overall_status -eq "critical") {
    Write-Host "`n🚨 緊急対応が必要です" -ForegroundColor Red
    Write-Host "重大な問題を解決してから開発を継続してください" -ForegroundColor Yellow
  }
  elseif ($healthResult.overall_status -eq "warning") {
    Write-Host "`n⚠️  注意が必要な項目があります" -ForegroundColor Yellow
    Write-Host "可能な限り警告を解決することを推奨します" -ForegroundColor Cyan
  }
  else {
    Write-Host "`n🎉 すべて正常です！" -ForegroundColor Green
    Write-Host "開発を開始できます: pnpm run dev" -ForegroundColor Cyan
  }

  # JSON出力
  if ($Json) {
    $jsonOutput = $healthResult | ConvertTo-Json -Depth 10
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $jsonFile = "logs/health-check-$timestamp.json"

    if (-not (Test-Path "logs")) {
      New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }

    $jsonOutput | Out-File -FilePath $jsonFile -Encoding UTF8
    Write-Host "`n📄 詳細レポート: $jsonFile" -ForegroundColor Cyan
  }
}

# 実行
try {
  Main

  # 終了コード設定
  if ($healthResult.overall_status -eq "critical") {
    exit 1
  }
  else {
    exit 0
  }
}
catch {
  Write-Host "❌ ヘルスチェック実行中にエラーが発生しました: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
