using System.Collections.Concurrent;
using Backend.Options;
using Microsoft.Extensions.Options;

namespace Backend.Middleware
{
    /// <summary>
    /// Limite simples de requisições por IP (janela fixa em memória): se um IP
    /// fizer requisições demais em pouco tempo, a API responde 429 (Too Many
    /// Requests) até a janela de tempo virar. Protege contra abuso/DoS básico.
    /// </summary>
    public class RateLimitMiddleware
    {
        private static readonly ConcurrentDictionary<string, WindowCounter> Counters = new();
        private readonly RequestDelegate _next;
        private readonly SecurityOptions _options;

        public RateLimitMiddleware(RequestDelegate next, IOptions<SecurityOptions> options)
        {
            _next = next;
            _options = options.Value;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (_options.RateLimitPermitLimit <= 0)
            {
                await _next(context);
                return;
            }

            var path = context.Request.Path.Value ?? string.Empty;
            if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // A "janela" (window) é um bloco fixo de tempo (ex: os 60 segundos atuais).
            // Cada IP tem um contador por janela; ao virar a janela, o contador reseta sozinho
            // (é uma chave nova no dicionário), sem precisar de nenhuma limpeza manual.
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var windowKey = $"{ip}:{GetWindowId()}";
            var counter = Counters.GetOrAdd(windowKey, _ => new WindowCounter());

            // Interlocked.Increment soma de forma "thread-safe" (várias requisições
            // podem chegar ao mesmo tempo e mexer nesse contador simultaneamente).
            if (Interlocked.Increment(ref counter.Count) > _options.RateLimitPermitLimit)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers.RetryAfter = _options.RateLimitWindowSeconds.ToString();
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Muitas requisições. Tente novamente em instantes."
                });
                return;
            }

            await _next(context);
        }

        // Identifica em qual "janela" de tempo estamos agora, dividindo o relógio
        // em blocos do tamanho configurado (ex: blocos de 60 em 60 segundos).
        private long GetWindowId()
        {
            var seconds = Math.Max(1, _options.RateLimitWindowSeconds);
            return DateTimeOffset.UtcNow.ToUnixTimeSeconds() / seconds;
        }

        private sealed class WindowCounter
        {
            public int Count;
        }
    }
}
