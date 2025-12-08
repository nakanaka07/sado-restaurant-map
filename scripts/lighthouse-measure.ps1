#!/usr/bin/env pwsh
# Lighthouse CI 測定スクリプト (Desktop + Mobile)
# Phase 9: パフォーマンス最適化の効果測定用

param(
    [switch]$SkipBuild,
    [switch]$MobileOnly,
    [switch]$DesktopOnly
)

$ErrorActionPreference = "Continue"

Write-Host "🔍 Lighthouse CI Measurement Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# ビルドステップ
if (-not $SkipBuild) {
    Write-Host "📦 Building production bundle..." -ForegroundColor Yellow
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed" -ForegroundColor Green
    Write-Host ""
}

# dist ディレクトリの確認
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist/ directory not found. Run with build first." -ForegroundColor Red
    exit 1
}

Write-Host "📊 Starting Lighthouse measurements..." -ForegroundColor Yellow
Write-Host ""

# Desktop 測定
if (-not $MobileOnly) {
    Write-Host "🖥️  Running Desktop Lighthouse..." -ForegroundColor Cyan
    pnpm exec lhci autorun --config=lighthouserc.json
    $desktopResult = $LASTEXITCODE

    if ($desktopResult -eq 0) {
        Write-Host "✅ Desktop measurement completed" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Desktop measurement finished with warnings (exit code: $desktopResult)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Mobile 測定
if (-not $DesktopOnly) {
    Write-Host "📱 Running Mobile Lighthouse..." -ForegroundColor Cyan
    pnpm exec lhci autorun --config=lighthouserc-mobile.json
    $mobileResult = $LASTEXITCODE

    if ($mobileResult -eq 0) {
        Write-Host "✅ Mobile measurement completed" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Mobile measurement finished with warnings (exit code: $mobileResult)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# レポート生成
Write-Host "📄 Generating summary report..." -ForegroundColor Yellow

if (Test-Path ".lighthouseci") {
    $reports = Get-ChildItem -Path ".lighthouseci" -Filter "*.json" -Recurse | Where-Object { $_.Name -like "*report*" }

    if ($reports.Count -gt 0) {
        Write-Host "✅ Found $($reports.Count) Lighthouse report(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "📍 Report location: .lighthouseci/" -ForegroundColor Cyan

        # manifest.json から結果を抽出
        if (Test-Path ".lighthouseci/manifest.json") {
            Write-Host ""
            Write-Host "📊 Scores Summary:" -ForegroundColor Cyan
            Write-Host "==================" -ForegroundColor Cyan

            $manifest = Get-Content ".lighthouseci/manifest.json" | ConvertFrom-Json

            foreach ($run in $manifest) {
                $reportPath = Join-Path ".lighthouseci" $run.jsonPath
                if (Test-Path $reportPath) {
                    $report = Get-Content $reportPath | ConvertFrom-Json
                    $categories = $report.categories

                    $device = if ($run.url -like "*mobile*" -or $report.configSettings.formFactor -eq "mobile") { "Mobile" } else { "Desktop" }

                    Write-Host ""
                    Write-Host "[$device] Run:" -ForegroundColor Yellow
                    Write-Host "  Performance:    $([math]::Round($categories.performance.score * 100))%" -ForegroundColor $(if ($categories.performance.score -ge 0.9) { "Green" } elseif ($categories.performance.score -ge 0.6) { "Yellow" } else { "Red" })
                    Write-Host "  Accessibility:  $([math]::Round($categories.accessibility.score * 100))%" -ForegroundColor $(if ($categories.accessibility.score -ge 0.95) { "Green" } else { "Red" })
                    Write-Host "  Best Practices: $([math]::Round($categories.'best-practices'.score * 100))%" -ForegroundColor $(if ($categories.'best-practices'.score -ge 0.85) { "Green" } else { "Yellow" })
                    Write-Host "  SEO:            $([math]::Round($categories.seo.score * 100))%" -ForegroundColor $(if ($categories.seo.score -ge 0.9) { "Green" } else { "Yellow" })

                    # 主要メトリクス
                    $audits = $report.audits
                    Write-Host ""
                    Write-Host "  Key Metrics:" -ForegroundColor Cyan

                    if ($audits.'first-contentful-paint') {
                        $fcp = [math]::Round($audits.'first-contentful-paint'.numericValue)
                        Write-Host "    FCP:  $($fcp)ms" -ForegroundColor $(if ($fcp -le 1800) { "Green" } elseif ($fcp -le 3000) { "Yellow" } else { "Red" })
                    }

                    if ($audits.'largest-contentful-paint') {
                        $lcp = [math]::Round($audits.'largest-contentful-paint'.numericValue)
                        Write-Host "    LCP:  $($lcp)ms" -ForegroundColor $(if ($lcp -le 2500) { "Green" } elseif ($lcp -le 4000) { "Yellow" } else { "Red" })
                    }

                    if ($audits.'total-blocking-time') {
                        $tbt = [math]::Round($audits.'total-blocking-time'.numericValue)
                        Write-Host "    TBT:  $($tbt)ms" -ForegroundColor $(if ($tbt -le 300) { "Green" } elseif ($tbt -le 8000) { "Yellow" } else { "Red" })
                    }

                    if ($audits.'cumulative-layout-shift') {
                        $cls = [math]::Round($audits.'cumulative-layout-shift'.numericValue, 3)
                        Write-Host "    CLS:  $cls" -ForegroundColor $(if ($cls -le 0.1) { "Green" } elseif ($cls -le 0.25) { "Yellow" } else { "Red" })
                    }

                    if ($audits.'speed-index') {
                        $si = [math]::Round($audits.'speed-index'.numericValue)
                        Write-Host "    SI:   $($si)ms" -ForegroundColor $(if ($si -le 3400) { "Green" } elseif ($si -le 6000) { "Yellow" } else { "Red" })
                    }

                    if ($audits.'interactive') {
                        $tti = [math]::Round($audits.'interactive'.numericValue)
                        Write-Host "    TTI:  $($tti)ms" -ForegroundColor $(if ($tti -le 3800) { "Green" } elseif ($tti -le 7000) { "Yellow" } else { "Red" })
                    }
                }
            }
        }

        Write-Host ""
        Write-Host "✅ Lighthouse CI measurement completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📖 View detailed reports:" -ForegroundColor Cyan
        Write-Host "   Open .lighthouseci/*.report.html in browser" -ForegroundColor Gray

    }
    else {
        Write-Host "⚠️  No report files found" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  .lighthouseci directory not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Phase 9 Target Comparison:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Mobile TBT:  Target <8,000ms  (Baseline: 12,670ms)" -ForegroundColor Gray
Write-Host "Desktop TBT: Target <1,500ms  (Baseline: 2,910ms)" -ForegroundColor Gray
Write-Host "Performance: Target 75+       (Baseline: 60)" -ForegroundColor Gray
Write-Host ""
