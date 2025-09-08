# ==========================================
# セキュリティテストスクリプト (PowerShell)
# 佐渡飲食店マップ - React 19 + TypeScript 5.7 + Vite 7
# ==========================================

param(
  [string]$TargetUrl = "http://localhost:5173",
  [switch]$SkipDependencyCheck,
  [switch]$Verbose,
  [switch]$Json
)

$ErrorActionPreference = "Stop"

$reportDir = "logs/security-tests"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "🔒 佐渡飲食店マップ セキュリティテスト開始" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Blue
Write-Host "🎯 対象: $TargetUrl" -ForegroundColor Cyan
Write-Host "📂 レポート: $reportDir" -ForegroundColor Cyan

# ディレクトリ作成
if (-not (Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$securityResult = @{
  timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  target_url = $TargetUrl
  tests      = @{}
  summary    = @{}
}

# 依存関係脆弱性スキャン
function Test-DependencyVulnerabilities {
  Write-Host "`n📦 依存関係脆弱性スキャン..." -ForegroundColor Yellow

  $depResult = @{
    status    = "unknown"
    npm_audit = @{}
    findings  = @()
  }

  if ($SkipDependencyCheck) {
    Write-Host "  ⏭️  依存関係チェックをスキップ" -ForegroundColor Yellow
    $depResult.status = "skipped"
    return $depResult
  }

  if (-not (Test-Path "package.json")) {
    Write-Host "  ❌ package.jsonが見つかりません" -ForegroundColor Red
    $depResult.status = "error"
    return $depResult
  }

  # npm audit実行
  try {
    Write-Host "  🔍 npm audit実行中..." -ForegroundColor Cyan
    $auditOutput = npm audit --json 2>$null

    if ($LASTEXITCODE -eq 0) {
      $depResult.npm_audit = $auditOutput | ConvertFrom-Json
      $depResult.status = "clean"
      Write-Host "  ✅ 既知の脆弱性は見つかりませんでした" -ForegroundColor Green
    }
    else {
      $auditResult = $auditOutput | ConvertFrom-Json
      $depResult.npm_audit = $auditResult

      if ($auditResult.metadata.vulnerabilities.total -gt 0) {
        $depResult.status = "vulnerabilities_found"
        $vulnCount = $auditResult.metadata.vulnerabilities

        Write-Host "  ⚠️  脆弱性が見つかりました:" -ForegroundColor Yellow
        Write-Host "    - 重大: $($vulnCount.critical)" -ForegroundColor Red
        Write-Host "    - 高: $($vulnCount.high)" -ForegroundColor Red
        Write-Host "    - 中: $($vulnCount.moderate)" -ForegroundColor Yellow
        Write-Host "    - 低: $($vulnCount.low)" -ForegroundColor Green

        $depResult.findings += "npm audit: $($vulnCount.total) 個の脆弱性"
      }
    }

    # レポート保存
    $auditOutput | Out-File -FilePath "$reportDir/npm-audit-$timestamp.json" -Encoding UTF8

  }
  catch {
    Write-Host "  ❌ npm audit実行エラー: $($_.Exception.Message)" -ForegroundColor Red
    $depResult.status = "error"
  }

  return $depResult
}

# ソースコード静的解析
function Test-StaticCodeAnalysis {
  Write-Host "`n🔍 ソースコード静的解析..." -ForegroundColor Yellow

  $staticResult = @{
    status     = "unknown"
    eslint     = @{}
    typescript = @{}
    findings   = @()
  }

  # ESLintセキュリティチェック
  try {
    Write-Host "  📝 ESLintセキュリティルール実行中..." -ForegroundColor Cyan

    # セキュリティ関連のESLintルールがあるかチェック
    if (Test-Path "config/eslint.config.js") {
      $eslintOutput = npx eslint src/ --format json --config config/eslint.config.js 2>$null

      if ($LASTEXITCODE -eq 0) {
        $eslintResult = $eslintOutput | ConvertFrom-Json
        $staticResult.eslint = @{
          files_checked = $eslintResult.Length
          errors        = ($eslintResult | Where-Object { $_.errorCount -gt 0 }).Count
        }

        if ($staticResult.eslint.errors -eq 0) {
          Write-Host "  ✅ ESLint: セキュリティ問題なし" -ForegroundColor Green
          $staticResult.status = "clean"
        }
        else {
          Write-Host "  ⚠️  ESLint: $($staticResult.eslint.errors) 個のエラー" -ForegroundColor Yellow
          $staticResult.status = "issues_found"
          $staticResult.findings += "ESLint: $($staticResult.eslint.errors) 個のエラー"
        }

        # レポート保存
        $eslintOutput | Out-File -FilePath "$reportDir/eslint-security-$timestamp.json" -Encoding UTF8
      }
    }
    else {
      Write-Host "  ⚠️  ESLint設定ファイルが見つかりません" -ForegroundColor Yellow
    }
  }
  catch {
    Write-Host "  ❌ ESLint実行エラー: $($_.Exception.Message)" -ForegroundColor Red
  }

  # TypeScriptセキュリティチェック
  try {
    Write-Host "  📘 TypeScript厳格チェック実行中..." -ForegroundColor Cyan

    $tscResult = npx tsc --noEmit --strict 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✅ TypeScript: 型安全性OK" -ForegroundColor Green
      $staticResult.typescript.status = "safe"
    }
    else {
      Write-Host "  ⚠️  TypeScript: 型安全性の問題あり" -ForegroundColor Yellow
      $staticResult.typescript.status = "issues"
      $staticResult.findings += "TypeScript: 型安全性の問題"

      if ($global:VerboseOutput) {
        Write-Host "  詳細: $($tscResult -join '; ')" -ForegroundColor Gray
      }

      if ($staticResult.status -eq "unknown") {
        $staticResult.status = "issues_found"
      }
    }
  }
  catch {
    Write-Host "  ❌ TypeScript実行エラー: $($_.Exception.Message)" -ForegroundColor Red
  }    return $staticResult
}

# 設定ファイルセキュリティチェック
function Test-ConfigurationSecurity {
  Write-Host "`n⚙️  設定ファイルセキュリティチェック..." -ForegroundColor Yellow

  $configResult = @{
    status   = "unknown"
    files    = @{}
    findings = @()
  }

  # 環境変数ファイルチェック
  $envFiles = @(".env", ".env.local", ".env.production", ".env.development")
  foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
      $configResult.files[$envFile] = @{ exists = $true }

      try {
        $envContent = Get-Content $envFile -Raw

        # 機密情報の平文チェック
        $suspiciousPatterns = @(
          "password\s*=\s*[^#\s]",
          "secret\s*=\s*[^#\s]",
          "key\s*=\s*[^#\s].*[a-zA-Z0-9]{10,}",
          "token\s*=\s*[^#\s].*[a-zA-Z0-9]{10,}"
        )

        $issues = @()
        foreach ($pattern in $suspiciousPatterns) {
          if ($envContent -match $pattern) {
            $issues += "潜在的な機密情報: $pattern"
          }
        }

        if ($issues.Count -gt 0) {
          $configResult.files[$envFile].issues = $issues
          $configResult.findings += "$envFile`: $($issues.Count) 個の問題"
          Write-Host "  ⚠️  $envFile`: 潜在的な機密情報あり" -ForegroundColor Yellow
        }
        else {
          Write-Host "  ✅ $envFile`: セキュリティ問題なし" -ForegroundColor Green
        }
      }
      catch {
        Write-Host "  ❌ $envFile 読み込みエラー" -ForegroundColor Red
        $configResult.files[$envFile].error = $_.Exception.Message
      }
    }
  }

  # Vite設定ファイルチェック
  if (Test-Path "vite.config.ts") {
    try {
      $viteConfig = Get-Content "vite.config.ts" -Raw
      $configResult.files["vite.config.ts"] = @{ exists = $true }

      # 開発用設定が本番に残っていないかチェック
      $devPatterns = @("hmr", "clearScreen.*false", "host.*true")
      $devIssues = @()

      foreach ($pattern in $devPatterns) {
        if ($viteConfig -match $pattern) {
          $devIssues += "開発用設定: $pattern"
        }
      }

      if ($devIssues.Count -gt 0) {
        $configResult.files["vite.config.ts"].dev_settings = $devIssues
        Write-Host "  ⚠️  vite.config.ts: 開発用設定が残っている可能性" -ForegroundColor Yellow
      }
      else {
        Write-Host "  ✅ vite.config.ts: 設定問題なし" -ForegroundColor Green
      }
    }
    catch {
      Write-Host "  ❌ vite.config.ts 読み込みエラー" -ForegroundColor Red
    }
  }

  # Git設定チェック
  if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    $configResult.files[".gitignore"] = @{ exists = $true }

    $requiredIgnores = @(".env.local", "node_modules", "dist", ".env")
    $missingIgnores = @()

    foreach ($ignore in $requiredIgnores) {
      if (-not ($gitignore -match [regex]::Escape($ignore))) {
        $missingIgnores += $ignore
      }
    }

    if ($missingIgnores.Count -gt 0) {
      $configResult.files[".gitignore"].missing = $missingIgnores
      $configResult.findings += ".gitignore: $($missingIgnores.Count) 個の重要パターンが不足"
      Write-Host "  ⚠️  .gitignore: 重要パターンが不足 ($($missingIgnores -join ', '))" -ForegroundColor Yellow
    }
    else {
      Write-Host "  ✅ .gitignore: 適切に設定済み" -ForegroundColor Green
    }
  }
  else {
    Write-Host "  ❌ .gitignore: 見つかりません" -ForegroundColor Red
    $configResult.findings += ".gitignore: ファイルが存在しません"
  }

  # ステータス決定
  if ($configResult.findings.Count -eq 0) {
    $configResult.status = "secure"
  }
  else {
    $configResult.status = "issues_found"
  }

  return $configResult
}

