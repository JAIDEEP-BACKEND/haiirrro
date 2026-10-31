Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.IO;

public class WinScreenCapture {
    [DllImport("user32.dll")]
    public static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindowDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);

    [DllImport("gdi32.dll")]
    public static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);

    [DllImport("gdi32.dll")]
    public static extern bool DeleteDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);

    [DllImport("gdi32.dll")]
    public static extern bool BitBlt(IntPtr hdcDest, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hdcSrc, int nXSrc, int nYSrc, uint dwRop);

    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);

    public const int SM_CXSCREEN = 0;
    public const int SM_CYSCREEN = 1;
    public const uint SRCCOPY = 0x00CC0020;
    public const uint CAPTUREBLT = 0x40000000;

    public static string CaptureBase64() {
        int width = GetSystemMetrics(SM_CXSCREEN);
        int height = GetSystemMetrics(SM_CYSCREEN);
        if (width <= 0) width = 1920;
        if (height <= 0) height = 1080;

        IntPtr hdcSrc = GetDC(IntPtr.Zero);
        IntPtr hdcDest = CreateCompatibleDC(hdcSrc);
        IntPtr hBitmap = CreateCompatibleBitmap(hdcSrc, width, height);
        IntPtr hOld = SelectObject(hdcDest, hBitmap);

        BitBlt(hdcDest, 0, 0, width, height, hdcSrc, 0, 0, SRCCOPY | CAPTUREBLT);
        SelectObject(hdcDest, hOld);

        Bitmap bmp = Image.FromHbitmap(hBitmap);
        DeleteObject(hBitmap);
        DeleteDC(hdcDest);
        ReleaseDC(IntPtr.Zero, hdcSrc);

        using (MemoryStream ms = new MemoryStream()) {
            bmp.Save(ms, ImageFormat.Jpeg);
            bmp.Dispose();
            return Convert.ToBase64String(ms.ToArray());
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

[WinScreenCapture]::CaptureBase64()
