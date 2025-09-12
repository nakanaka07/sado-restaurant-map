# PWAアイコン生成スクリプト - title_row1.pngベース
# System.Drawing を使用して画像リサイズ

param(
  [string]$SourceImage = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\src\assets\png\title_row2.png",
  [string]$OutputDir = "c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\public"
)

# .NET System.Drawing アセンブリを読み込み
Add-Type -AssemblyName System.Drawing

# 必要なPWAアイコンサイズ + 追加ファビコン・OGイメージ
$IconSizes = @(
  @{ Size = 64; Filename = "pwa-64x64.png" }
  @{ Size = 192; Filename = "pwa-192x192.png" }
  @{ Size = 512; Filename = "pwa-512x512.png" }
  @{ Size = 180; Filename = "apple-touch-icon.png" }
  @{ Size = 512; Filename = "maskable-icon-512x512.png" }
  # 追加: OGイメージ・ファビコン
  @{ Size = 1200; Filename = "og-image.png"; AspectRatio = "1200x630" }  # OG画像は1200x630推奨
  @{ Size = 32; Filename = "favicon-32x32.png" }     # favicon.ico用の元画像
  @{ Size = 16; Filename = "favicon-16x16.png" }     # favicon.ico用の元画像
)

# 元画像の存在確認
if (-not (Test-Path $SourceImage)) {
  Write-Error "ソース画像が見つかりません: $SourceImage"
  exit 1
}

Write-Host "PWAアイコン生成を開始します..." -ForegroundColor Green
Write-Host "ソース画像: $SourceImage" -ForegroundColor Cyan

