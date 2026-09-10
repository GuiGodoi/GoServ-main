using Backend.Services;

namespace Backend.Tests;

public class SecurityRulesTests
{
    [Fact]
    public void SanitizeNotes_StripsHtmlAndTrims()
    {
        var result = SecurityRules.SanitizeNotes("  <b>sem cebola</b>  ");
        Assert.Equal("sem cebola", result);
    }

    [Fact]
    public void SanitizeNotes_ReturnsNullForEmpty()
    {
        Assert.Null(SecurityRules.SanitizeNotes("   "));
        Assert.Null(SecurityRules.SanitizeNotes(null));
    }

    [Fact]
    public void SanitizeNotes_RespectsMaxLength()
    {
        var result = SecurityRules.SanitizeNotes(new string('a', 50), maxLength: 10);
        Assert.Equal(10, result!.Length);
    }

    [Fact]
    public void EnsureWithinSessionCap_AllowsUnderLimit()
    {
        SecurityRules.EnsureWithinSessionCap(100m, 50m, 200m);
    }

    [Fact]
    public void EnsureWithinSessionCap_BlocksOverLimit()
    {
        Assert.Throws<ArgumentException>(() =>
            SecurityRules.EnsureWithinSessionCap(400m, 150m, 500m));
    }

    [Fact]
    public void EnsureWithinOrderCount_BlocksAtLimit()
    {
        Assert.Throws<ArgumentException>(() =>
            SecurityRules.EnsureWithinOrderCount(20, 20));
    }
}
