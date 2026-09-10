using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace Backend.Services
{
    /// <summary>Converte imagem para JPEG compacto antes de gravar no banco.</summary>
    public static class ImageConverter
    {
        public const int MaxWidth = 800;
        public const int JpegQuality = 75;
        public const long MaxUploadBytes = 5 * 1024 * 1024;

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
        };

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        public static bool IsAllowedContentType(string? contentType) =>
            !string.IsNullOrWhiteSpace(contentType) && AllowedContentTypes.Contains(contentType.Trim());

        public static bool IsAllowedFileName(string? fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return false;
            var ext = Path.GetExtension(fileName);
            return !string.IsNullOrEmpty(ext) && AllowedExtensions.Contains(ext);
        }

        public static void ValidateUpload(long contentLength, string? contentType, string? fileName)
        {
            if (contentLength <= 0 || contentLength > MaxUploadBytes)
                throw new ArgumentException("A imagem deve ter entre 1 byte e 5 MB.");

            var typeOk = IsAllowedContentType(contentType);
            var nameOk = IsAllowedFileName(fileName);
            if (!typeOk && !nameOk)
                throw new ArgumentException("Use JPEG, PNG, WebP ou GIF.");
        }

        public static (byte[] Data, string ContentType) ToStoredJpeg(Stream input)
        {
            using var image = Image.Load(input);

            if (image.Width > MaxWidth)
            {
                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(MaxWidth, 0),
                    Mode = ResizeMode.Max
                }));
            }

            using var output = new MemoryStream();
            image.SaveAsJpeg(output, new JpegEncoder { Quality = JpegQuality });
            return (output.ToArray(), "image/jpeg");
        }
    }
}
