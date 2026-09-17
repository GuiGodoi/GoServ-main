namespace Backend.Options
{
    /// <summary>
    /// Limites de segurança/abuso, configuráveis pela seção "Security" do appsettings.json.
    /// Usados para evitar que uma mesa/cliente gaste ou peça além do razoável,
    /// e para limitar quantas requisições um mesmo IP pode fazer.
    /// </summary>
    public class SecurityOptions
    {
        public const string SectionName = "Security";

        /// <summary>Valor máximo (em R$) que uma sessão de mesa pode gastar no total.</summary>
        public decimal MaxSpendPerSession { get; set; } = 500m;
        /// <summary>Quantidade máxima de pedidos permitida numa mesma sessão de mesa.</summary>
        public int MaxOrdersPerSession { get; set; } = 20;
        /// <summary>Tamanho máximo do campo de observações do pedido/item.</summary>
        public int NotesMaxLength { get; set; } = 200;
        /// <summary>Quantas requisições um mesmo IP pode fazer dentro da janela de tempo abaixo.</summary>
        public int RateLimitPermitLimit { get; set; } = 60;
        /// <summary>Duração (em segundos) da janela usada para contar as requisições do rate limit.</summary>
        public int RateLimitWindowSeconds { get; set; } = 60;
    }
}
