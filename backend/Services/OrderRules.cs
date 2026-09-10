namespace Backend.Services
{
    /// <summary>
    /// Regras puras de precificação e transição de status (testáveis sem banco).
    /// Preços vindos do cliente são ignorados — só entram valores do servidor.
    /// </summary>
    public static class OrderRules
    {
        public static decimal CalculateLineTotal(
            decimal unitPrice,
            int quantity,
            IEnumerable<decimal> addonUnitPrices)
        {
            if (quantity <= 0)
                throw new ArgumentException("A quantidade deve ser maior que zero.");
            if (unitPrice < 0)
                throw new ArgumentException("O preço unitário não pode ser negativo.");

            var addons = addonUnitPrices.Sum();
            if (addons < 0)
                throw new ArgumentException("Preço de adicional inválido.");

            return Math.Round((unitPrice + addons) * quantity, 2, MidpointRounding.AwayFromZero);
        }

        public static decimal CalculateOrderTotal(IEnumerable<decimal> lineTotals) =>
            Math.Round(lineTotals.Sum(), 2, MidpointRounding.AwayFromZero);

        private static readonly Dictionary<string, string[]> AllowedTransitions = new()
        {
            [Models.OrderStatuses.AwaitingPayment] =
                [Models.OrderStatuses.Received, Models.OrderStatuses.Cancelled],
            [Models.OrderStatuses.Received] = [Models.OrderStatuses.Preparing, Models.OrderStatuses.Cancelled],
            [Models.OrderStatuses.Preparing] = [Models.OrderStatuses.Ready, Models.OrderStatuses.Cancelled],
            [Models.OrderStatuses.Ready] = [Models.OrderStatuses.Delivered],
            [Models.OrderStatuses.Delivered] = [],
            [Models.OrderStatuses.Cancelled] = []
        };

        public static bool CanTransition(string fromStatus, string toStatus)
        {
            if (!AllowedTransitions.TryGetValue(fromStatus, out var next))
                return false;
            return next.Contains(toStatus);
        }

        public static void EnsureCanTransition(string fromStatus, string toStatus)
        {
            if (!CanTransition(fromStatus, toStatus))
                throw new InvalidOperationException(
                    $"Transição de status inválida: {fromStatus} → {toStatus}.");
        }
    }
}