# Webセキュリティヘッダーチェック
function Test-WebSecurityHeaders {
  Write-Host "`n🌐 Webセキュリティヘッダーチェック..." -ForegroundColor Yellow

  $webResult = @{
    status   = "unknown"
    headers  = @{}
    findings = @()
  }

  if ($TargetUrl -eq "http://localhost:5173") {
    Write-Host "  ℹ️  開発サーバー対象 - 簡易チェックのみ実行" -ForegroundColor Cyan
  }

  try {
    $response = Invoke-WebRequest -Uri $TargetUrl -Method HEAD -TimeoutSec 10 -ErrorAction Stop

    # 重要なセキュリティヘッダーチェック
    $securityHeaders = @{
      "X-Content-Type-Options"    = "nosniff"
      "X-Frame-Options"           = "DENY または SAMEORIGIN"
      "X-XSS-Protection"          = "1; mode=block"
      "Strict-Transport-Security" = "HTTPS使用時"
      "Content-Security-Policy"   = "CSP設定"
    }

    foreach ($header in $securityHeaders.Keys) {
      if ($response.Headers.ContainsKey($header)) {
        $webResult.headers[$header] = $response.Headers[$header]
        Write-Host "  ✅ $header`: 設定済み" -ForegroundColor Green
      }
      else {
        $webResult.headers[$header] = $null
        $webResult.findings += "$header`: 未設定"
        Write-Host "  ⚠️  $header`: 未設定" -ForegroundColor Yellow
      }
    }

    # HTTPSチェック
    if ($TargetUrl.StartsWith("https://")) {
      Write-Host "  ✅ HTTPS: 使用中" -ForegroundColor Green
    }
    else {
      Write-Host "  ⚠️  HTTP: 本番環境ではHTTPS推奨" -ForegroundColor Yellow
      $webResult.findings += "HTTPS: 未使用（開発環境では正常）"
    }

    $webResult.status = if ($webResult.findings.Count -eq 0) { "secure" } else { "headers_missing" }

  }
  catch {
    Write-Host "  ❌ Webサーバーに接続できません: $($_.Exception.Message)" -ForegroundColor Red
    $webResult.status = "unreachable"
    $webResult.findings += "サーバー接続不可"
  }

  return $webResult
}

