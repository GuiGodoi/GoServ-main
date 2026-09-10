namespace Backend.Options
{
    public class SecurityOptions
    {
        public const string SectionName = "Security";

        public decimal MaxSpendPerSession { get; set; } = 500m;
        public int MaxOrdersPerSession { get; set; } = 20;
        public int NotesMaxLength { get; set; } = 200;
        public int RateLimitPermitLimit { get; set; } = 60;
        public int RateLimitWindowSeconds { get; set; } = 60;
    }
}
