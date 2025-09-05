#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phase 3-Full統合テスト環境 自動管理スクリプト

.DESCRIPTION
    Redis + Celery + Docker統合環境の起動、テスト実行、停止を自動化
    パフォーマンステスト、セキュリティテスト、統合テストを実行

.PARAMETER Action
    実行するアクション: start, test, stop, full, status, logs

.PARAMETER TestType
    テストタイプ: integration, performance, security, all

.PARAMETER Verbose
    詳細ログ出力を有効化

.EXAMPLE
    .\integration-test-manager.ps1 -Action start
    統合テスト環境を起動

.EXAMPLE
    .\integration-test-manager.ps1 -Action test -TestType all
    全種類のテストを実行

.EXAMPLE
    .\integration-test-manager.ps1 -Action full
    環境起動→テスト実行→環境停止の完全自動実行
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("start", "test", "stop", "full", "status", "logs", "cleanup")]
  [string]$Action,

  [ValidateSet("integration", "performance", "security", "all")]
  [string]$TestType = "all",

  [switch]$Verbose,

  [switch]$SkipBuild,

  [int]$Timeout = 600  # 10分
)

# エラー処理設定
$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# 定数定義
$COMPOSE_FILE = "docker-compose.integration.yml"
$PROJECT_NAME = "sado-integration-test"
$TEST_RESULTS_DIR = "test-results"
$LOG_DIR = "logs"

# ログファイル設定
$LogFile = Join-Path $LOG_DIR "integration-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $logEntry = "[$timestamp] [$Level] $Message"
  Write-Host $logEntry

  # ログディレクトリ作成
  if (!(Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
  }

  Add-Content -Path $LogFile -Value $logEntry
}

function Test-DockerCompose {
  try {
    $version = docker-compose --version
    Write-Log "Docker Compose確認: $version"
    return $true
  }
  catch {
    Write-Log "Docker Composeが見つかりません" "ERROR"
    return $false
  }
}

function Test-Prerequisites {
  Write-Log "=== 前提条件チェック開始 ==="

  $allOk = $true

  # Docker確認
  try {
    $dockerVersion = docker --version
    Write-Log "Docker確認: $dockerVersion"
  }
  catch {
    Write-Log "Dockerが見つかりません" "ERROR"
    $allOk = $false
  }

  # Docker Compose確認
  if (!(Test-DockerCompose)) {
    $allOk = $false
  }

  # 設定ファイル確認
  if (!(Test-Path $COMPOSE_FILE)) {
    Write-Log "Docker Composeファイルが見つかりません: $COMPOSE_FILE" "ERROR"
    $allOk = $false
  }

  # Redis設定確認
  if (!(Test-Path "config/redis")) {
    Write-Log "Redis設定ディレクトリが見つかりません" "ERROR"
    $allOk = $false
  }

  if ($allOk) {
    Write-Log "=== 前提条件チェック完了: OK ==="
  }
  else {
    Write-Log "=== 前提条件チェック完了: ERROR ===" "ERROR"
    exit 1
  }

  return $allOk
}

function Start-IntegrationEnvironment {
  Write-Log "=== 統合テスト環境起動開始 ==="

  # 既存コンテナのクリーンアップ
  Write-Log "既存コンテナをクリーンアップ中..."
  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans --volumes 2>$null

  if (!$SkipBuild) {
    Write-Log "Dockerイメージをビルド中..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    if ($LASTEXITCODE -ne 0) {
      Write-Log "Dockerビルドに失敗しました" "ERROR"
      exit 1
    }
  }

  # 環境起動
  Write-Log "統合テスト環境を起動中..."
  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d

  if ($LASTEXITCODE -ne 0) {
    Write-Log "環境起動に失敗しました" "ERROR"
    exit 1
  }

  # ヘルスチェック待機
  Write-Log "サービスの起動を待機中..."
  $healthyServices = @()
  $maxWaitTime = $Timeout
  $waitInterval = 10
  $elapsedTime = 0

  $services = @("redis-master-1", "app-server-integration", "prometheus", "grafana")

  while ($elapsedTime -lt $maxWaitTime) {
    $allHealthy = $true

    foreach ($service in $services) {
      $health = docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps --services --filter "status=running" | Where-Object { $_ -eq $service }

      if ($health) {
        if ($service -notin $healthyServices) {
          $healthyServices += $service
          Write-Log "サービス '$service' が起動しました"
        }
      }
      else {
        $allHealthy = $false
      }
    }

    if ($allHealthy) {
      Write-Log "=== 全サービスが正常に起動しました ==="
      return $true
    }

    Start-Sleep $waitInterval
    $elapsedTime += $waitInterval
    Write-Log "起動待機中... ($elapsedTime/$maxWaitTime 秒)"
  }

  Write-Log "サービス起動のタイムアウトが発生しました" "ERROR"
  Get-ServiceStatus
  return $false
}

