# 大型アイコン最適化スクリプト - Phase 3対応
# 目標: 現在37.1%削減から50%削減へ向上

param(
    [string]$SourceDir = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\src\assets\images",
    [string]$BackupDir = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\backup\large-icons"
)

# .NET System.Drawing アセンブリを読み込み
Add-Type -AssemblyName System.Drawing

# 最適化対象: 最大5つのファイル
$TargetIcons = @(
    "cafe_icon.png",       # 170.41 KB → 目標 85 KB
    "chinese_icon.png",    # 124.08 KB → 目標 60 KB
    "ramen_icon.png",      # 116.10 KB → 目標 55 KB
    "ano_icon01.png",      # 115.90 KB → 目標 55 KB
    "dessert_icon.png"     # 96.01 KB → 目標 45 KB
)

Write-Host "=== 大型アイコン最適化スタート ===" -ForegroundColor Green
Write-Host "目標: バンドルサイズ50%削減達成" -ForegroundColor Yellow

# バックアップディレクトリ作成
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "バックアップディレクトリを作成: $BackupDir" -ForegroundColor Cyan
}

$TotalOriginalSize = 0
$TotalOptimizedSize = 0

foreach ($IconName in $TargetIcons) {
    $SourcePath = Join-Path $SourceDir $IconName
    $BackupPath = Join-Path $BackupDir "original_$IconName"

    if (-not (Test-Path $SourcePath)) {
        Write-Warning "ファイルが見つかりません: $SourcePath"
        continue
    }

    # バックアップ作成
    Copy-Item $SourcePath $BackupPath -Force

    # 元のサイズを記録
    $OriginalSize = (Get-Item $SourcePath).Length
    $TotalOriginalSize += $OriginalSize

    Write-Host "`n処理中: $IconName" -ForegroundColor Cyan
    Write-Host "元サイズ: $([math]::Round($OriginalSize/1KB, 2)) KB" -ForegroundColor White

    try {
        # 画像を読み込み
        $Image = [System.Drawing.Image]::FromFile($SourcePath)
        $OriginalWidth = $Image.Width
        $OriginalHeight = $Image.Height

        # 品質を落とさずにサイズを最適化
        # 1. 若干のリサイズ (95%サイズ) + 品質最適化
        $NewWidth = [int]($OriginalWidth * 0.95)
        $NewHeight = [int]($OriginalHeight * 0.95)

        # 新しい画像を作成
        $OptimizedImage = New-Object System.Drawing.Bitmap($NewWidth, $NewHeight)
        $Graphics = [System.Drawing.Graphics]::FromImage($OptimizedImage)

        # 高品質設定
        $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        # リサイズして描画
        $Graphics.DrawImage($Image, 0, 0, $NewWidth, $NewHeight)

        # 元の画像を解放
        $Image.Dispose()
        $Graphics.Dispose()

        # 圧縮設定で保存
        $EncoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $EncoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, [long]85)

        # PNGエンコーダーを取得
        $Codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                 Where-Object { $_.MimeType -eq "image/png" }

        # 最適化された画像を保存
        $OptimizedImage.Save($SourcePath, $Codec, $EncoderParams)
        $OptimizedImage.Dispose()

        # 新しいサイズを確認
        $NewSize = (Get-Item $SourcePath).Length
        $TotalOptimizedSize += $NewSize
        $ReductionPercent = [math]::Round((($OriginalSize - $NewSize) / $OriginalSize) * 100, 1)

        Write-Host "新サイズ: $([math]::Round($NewSize/1KB, 2)) KB" -ForegroundColor Green
        Write-Host "削減率: $ReductionPercent%" -ForegroundColor Green

        if ($ReductionPercent -ge 45) {
            Write-Host "✅ 優秀な最適化達成!" -ForegroundColor Green
        } elseif ($ReductionPercent -ge 30) {
            Write-Host "✅ 良好な最適化達成!" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  最適化が限定的です" -ForegroundColor Red
        }

    } catch {
        Write-Error "エラー発生: $IconName - $($_.Exception.Message)"
        # エラーの場合は元に戻す
        Copy-Item $BackupPath $SourcePath -Force
    }
}

# 総合結果
Write-Host "`n=== 最適化完了 ===" -ForegroundColor Green
$OverallReduction = [math]::Round((($TotalOriginalSize - $TotalOptimizedSize) / $TotalOriginalSize) * 100, 1)
Write-Host "元の総サイズ: $([math]::Round($TotalOriginalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "最適化後サイズ: $([math]::Round($TotalOptimizedSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "総削減率: $OverallReduction%" -ForegroundColor Green

if ($OverallReduction -ge 50) {
    Write-Host "🎉 目標50%削減達成!" -ForegroundColor Green
} elseif ($OverallReduction -ge 40) {
    Write-Host "✅ 良好な結果です!" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  追加最適化が必要です" -ForegroundColor Red
}

Write-Host "`nバックアップ場所: $BackupDir" -ForegroundColor Cyan
Write-Host "問題がある場合は元ファイルを復元してください。" -ForegroundColor Yellow
