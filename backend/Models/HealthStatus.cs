namespace Backend.Models
{
    /// <summary>Resposta simples usada pelo endpoint "/api/health" (só para dizer que a API está de pé).</summary>
    public class HealthStatus
    {
        public string Status { get; set; } = string.Empty;
    }
}