function Invoke-IntegrationTests {
  param([string]$Type = "all")

  Write-Log "=== 統合テスト実行開始: $Type ==="

  # テスト結果ディレクトリ作成
  if (!(Test-Path $TEST_RESULTS_DIR)) {
    New-Item -ItemType Directory -Path $TEST_RESULTS_DIR -Force | Out-Null
  }

  $testResults = @{}
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

  switch ($Type) {
    "integration" {
      $testResults["integration"] = Invoke-BasicIntegrationTest $timestamp
    }
    "performance" {
      $testResults["performance"] = Invoke-PerformanceTest $timestamp
    }
    "security" {
      $testResults["security"] = Invoke-SecurityTest $timestamp
    }
    "all" {
      $testResults["integration"] = Invoke-BasicIntegrationTest $timestamp
      $testResults["performance"] = Invoke-PerformanceTest $timestamp
      $testResults["security"] = Invoke-SecurityTest $timestamp
    }
  }

  # テスト結果レポート
  Write-Log "=== テスト結果サマリー ==="
  $allPassed = $true

  foreach ($test in $testResults.Keys) {
    $result = $testResults[$test]
    $status = if ($result) { "✅ PASS" } else { "❌ FAIL" }
    Write-Log "$test テスト: $status"

    if (!$result) {
      $allPassed = $false
    }
  }

  $overallStatus = if ($allPassed) { "✅ 全テスト成功" } else { "❌ 一部テスト失敗" }
  Write-Log "=== 総合結果: $overallStatus ==="

  return $allPassed
}

