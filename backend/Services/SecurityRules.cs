using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace Backend.Services
{
    /// <summary>Sanitização e limites de segurança (Aula 9).</summary>
    public static class SecurityRules
    {
        private static readonly Regex TagRegex = new("<.*?>", RegexOptions.Singleline | RegexOptions.Compiled);
        private static readonly Regex ControlRegex = new(@"[\u0000-\u0008\u000B\u000C\u000E-\u001F]", RegexOptions.Compiled);

        public static string? SanitizeNotes(string? input, int maxLength = 200)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;

            var text = WebUtility.HtmlDecode(input);
            text = TagRegex.Replace(text, string.Empty);
            text = ControlRegex.Replace(text, string.Empty);
            text = text.Replace('\u00A0', ' ').Trim();

            // Colapsa espaços excessivos
            var sb = new StringBuilder(text.Length);
            var prevSpace = false;
            foreach (var ch in text)
            {
                var isSpace = char.IsWhiteSpace(ch);
                if (isSpace)
                {
                    if (prevSpace) continue;
                    sb.Append(' ');
                    prevSpace = true;
                }
                else
                {
                    sb.Append(ch);
                    prevSpace = false;
                }
            }

            text = sb.ToString().Trim();
            if (text.Length == 0)
                return null;

            if (text.Length > maxLength)
                text = text[..maxLength].Trim();

            return text;
        }

        public static void EnsureWithinSessionCap(
            decimal currentSpent,
            decimal newOrderTotal,
            decimal spendingCap)
        {
            if (spendingCap <= 0)
                return;

            if (currentSpent + newOrderTotal > spendingCap)
            {
                throw new ArgumentException(
                    $"Limite da mesa excedido (máx. {spendingCap:0.00}). Peça liberação à equipe.");
            }
        }

        public static void EnsureWithinOrderCount(int currentOrders, int maxOrders)
        {
            if (maxOrders <= 0)
                return;

            if (currentOrders >= maxOrders)
            {
                throw new ArgumentException(
                    $"Limite de pedidos da sessão atingido ({maxOrders}). Peça liberação à equipe.");
            }
        }
    }
}