try {
  # 元画像を読み込み
  $OriginalImage = [System.Drawing.Image]::FromFile($SourceImage)
  Write-Host "元画像サイズ: $($OriginalImage.Width) x $($OriginalImage.Height)" -ForegroundColor Yellow

  foreach ($IconConfig in $IconSizes) {
    $Size = $IconConfig.Size
    $OutputPath = Join-Path $OutputDir $IconConfig.Filename

    # OG画像の場合は特別なサイズ処理
    if ($IconConfig.AspectRatio -eq "1200x630") {
      Write-Host "生成中: $($IconConfig.Filename) (1200x630 OG画像)" -ForegroundColor Cyan

      # OG画像用の1200x630サイズ
      $OGWidth = 1200
      $OGHeight = 630
      $ResizedImage = New-Object System.Drawing.Bitmap($OGWidth, $OGHeight)
      $Graphics = [System.Drawing.Graphics]::FromImage($ResizedImage)

      # 高品質設定
      $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

      # 元画像のアスペクト比を保持してOGサイズにリサイズ
      $SrcWidth = $OriginalImage.Width
      $SrcHeight = $OriginalImage.Height
      $Scale = [Math]::Min($OGWidth / $SrcWidth, $OGHeight / $SrcHeight)
      $NewWidth = [int]($SrcWidth * $Scale)
      $NewHeight = [int]($SrcHeight * $Scale)

      # 中央配置
      $X = [int](($OGWidth - $NewWidth) / 2)
      $Y = [int](($OGHeight - $NewHeight) / 2)

      # 背景を白で塗りつぶし
      $Graphics.Clear([System.Drawing.Color]::White)
      $Graphics.DrawImage($OriginalImage, $X, $Y, $NewWidth, $NewHeight)
    }
    else {
      Write-Host "生成中: $($IconConfig.Filename) (${Size}x${Size})" -ForegroundColor Cyan

      # 通常の正方形アイコン処理
      $ResizedImage = New-Object System.Drawing.Bitmap($Size, $Size)
      $Graphics = [System.Drawing.Graphics]::FromImage($ResizedImage)

      # 高品質でリサイズ
      $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

      # 元画像のアスペクト比を保持してリサイズ
      $SrcWidth = $OriginalImage.Width
      $SrcHeight = $OriginalImage.Height

      # スケール計算（アスペクト比保持）
      $Scale = [Math]::Min($Size / $SrcWidth, $Size / $SrcHeight)
      $NewWidth = [int]($SrcWidth * $Scale)
      $NewHeight = [int]($SrcHeight * $Scale)

      # 中央配置計算
      $X = [int](($Size - $NewWidth) / 2)
      $Y = [int](($Size - $NewHeight) / 2)

      # 背景を白で塗りつぶし（透明度対応）
      $Graphics.Clear([System.Drawing.Color]::White)

      # リサイズした画像を描画
      $Graphics.DrawImage($OriginalImage, $X, $Y, $NewWidth, $NewHeight)
    }

    # PNGとして保存
    $ResizedImage.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # リソースを解放
    $Graphics.Dispose()
    $ResizedImage.Dispose()

    # ファイルサイズ確認
    $FileInfo = Get-Item $OutputPath
    $FileSizeKB = [Math]::Round($FileInfo.Length / 1024, 1)
    Write-Host "✓ 完了: $($IconConfig.Filename) (${FileSizeKB}KB)" -ForegroundColor Green
  }

  Write-Host "`n🎉 PWAアイコン生成が完了しました！" -ForegroundColor Green
  Write-Host "生成されたファイル:" -ForegroundColor Yellow

  foreach ($IconConfig in $IconSizes) {
    $OutputPath = Join-Path $OutputDir $IconConfig.Filename
    if (Test-Path $OutputPath) {
      $FileInfo = Get-Item $OutputPath
      $FileSizeKB = [Math]::Round($FileInfo.Length / 1024, 1)
      Write-Host "  - $($IconConfig.Filename): ${FileSizeKB}KB" -ForegroundColor White
    }
  }

  # favicon.ico生成（32x32と16x16を含む）
  Write-Host "`nfavicon.ico生成中..." -ForegroundColor Cyan

  $FaviconIcoPath = Join-Path $OutputDir "favicon.ico"
  $Favicon32Path = Join-Path $OutputDir "favicon-32x32.png"

  # PowerShellでのICO生成は複雑なため、代替手段として32x32 PNGをICOにリネーム
  # 実際の本格運用では専用ツール（ImageMagick等）を推奨
  if ((Test-Path $Favicon32Path)) {
    try {
      # 32x32 PNGをベースにICOフォーマットで保存を試行
      $Favicon32Image = [System.Drawing.Image]::FromFile($Favicon32Path)
      $IcoImage = New-Object System.Drawing.Bitmap(32, 32)
      $IcoGraphics = [System.Drawing.Graphics]::FromImage($IcoImage)
      $IcoGraphics.DrawImage($Favicon32Image, 0, 0, 32, 32)

      # ICOとして保存（WindowsではPNGをICOとして認識する場合がある）
      $IcoImage.Save($FaviconIcoPath, [System.Drawing.Imaging.ImageFormat]::Png)

      $IcoGraphics.Dispose()
      $IcoImage.Dispose()
      $Favicon32Image.Dispose()

      Write-Host "✓ favicon.ico生成完了" -ForegroundColor Green
    }
    catch {
      Write-Warning "favicon.ico生成に失敗しました: $($_.Exception.Message)"
      Write-Host "32x32 PNGファイルを手動でICO形式に変換してください。" -ForegroundColor Yellow
    }
  }

  # favicon.svg生成（ベクター版をPNGから生成するのは限界があるため、簡易版のみ）
  Write-Host "favicon.svg生成中..." -ForegroundColor Cyan

  $FaviconSvgPath = Join-Path $OutputDir "favicon.svg"
  $SvgContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="white"/>
  <text x="16" y="20" font-family="serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#2563eb">佐渡</text>
  <circle cx="8" cy="8" r="2" fill="#2563eb"/>
  <circle cx="24" cy="8" r="2" fill="#2563eb"/>
  <path d="M 6 24 Q 16 28 26 24" stroke="#2563eb" stroke-width="2" fill="none"/>
</svg>
"@

  try {
    $SvgContent | Set-Content -Path $FaviconSvgPath -Encoding UTF8
    Write-Host "✓ favicon.svg生成完了" -ForegroundColor Green
  }
  catch {
    Write-Warning "favicon.svg生成に失敗しました: $($_.Exception.Message)"
  }

}
catch {
  Write-Error "エラーが発生しました: $($_.Exception.Message)"
  exit 1
}
finally {
  # 元画像リソースを解放
  if ($OriginalImage) {
    $OriginalImage.Dispose()
  }
}

Write-Host "`n次のステップ:" -ForegroundColor Yellow
Write-Host "1. 'npm run dev' でアプリを起動" -ForegroundColor White
Write-Host "2. ブラウザでPWAアイコン・ファビコンの表示を確認" -ForegroundColor White
Write-Host "3. OG画像がSNS共有で正しく表示されるかテスト" -ForegroundColor White
Write-Host "4. 'npm run build' で本番ビルドをテスト" -ForegroundColor White
