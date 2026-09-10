using System.Collections.Concurrent;
using Backend.Options;
using Microsoft.Extensions.Options;

namespace Backend.Middleware
{
    /// <summary>Limite simples de requisições por IP (janela fixa em memória).</summary>
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

            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var windowKey = $"{ip}:{GetWindowId()}";
            var counter = Counters.GetOrAdd(windowKey, _ => new WindowCounter());

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
