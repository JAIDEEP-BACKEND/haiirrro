[CmdletBinding()]
param(
    [string]$OutputPath = ""
)

try {
    Add-Type -AssemblyName System.Windows.Forms, System.Drawing
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
    $bounds = $screen.Bounds

    # Create full resolution 32bpp bitmap
    $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # CopyFromScreen with desktop compositor
    $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size, [System.Drawing.CopyPixelOperation]::SourceCopy)

    if ($OutputPath -ne "") {
        $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    } else {
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $bytes = $ms.ToArray()
        [System.Convert]::ToBase64String($bytes)
        $ms.Dispose()
    }

    $graphics.Dispose()
    $bmp.Dispose()
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
