#!/usr/bin/env pwsh
# README品質週次レポート生成スクリプト
# 実行: ./scripts/weekly-quality-report.ps1

param(
  [switch]$SendAlert = $false,  # アラート送信フラグ
  [string]$OutputDir = "./tools/reports/weekly"  # 出力ディレクトリ
)

# 出力ディレクトリの作成
if (!(Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force
}

$Date = Get-Date -Format "yyyy-MM-dd"
$ReportFile = "$OutputDir/quality-report-$Date.md"

Write-Host "🚀 README品質週次レポート生成開始..." -ForegroundColor Green

# 品質チェック実行
Write-Host "📊 品質評価実行中..." -ForegroundColor Yellow
pnpm run readme:all

# JSONレポートの読み込み
$AutomationResult = Get-Content "tools/reports/automation-result.json" | ConvertFrom-Json
$TemplateScore = $AutomationResult.qualityCheck.averageTemplateScore
$SCRAPScore = $AutomationResult.qualityCheck.averageSCRAPScore
$FilesAssessed = $AutomationResult.qualityCheck.filesAssessed

# 閾値設定
$TemplateThreshold = 75
$SCRAPThreshold = 90

# レポート生成
$ReportContent = @"
# 📊 README品質週次レポート

> **生成日時**: $(Get-Date -Format "yyyy年MM月dd日 HH:mm:ss")
> **対象期間**: 週次定期レポート
> **評価ファイル数**: $FilesAssessed ファイル

## 📈 品質指標サマリー

| 指標 | スコア | 閾値 | 状態 |
|------|--------|------|------|
| **テンプレート準拠率** | **$TemplateScore%** | $TemplateThreshold% | $(if($TemplateScore -ge $TemplateThreshold){"✅ 合格"}else{"❌ 要改善"}) |
| **SCRAP原則準拠率** | **$SCRAPScore%** | $SCRAPThreshold% | $(if($SCRAPScore -ge $SCRAPThreshold){"✅ 合格"}else{"❌ 要改善"}) |

## 🎯 評価結果

### ✅ 優秀な結果
$(if($TemplateScore -ge $TemplateThreshold -and $SCRAPScore -ge $SCRAPThreshold){
"- 両指標とも閾値を上回る優秀な品質を維持
- 継続的な品質向上の成果が確認されています"
}else{
"現在改善が必要な項目があります。"
})

### 📊 詳細分析

#### テンプレート準拠率: $TemplateScore%
$(if($TemplateScore -ge 80){"🎉 非常に優秀"}elseif($TemplateScore -ge $TemplateThreshold){"✅ 良好"}else{"⚠️ 改善が必要"})

$(if($TemplateScore -lt $TemplateThreshold){
"**改善推奨**:
- 🎯 目的の明記が不足しているファイルの確認
- 📝 対象読者の明確化
- 📅 最終更新日の記載"
})

#### SCRAP原則準拠率: $SCRAPScore%
$(if($SCRAPScore -ge 95){"🎉 非常に優秀"}elseif($SCRAPScore -ge $SCRAPThreshold){"✅ 良好"}else{"⚠️ 改善が必要"})

$(if($SCRAPScore -lt $SCRAPThreshold){
"**改善推奨**:
- ✂️ 簡潔性の向上（冗長な説明の削除）
- 🎯 具体的な例・コード例の追加
- 🛠️ 実用的な使用場面の説明強化"
})

## 🔧 推奨アクション

### 即座実行推奨
$(if($TemplateScore -lt $TemplateThreshold -or $SCRAPScore -lt $SCRAPThreshold){
"1. ``pnpm run readme:fix`` で自動修正
2. ``tools/reports/readme-quality-report.md`` で詳細確認
3. 低評価ファイルの手動改善"
}else{
"品質が良好なため、現在のレベル維持を継続"
})

### 継続的改善
- 月次レビューでの品質指標確認
- 新規README作成時の品質チェック
- チーム内でのベストプラクティス共有

## 📋 品質基準リマインダー

### テンプレート準拠
- 🎯 **目的**: 明確な価値提案
- 👥 **対象**: 使用者の明記
- 📅 **最終更新**: 日付記載

### SCRAP原則
- **S**pecific: 具体的
- **C**oncise: 簡潔
- **R**elevant: 関連性
- **A**ctionable: 実行可能
- **P**ractical: 実用的

---

**自動生成**: README Quality Weekly Report
**次回実行**: $($(Get-Date).AddDays(7).ToString("yyyy年MM月dd日"))
"@

# レポートをファイルに保存
$ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "📄 週次レポート生成完了: $ReportFile" -ForegroundColor Green

# 品質劣化時のアラート
if ($SendAlert -and ($TemplateScore -lt $TemplateThreshold -or $SCRAPScore -lt $SCRAPThreshold)) {
  Write-Host "🚨 品質劣化検出 - アラート送信" -ForegroundColor Red

  # GitHub Issue作成用のスクリプト（要GitHub CLI設定）
  $IssueTitle = "📊 README品質劣化検出 - $Date"
  $IssueBody = @"
## 🚨 README品質モニタリング アラート

**検出日時**: $(Get-Date -Format "yyyy年MM月dd日 HH:mm:ss")

### 📊 品質指標
- **テンプレート準拠率**: $TemplateScore% (閾値: $TemplateThreshold%)
- **SCRAP原則準拠率**: $SCRAPScore% (閾値: $SCRAPThreshold%)

### 🔧 対応手順
1. ``pnpm run readme:all`` で詳細確認
2. ``tools/reports/readme-quality-report.md`` で問題箇所特定
3. ``pnpm run readme:fix`` で自動修正試行
4. 手動修正が必要な場合は該当ファイル更新

**詳細レポート**: $ReportFile
"@

  # GitHub CLI が利用可能な場合はIssue作成
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh issue create --title $IssueTitle --body $IssueBody --label "documentation,quality,automated"
    Write-Host "📋 GitHub Issue作成完了" -ForegroundColor Green
  }
  else {
    Write-Host "⚠️ GitHub CLI未設定のため、Issue作成をスキップ" -ForegroundColor Yellow
  }
}

# 実行結果サマリー
Write-Host "`n📊 週次品質レポート完了" -ForegroundColor Green
Write-Host "テンプレート準拠率: $TemplateScore%" -ForegroundColor $(if ($TemplateScore -ge $TemplateThreshold) { "Green" }else { "Red" })
Write-Host "SCRAP原則準拠率: $SCRAPScore%" -ForegroundColor $(if ($SCRAPScore -ge $SCRAPThreshold) { "Green" }else { "Red" })
Write-Host "レポート保存先: $ReportFile" -ForegroundColor Blue
