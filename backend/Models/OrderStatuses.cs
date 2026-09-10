namespace Backend.Models
{
    public static class OrderStatuses
    {
        /// <summary>Pedido criado, aguardando confirmação do Pix (ainda não vai à cozinha).</summary>
        public const string AwaitingPayment = "AwaitingPayment";
        public const string Received = "Received";
        public const string Preparing = "Preparing";
        public const string Ready = "Ready";
        public const string Delivered = "Delivered";
        public const string Cancelled = "Cancelled";

        public static readonly string[] All =
        [
            AwaitingPayment, Received, Preparing, Ready, Delivered, Cancelled
        ];

        /// <summary>Status visíveis no KDS (após pagamento).</summary>
        public static readonly string[] KitchenVisible =
        [
            Received, Preparing, Ready
        ];
    }
}
