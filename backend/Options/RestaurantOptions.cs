namespace Backend.Options
{
    /// <summary>Configurações gerais do estabelecimento, vindas da seção "Restaurant" do appsettings.json.</summary>
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
