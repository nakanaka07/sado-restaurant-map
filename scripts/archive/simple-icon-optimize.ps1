# 簡単アイコン圧縮スクリプト - 既存手法活用
param(
  [string]$SourceDir = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\src\assets\png"
)

Write-Host "=== 大型アイコン最適化 (簡易版) ===" -ForegroundColor Green

# 最適化対象アイコン
$TargetFiles = @(
  "cafe_icon.png",
  "chinese_icon.png",
  "ramen_icon.png",
  "ano_icon01.png",
  "dessert_icon.png"
)

$TotalBefore = 0
$TotalAfter = 0

foreach ($FileName in $TargetFiles) {
  $FilePath = Join-Path $SourceDir $FileName

  if (Test-Path $FilePath) {
    $SizeBefore = (Get-Item $FilePath).Length
    $TotalBefore += $SizeBefore

    Write-Host "`n処理: $FileName" -ForegroundColor Cyan
    Write-Host "元サイズ: $([math]::Round($SizeBefore/1KB, 1)) KB" -ForegroundColor White

    # TinyPNG風の手動最適化
    # 既存のPNG最適化手法を適用
    try {
      # PowerShellでのPNG圧縮（品質保持）
      Add-Type -AssemblyName System.Drawing

      $Image = [System.Drawing.Image]::FromFile($FilePath)
      $NewImage = New-Object System.Drawing.Bitmap($Image.Width, $Image.Height)
      $Graphics = [System.Drawing.Graphics]::FromImage($NewImage)

      # 高品質設定
      $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

      $Graphics.DrawImage($Image, 0, 0)

      $Image.Dispose()
      $Graphics.Dispose()

      # 圧縮保存
      $NewImage.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Png)
      $NewImage.Dispose()

      $SizeAfter = (Get-Item $FilePath).Length
      $TotalAfter += $SizeAfter

      $Reduction = [math]::Round((($SizeBefore - $SizeAfter) / $SizeBefore) * 100, 1)

      Write-Host "新サイズ: $([math]::Round($SizeAfter/1KB, 1)) KB" -ForegroundColor Green
      Write-Host "削減率: $Reduction%" -ForegroundColor Green

    }
    catch {
      Write-Warning "最適化エラー: $FileName - $($_.Exception.Message)"
      $TotalAfter += $SizeBefore
    }
  }
  else {
    Write-Warning "ファイルが見つかりません: $FileName"
  }
}

# 結果表示
Write-Host "`n=== 最適化結果 ===" -ForegroundColor Green
$OverallReduction = if ($TotalBefore -gt 0) { [math]::Round((($TotalBefore - $TotalAfter) / $TotalBefore) * 100, 1) } else { 0 }

Write-Host "合計 Before: $([math]::Round($TotalBefore/1KB, 1)) KB" -ForegroundColor White
Write-Host "合計 After: $([math]::Round($TotalAfter/1KB, 1)) KB" -ForegroundColor White
Write-Host "総削減率: $OverallReduction%" -ForegroundColor Green

if ($OverallReduction -ge 40) {
  Write-Host "🎉 優秀な最適化!" -ForegroundColor Green
}
elseif ($OverallReduction -ge 20) {
  Write-Host "✅ 良好な結果!" -ForegroundColor Yellow
}
else {
  Write-Host "ℹ️  追加手法が必要かもしれません" -ForegroundColor Blue
}
