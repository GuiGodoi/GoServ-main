using Backend.Services;

namespace Backend.Tests;

public class ImageConverterTests
{
    [Theory]
    [InlineData("image/jpeg", true)]
    [InlineData("image/png", true)]
    [InlineData("image/webp", true)]
    [InlineData("application/pdf", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsAllowedContentType_works(string? contentType, bool expected)
    {
        Assert.Equal(expected, ImageConverter.IsAllowedContentType(contentType));
    }

    [Theory]
    [InlineData("burger.jpg", true)]
    [InlineData("foto.WEBP", true)]
    [InlineData("doc.pdf", false)]
    [InlineData("semextensao", false)]
    public void IsAllowedFileName_works(string fileName, bool expected)
    {
        Assert.Equal(expected, ImageConverter.IsAllowedFileName(fileName));
    }

    [Fact]
    public void ValidateUpload_rejects_oversized()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ImageConverter.ValidateUpload(ImageConverter.MaxUploadBytes + 1, "image/jpeg", "a.jpg"));
        Assert.Contains("5 MB", ex.Message);
    }

    [Fact]
    public void ValidateUpload_rejects_bad_type()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ImageConverter.ValidateUpload(100, "application/pdf", "a.pdf"));
        Assert.Contains("JPEG", ex.Message);
    }

    [Fact]
    public void ValidateUpload_accepts_jpeg()
    {
        ImageConverter.ValidateUpload(100, "image/jpeg", "a.jpg");
    }
}
