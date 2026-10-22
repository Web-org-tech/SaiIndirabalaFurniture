Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "images/hero/hero_furniture.png"
$outPath = Join-Path (Split-Path $imgPath) "hero_furniture.jpg"
$img = [System.Drawing.Image]::FromFile($imgPath)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
$img.Save($outPath, $codec, $encoderParams)
$img.Dispose()

$origSize = [math]::Round((Get-Item $imgPath).Length / 1KB, 1)
$newSize = [math]::Round((Get-Item $outPath).Length / 1KB, 1)
Write-Host "Original PNG: $origSize KB"
Write-Host "Optimized JPG: $newSize KB"
Write-Host "Saved: $([math]::Round((1 - $newSize/$origSize)*100, 1))%"