function Invoke-BasicIntegrationTest {
  param([string]$Timestamp)

  Write-Log "基本統合テストを実行中..."

  try {
    # 分散処理テスト実行
    $output = docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T integration-test-runner python test_distributed_processing.py 2>&1
    $success = $LASTEXITCODE -eq 0

    # 結果保存
    $resultFile = Join-Path $TEST_RESULTS_DIR "integration-test-$Timestamp.log"
    $output | Out-File -FilePath $resultFile -Encoding UTF8

    Write-Log "基本統合テスト結果: $resultFile"
    return $success
  }
  catch {
    Write-Log "基本統合テストでエラーが発生: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

function Invoke-PerformanceTest {
  param([string]$Timestamp)

  Write-Log "パフォーマンステストを実行中..."

  try {
    # Locustテスト実行（ヘッドレスモード）
    $testDuration = 120  # 2分間
    $users = 10
    $spawnRate = 2

    Write-Log "Locustパフォーマンステスト実行: $users users, $testDuration seconds"

    $locustCmd = @(
      "docker-compose", "-f", $COMPOSE_FILE, "-p", $PROJECT_NAME,
      "exec", "-T", "locust",
      "locust", "-f", "/mnt/locust/locustfile.py",
      "--headless",
      "--users", $users,
      "--spawn-rate", $spawnRate,
      "--run-time", "${testDuration}s",
      "--host", "http://app-server-integration:3000",
      "--html", "/mnt/locust/report-$Timestamp.html",
      "--csv", "/mnt/locust/results-$Timestamp"
    )

    $output = & $locustCmd[0] $locustCmd[1..$($locustCmd.Length - 1)] 2>&1
    $success = $LASTEXITCODE -eq 0

    # 結果保存
    $resultFile = Join-Path $TEST_RESULTS_DIR "performance-test-$Timestamp.log"
    $output | Out-File -FilePath $resultFile -Encoding UTF8

    Write-Log "パフォーマンステスト結果: $resultFile"
    return $success
  }
  catch {
    Write-Log "パフォーマンステストでエラーが発生: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

function Invoke-SecurityTest {
  param([string]$Timestamp)

  Write-Log "セキュリティテストを実行中..."

  try {
    # SonarQubeスキャン実行
    Write-Log "SonarQubeセキュリティスキャンを実行中..."

    $sonarCmd = @(
      "docker-compose", "-f", $COMPOSE_FILE, "-p", $PROJECT_NAME,
      "exec", "-T", "sonarqube",
      "sonar-scanner",
      "-Dsonar.projectBaseDir=/usr/src",
      "-Dsonar.sources=.",
      "-Dsonar.host.url=http://localhost:9000"
    )

    $output = & $sonarCmd[0] $sonarCmd[1..$($sonarCmd.Length - 1)] 2>&1
    $success = $LASTEXITCODE -eq 0

    # 結果保存
    $resultFile = Join-Path $TEST_RESULTS_DIR "security-test-$Timestamp.log"
    $output | Out-File -FilePath $resultFile -Encoding UTF8

    Write-Log "セキュリティテスト結果: $resultFile"
    return $success
  }
  catch {
    Write-Log "セキュリティテストでエラーが発生: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

function Stop-IntegrationEnvironment {
  Write-Log "=== 統合テスト環境停止開始 ==="

  # コンテナ停止
  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans

  if ($LASTEXITCODE -eq 0) {
    Write-Log "=== 統合テスト環境が正常に停止しました ==="
  }
  else {
    Write-Log "環境停止中にエラーが発生しました" "ERROR"
  }
}

function Get-ServiceStatus {
  Write-Log "=== サービスステータス ==="

  $services = docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps --format table
  $services | ForEach-Object { Write-Log $_ }

  # Prometheus メトリクス確認
  try {
    $null = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/label/__name__/values" -TimeoutSec 5
    Write-Log "Prometheus接続: OK"
  }
  catch {
    Write-Log "Prometheus接続: NG" "ERROR"
  }

  # Grafana 確認
  try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    Write-Log "Grafana接続: OK"
  }
  catch {
    Write-Log "Grafana接続: NG" "ERROR"
  }
}

function Get-Logs {
  Write-Log "=== サービスログ取得 ==="

  $logFile = Join-Path $LOG_DIR "docker-logs-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs --tail=100 > $logFile

  Write-Log "Dockerログを保存しました: $logFile"
}

function Invoke-Cleanup {
  Write-Log "=== クリーンアップ開始 ==="

  # 全コンテナ・ボリューム削除
  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --volumes --remove-orphans --rmi all

  # 未使用リソース削除
  docker system prune -f

  Write-Log "=== クリーンアップ完了 ==="
}

# メイン処理
function Main {
  Write-Log "Phase 3-Full統合テスト環境管理スクリプト開始"
  Write-Log "アクション: $Action, テストタイプ: $TestType"

  # 前提条件チェック
  if (!(Test-Prerequisites)) {
    exit 1
  }

  switch ($Action) {
    "start" {
      Start-IntegrationEnvironment
    }
    "test" {
      $success = Invoke-IntegrationTests -Type $TestType
      if (!$success) { exit 1 }
    }
    "stop" {
      Stop-IntegrationEnvironment
    }
    "full" {
      if (Start-IntegrationEnvironment) {
        $success = Invoke-IntegrationTests -Type $TestType
        Stop-IntegrationEnvironment
        if (!$success) { exit 1 }
      }
      else {
        exit 1
      }
    }
    "status" {
      Get-ServiceStatus
    }
    "logs" {
      Get-Logs
    }
    "cleanup" {
      Invoke-Cleanup
    }
  }

  Write-Log "=== 処理完了 ==="
}

# スクリプト実行
Main
