# 圧縮効果確認スクリプト
# 圧縮完了後にPowerShellで実行してください

Set-Location "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\src\assets\png"
Write-Host "📊 圧縮効果確認..." -ForegroundColor Green

$criticalIcons = @("cafe_icon.png", "seafood_icon.png", "dessert_icon.png", "ramen_icon.png")
$totalSizeAfter = 0
$totalSizeBefore = 0

# バックアップサイズ取得
$backupDir = "backup_20250911"
foreach ($icon in $criticalIcons) {
  $backupPath = Join-Path $backupDir $icon
  if (Test-Path $backupPath) {
    $totalSizeBefore += (Get-Item $backupPath).Length
  }
}

# 現在のサイズ取得と表示
Write-Host "`n=== 圧縮結果 ===" -ForegroundColor Cyan
foreach ($icon in $criticalIcons) {
  if (Test-Path $icon) {
    $currentSize = (Get-Item $icon).Length
    $totalSizeAfter += $currentSize
    $backupPath = Join-Path $backupDir $icon
    $originalSize = (Get-Item $backupPath).Length
    $reduction = [Math]::Round((1 - $currentSize / $originalSize) * 100, 1)

    Write-Host "✅ $icon`: $([Math]::Round($originalSize/1KB,1))KB → $([Math]::Round($currentSize/1KB,1))KB (${reduction}%削減)" -ForegroundColor Green
  }
}

$totalReduction = [Math]::Round((1 - $totalSizeAfter / $totalSizeBefore) * 100, 1)
Write-Host "`n🎯 合計効果:" -ForegroundColor Yellow
Write-Host "   圧縮前: $([Math]::Round($totalSizeBefore/1MB,2)) MB" -ForegroundColor Red
Write-Host "   圧縮後: $([Math]::Round($totalSizeAfter/1MB,2)) MB" -ForegroundColor Green
Write-Host "   削減率: ${totalReduction}%" -ForegroundColor Cyan

if ($totalSizeAfter -lt 300KB) {
  Write-Host "`n🏆 目標達成！優秀な圧縮効果です！" -ForegroundColor Green
}
elseif ($totalSizeAfter -lt 600KB) {
  Write-Host "`n✅ 良好な圧縮効果です。" -ForegroundColor Blue
}
else {
  Write-Host "`n⚠️ さらなる圧縮が必要かもしれません。" -ForegroundColor Yellow
}
