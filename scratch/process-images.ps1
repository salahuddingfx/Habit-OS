# PowerShell Script to process PWA logo images
Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\salau\.gemini\antigravity\brain\68e00da9-ce85-4f17-97bc-ff5900c6a968\pwa_logo_512_1779290678318.png"
$pwa512 = "f:\health-habit-os\public\pwa-512x512.png"
$pwa192 = "f:\health-habit-os\public\pwa-192x192.png"
$favicon = "f:\health-habit-os\public\favicon.ico"

# 1. Copy to 512x512
Copy-Item $srcPath -Destination $pwa512 -Force
Write-Host "Copied 512x512 icon."

# 2. Resize to 192x192
$srcImg = [System.Drawing.Image]::FromFile($pwa512)
$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($srcImg, 0, 0, 192, 192)
$bmp192.Save($pwa192, [System.Drawing.Imaging.ImageFormat]::Png)

$g192.Dispose()
$bmp192.Dispose()
Write-Host "Resized and saved 192x192 icon."

# 3. Create favicon.ico (32x32)
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g32.DrawImage($srcImg, 0, 0, 32, 32)
$iconPointer = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconPointer)
$stream = New-Object System.IO.FileStream($favicon, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()

$g32.Dispose()
$bmp32.Dispose()
$srcImg.Dispose()
Write-Host "Resized and saved favicon.ico."
