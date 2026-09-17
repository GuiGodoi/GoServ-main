using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace Backend.Services
{
    /// <summary>Converte imagem para JPEG compacto antes de gravar no banco.</summary>
    public static class ImageConverter
    {
        /// <summary>Largura máxima (em pixels) salva no banco — imagens maiores são redimensionadas.</summary>
        public const int MaxWidth = 800;
        /// <summary>Qualidade do JPEG salvo (0-100). 75 é um bom equilíbrio entre tamanho e nitidez.</summary>
        public const int JpegQuality = 75;
        /// <summary>Tamanho máximo aceito no upload, antes de qualquer conversão (5 MB).</summary>
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

        /// <summary>
        /// Confere tamanho e tipo do arquivo antes de tentar processá-lo. Aceita se
        /// o content-type OU a extensão do nome do arquivo forem de um formato permitido
        /// (alguns navegadores/clientes não mandam o content-type correto).
        /// </summary>
        public static void ValidateUpload(long contentLength, string? contentType, string? fileName)
        {
            if (contentLength <= 0 || contentLength > MaxUploadBytes)
                throw new ArgumentException("A imagem deve ter entre 1 byte e 5 MB.");

            var typeOk = IsAllowedContentType(contentType);
            var nameOk = IsAllowedFileName(fileName);
            if (!typeOk && !nameOk)
                throw new ArgumentException("Use JPEG, PNG, WebP ou GIF.");
        }

        /// <summary>Redimensiona (se preciso) e recomprime a imagem enviada, sempre
        /// devolvendo um JPEG pequeno e padronizado para salvar no banco.</summary>
        public static (byte[] Data, string ContentType) ToStoredJpeg(Stream input)
        {
            using var image = Image.Load(input);

            // Só redimensiona se a imagem for maior que o limite; a altura é
            // calculada automaticamente para manter a proporção original.
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