# メイン実行
function Main {
  # 各テスト実行
  $securityResult.tests.dependencies = Test-DependencyVulnerabilities
  $securityResult.tests.static_analysis = Test-StaticCodeAnalysis
  $securityResult.tests.configuration = Test-ConfigurationSecurity
  $securityResult.tests.web_headers = Test-WebSecurityHeaders

  # 総合ステータス判定
  $criticalFindings = 0
  $warningFindings = 0
  $allFindings = @()

  foreach ($test in $securityResult.tests.Values) {
    if ($test.findings) {
      $allFindings += $test.findings

      switch ($test.status) {
        "vulnerabilities_found" { $criticalFindings += $test.findings.Count }
        "issues_found" { $warningFindings += $test.findings.Count }
        "headers_missing" { $warningFindings += $test.findings.Count }
      }
    }
  }

  $securityResult.summary = @{
    total_findings    = $allFindings.Count
    critical_findings = $criticalFindings
    warning_findings  = $warningFindings
    tests_run         = $securityResult.tests.Count
  }

  # 総合ステータス
  if ($criticalFindings -gt 0) {
    $overallStatus = "critical"
    $statusIcon = "🔴"
    $statusColor = "Red"
  }
  elseif ($warningFindings -gt 0) {
    $overallStatus = "warning"
    $statusIcon = "🟡"
    $statusColor = "Yellow"
  }
  else {
    $overallStatus = "secure"
    $statusIcon = "🟢"
    $statusColor = "Green"
  }

  # 結果表示
  Write-Host "`n📊 セキュリティテスト結果" -ForegroundColor Blue
  Write-Host "============================" -ForegroundColor Blue
  Write-Host "$statusIcon 総合ステータス: $($overallStatus.ToUpper())" -ForegroundColor $statusColor
  Write-Host "🔢 発見事項: $($allFindings.Count) 件（重大: $criticalFindings / 警告: $warningFindings）" -ForegroundColor Cyan

  if ($allFindings.Count -gt 0) {
    Write-Host "`n📋 発見事項一覧:" -ForegroundColor Yellow
    for ($i = 0; $i -lt [Math]::Min($allFindings.Count, 10); $i++) {
      Write-Host "  $($i + 1). $($allFindings[$i])" -ForegroundColor Cyan
    }

    if ($allFindings.Count -gt 10) {
      Write-Host "  ... 他 $($allFindings.Count - 10) 件" -ForegroundColor Cyan
    }
  }

  # 推奨アクション
  Write-Host "`n💡 推奨アクション:" -ForegroundColor Blue
  if ($criticalFindings -gt 0) {
    Write-Host "  🚨 重大な問題を優先的に修正してください" -ForegroundColor Red
    Write-Host "  📦 npm audit fix で脆弱性を修正" -ForegroundColor Cyan
  }
  if ($warningFindings -gt 0) {
    Write-Host "  ⚠️  警告項目の確認・改善を検討してください" -ForegroundColor Yellow
    Write-Host "  🔧 設定ファイルの見直し" -ForegroundColor Cyan
  }
  if ($overallStatus -eq "secure") {
    Write-Host "  ✅ セキュリティ状況は良好です" -ForegroundColor Green
    Write-Host "  🔄 定期的なセキュリティチェックを継続してください" -ForegroundColor Cyan
  }

  # JSON出力
  if ($Json) {
    $jsonOutput = $securityResult | ConvertTo-Json -Depth 10
    $jsonFile = "$reportDir/security-summary-$timestamp.json"
    $jsonOutput | Out-File -FilePath $jsonFile -Encoding UTF8
    Write-Host "`n📄 詳細レポート: $jsonFile" -ForegroundColor Cyan
  }

  return $overallStatus
}

# 実行
try {
  $result = Main

  Write-Host "`n🏁 セキュリティテスト完了" -ForegroundColor Green

  # 終了コード設定
  if ($result -eq "critical") {
    exit 1
  }
  else {
    exit 0
  }
}
catch {
  Write-Host "❌ セキュリティテスト実行中にエラーが発生しました: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
