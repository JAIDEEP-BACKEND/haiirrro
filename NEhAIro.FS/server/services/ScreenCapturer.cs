using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class ScreenCapturer
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    private static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    private static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll")]
    private static extern IntPtr CreateCompatibleDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    private static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);

    [DllImport("gdi32.dll")]
    private static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);

    [DllImport("gdi32.dll")]
    private static extern bool DeleteDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    private static extern bool DeleteObject(IntPtr hObject);

    [DllImport("gdi32.dll")]
    private static extern bool BitBlt(IntPtr hdcDest, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hdcSrc, int nXSrc, int nYSrc, uint dwRop);

    private const uint MAXIMUM_ALLOWED = 0x02000000;
    private const uint SRCCOPY = 0x00CC0020;
    private const uint CAPTUREBLT = 0x40000000;

    private static void AttachInteractiveStation()
    {
        try
        {
            IntPtr hWinSta = OpenWindowStation("WinSta0", false, MAXIMUM_ALLOWED);
            if (hWinSta != IntPtr.Zero)
            {
                SetProcessWindowStation(hWinSta);
            }
            IntPtr hDesktop = OpenDesktop("Default", 0, false, MAXIMUM_ALLOWED);
            if (hDesktop != IntPtr.Zero)
            {
                SetThreadDesktop(hDesktop);
            }
        }
        catch { }
    }

    private static ImageCodecInfo GetEncoder(ImageFormat format)
    {
        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageDecoders();
        foreach (ImageCodecInfo codec in codecs)
        {
            if (codec.FormatID == format.Guid)
            {
                return codec;
            }
        }
        return null;
    }

    public static byte[] CaptureJpeg(long quality = 70L)
    {
        try
        {
            SetProcessDPIAware();
        }
        catch { }

        AttachInteractiveStation();

        int width = Screen.PrimaryScreen.Bounds.Width;
        int height = Screen.PrimaryScreen.Bounds.Height;
        int left = Screen.PrimaryScreen.Bounds.Left;
        int top = Screen.PrimaryScreen.Bounds.Top;

        if (width <= 0) width = 1920;
        if (height <= 0) height = 1080;

        IntPtr hdcSrc = GetDC(IntPtr.Zero);
        IntPtr hdcDest = CreateCompatibleDC(hdcSrc);
        IntPtr hBitmap = CreateCompatibleBitmap(hdcSrc, width, height);
        IntPtr hOld = SelectObject(hdcDest, hBitmap);

        // BitBlt with CAPTUREBLT from interactive desktop DC
        BitBlt(hdcDest, 0, 0, width, height, hdcSrc, left, top, SRCCOPY | CAPTUREBLT);
        SelectObject(hdcDest, hOld);

        Bitmap bmp = Image.FromHbitmap(hBitmap);
        DeleteObject(hBitmap);
        DeleteDC(hdcDest);
        ReleaseDC(IntPtr.Zero, hdcSrc);

        using (MemoryStream ms = new MemoryStream())
        {
            ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
            Encoder myEncoder = Encoder.Quality;
            EncoderParameters myEncoderParameters = new EncoderParameters(1);
            EncoderParameter myEncoderParameter = new EncoderParameter(myEncoder, quality);
            myEncoderParameters.Param[0] = myEncoderParameter;

            if (jpgEncoder != null)
            {
                bmp.Save(ms, jpgEncoder, myEncoderParameters);
            }
            else
            {
                bmp.Save(ms, ImageFormat.Jpeg);
            }
            bmp.Dispose();
            return ms.ToArray();
        }
    }

    public static void Main(string[] args)
    {
        if (args.Length > 0 && args[0] == "file")
        {
            string outPath = args.Length > 1 ? args[1] : "screenshot.jpg";
            byte[] bytes = CaptureJpeg(85L);
            File.WriteAllBytes(outPath, bytes);
        }
        else
        {
            byte[] bytes = CaptureJpeg(70L);
            Console.WriteLine(Convert.ToBase64String(bytes));
        }
    }
}
