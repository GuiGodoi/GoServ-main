namespace Backend.Options
{
    public class RestaurantOptions
    {
        public const string SectionName = "Restaurant";
        public string Name { get; set; } = "Lanchonete do Zé";
        /// <summary>Minutos até expirar o Pix simulado.</summary>
        public int PixExpiresMinutes { get; set; } = 10;
        /// <summary>URL pública do client (para montar links dos QR codes).</summary>
        public string ClientPublicUrl { get; set; } = "http://localhost:5173";
    }
}
