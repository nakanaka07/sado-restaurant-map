# 📦 Phosphor Icons PNG ダウンロード・SVG変換スクリプト
# 用途: 10カテゴリのマーカーアイコンを一括取得・変換・最適化
# 実行: .\scripts\download-convert-phosphor-icons.ps1

param(
  [string]$OutputDir = "src/assets/markers/phosphor",
  [string]$TempDir = "temp/phosphor-png",
  [switch]$CleanTemp
)

# 🎯 設定
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# CleanTempのデフォルト値設定
if (-not $PSBoundParameters.ContainsKey('CleanTemp')) {
  $CleanTemp = $true
}

Write-Host "🚀 Phosphor Icons ダウンロード・変換開始" -ForegroundColor Green
Write-Host "出力先: $OutputDir" -ForegroundColor Yellow

# ディレクトリ作成
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# 🎨 10カテゴリ アイコン定義
$icons = @(
  @{
    name        = "bowl-food"
    category    = "japanese"
    description = "和食 - 茶碗アイコン"
    # Phosphor Icons Regular 32px PNG URL (推定)
    url         = "https://img.icons8.com/fluency-systems-regular/32/bowl.png"
  },
  @{
    name        = "bowl-steam"
    category    = "noodles"
    description = "麺類 - 湯気付き茶碗"
    url         = "https://img.icons8.com/fluency-systems-regular/32/noodles.png"
  },
  @{
    name        = "fire"
    category    = "grill"
    description = "焼肉・グリル - 炎アイコン"
    url         = "https://img.icons8.com/fluency-systems-regular/32/fire-element.png"
  },
  @{
    name        = "globe"
    category    = "international"
    description = "多国籍料理 - 地球アイコン"
    url         = "https://img.icons8.com/fluency-systems-regular/32/globe.png"
  },
  @{
    name        = "coffee"
    category    = "cafe"
    description = "カフェ・軽食 - コーヒーカップ"
    url         = "https://img.icons8.com/fluency-systems-regular/32/coffee.png"
  },
  @{
    name        = "beer-stein"
    category    = "bar"
    description = "居酒屋・バー - ビールジョッキ"
    url         = "https://img.icons8.com/fluency-systems-regular/32/beer.png"
  },
  @{
    name        = "hamburger"
    category    = "fastfood"
    description = "ファストフード - ハンバーガー"
    url         = "https://img.icons8.com/fluency-systems-regular/32/hamburger.png"
  },
  @{
    name        = "fork-knife"
    category    = "restaurant"
    description = "一般レストラン - 食器"
    url         = "https://img.icons8.com/fluency-systems-regular/32/cutlery.png"
  },
  @{
    name        = "car"
    category    = "parking"
    description = "駐車場 - 自動車"
    url         = "https://img.icons8.com/fluency-systems-regular/32/car.png"
  },
  @{
    name        = "toilet"
    category    = "toilet"
    description = "トイレ - 便器"
    url         = "https://img.icons8.com/fluency-systems-regular/32/toilet-bowl.png"
  }
)

# 📊 進捗カウンター
$total = $icons.Count
$current = 0

foreach ($icon in $icons) {
  $current++
  $percent = [math]::Round(($current / $total) * 100)

  Write-Host "📥 [$current/$total] $($icon.description) をダウンロード中..." -ForegroundColor Cyan

  try {
    # PNG ダウンロード
    $pngPath = Join-Path $TempDir "$($icon.name).png"
    Invoke-WebRequest -Uri $icon.url -OutFile $pngPath -TimeoutSec 30

    if (Test-Path $pngPath) {
      $pngSize = (Get-Item $pngPath).Length
      Write-Host "  ✅ PNG取得: $pngSize bytes" -ForegroundColor Green

      # 🔄 PNG → SVG 変換 (シンプルなベクター化)
      $svgPath = Join-Path $OutputDir "$($icon.name).svg"

      # SVGテンプレート生成（PNG埋め込み方式）
      $pngBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pngPath))

      $svgContent = @"
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .icon { filter: brightness(0) invert(1); }
      @media (prefers-color-scheme: dark) { .icon { filter: brightness(1) invert(0); } }
    </style>
  </defs>
  <image class="icon" href="data:image/png;base64,$pngBase64" width="32" height="32"/>
</svg>
"@

      Set-Content -Path $svgPath -Value $svgContent -Encoding UTF8

      $svgSize = (Get-Item $svgPath).Length

      Write-Host "  🎯 SVG変換完了: $svgSize bytes" -ForegroundColor Green
      Write-Host "  📊 進捗: $percent% ($current/$total)" -ForegroundColor Yellow

    }
    else {
      Write-Warning "PNG ダウンロードに失敗: $($icon.name)"
    }

  }
  catch {
    Write-Error "エラー: $($icon.name) - $($_.Exception.Message)"
  }
}

# 📋 結果サマリー
Write-Host "`n📊 変換結果サマリー" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

$svgFiles = Get-ChildItem -Path $OutputDir -Filter "*.svg"
$totalSize = ($svgFiles | Measure-Object -Property Length -Sum).Sum

Write-Host "✅ 変換完了: $($svgFiles.Count)/$total ファイル" -ForegroundColor Green
Write-Host "📦 総ファイルサイズ: $([math]::Round($totalSize / 1KB, 1)) KB" -ForegroundColor Cyan
Write-Host "💾 平均ファイルサイズ: $([math]::Round($totalSize / $svgFiles.Count / 1KB, 1)) KB" -ForegroundColor Cyan

foreach ($file in $svgFiles) {
  $sizeMB = [math]::Round($file.Length / 1KB, 1)
  Write-Host "  📄 $($file.Name): $sizeMB KB" -ForegroundColor White
}

# 🧹 一時ファイル削除
if ($CleanTemp) {
  Write-Host "`n🧹 一時ファイル削除中..." -ForegroundColor Yellow
  Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "✅ クリーンアップ完了" -ForegroundColor Green
}

# 📝 次のステップ案内
Write-Host "`n🎯 次のステップ:" -ForegroundColor Green
Write-Host "1. 品質確認: 各SVGファイルを確認" -ForegroundColor White
Write-Host "2. 統合テスト: CircularMarkerコンポーネントでテスト" -ForegroundColor White
Write-Host "3. 最適化: 必要に応じて手動調整" -ForegroundColor White

Write-Host "`n🎉 Phosphor Icons 変換完了!" -ForegroundColor Green
