// Este é o arquivo que roda quando você executa "dotnet run" (ou "npm run backend").
// Ele monta a API inteira: configura serviços, banco, autenticação, CORS,
// aplica as migrations do banco e liga as rotas/hubs.
using System.Text;
using Backend.Data;
using Backend.Hubs;
using Backend.Middleware;
using Backend.Options;
using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Serviços básicos do ASP.NET (controllers de API + SignalR para tempo real) ---
builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.Configure<SecurityOptions>(
    builder.Configuration.GetSection(SecurityOptions.SectionName));
builder.Services.Configure<RestaurantOptions>(
    builder.Configuration.GetSection(RestaurantOptions.SectionName));

// Aumenta o limite de tamanho de upload (formulário e servidor Kestrel),
// necessário para o envio de fotos dos itens do cardápio.
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = ImageConverter.MaxUploadBytes;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = ImageConverter.MaxUploadBytes;
});

// --- CORS: quem pode chamar a API pelo navegador ---
// Em desenvolvimento liberamos localhost e IPs de rede local (ex: celular testando
// na mesma Wi-Fi), para não precisar configurar isso manualmente a cada teste.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .SetIsOriginAllowed(IsAllowedDevOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// --- Banco de dados (PostgreSQL via EF Core) ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// --- Autenticação por token JWT ---
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Configure Jwt:Key em appsettings.");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name
        };

        // O SignalR não manda o token no cabeçalho Authorization (o navegador não
        // permite isso em conexões WebSocket), então aceitamos o token vindo pela
        // query string apenas nas rotas de hub ("/hubs/...").
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// --- Injeção de dependência: repositórios (acesso a dados) e serviços (regras de negócio) ---
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IMenuItemRepository, MenuItemRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDiningTableRepository, DiningTableRepository>();
builder.Services.AddScoped<IAddonRepository, AddonRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IDayPasscodeService, DayPasscodeService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IMenuItemService, MenuItemService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITableService, TableService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddSingleton<IOrderRealtimeNotifier, OrderRealtimeNotifier>();

var app = builder.Build();

// --- Banco de dados: aplicar migrations + seed antes de começar a atender requisições ---
// O Postgres pode ainda estar de boot quando a API sobe (ex: "docker compose up" acabou
// de rodar), então tentamos algumas vezes com um intervalo entre as tentativas.
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("Program");
    await MigrateDatabaseWithRetryAsync(scope.ServiceProvider, logger, maxAttempts: 10, delayMs: 2000);
}

// --- Pipeline HTTP: ordem em que cada requisição passa pelos middlewares ---
app.UseCors();
app.UseMiddleware<RateLimitMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<KitchenHub>(KitchenHub.Path);
app.MapHub<OrderTrackingHub>(OrderTrackingHub.Path);

app.Run();

// Decide se uma origem (site que está chamando a API) pode ser aceita em desenvolvimento:
// localhost ou qualquer IP de rede local (192.168.x.x, 10.x.x.x, 172.x.x.x).
static bool IsAllowedDevOrigin(string origin)
{
    if (string.IsNullOrWhiteSpace(origin)) return false;

    var uri = new Uri(origin);
    return uri.Host is "localhost" or "127.0.0.1"
        || uri.Host.StartsWith("192.168.")
        || uri.Host.StartsWith("10.")
        || uri.Host.StartsWith("172.");
}

// Aplica as migrations pendentes e o seed de dados iniciais, tentando de novo em caso
// de falha (o banco pode ainda estar iniciando). Lança a exceção só se todas as
// tentativas falharem.
static async Task MigrateDatabaseWithRetryAsync(
    IServiceProvider services, ILogger? logger, int maxAttempts, int delayMs)
{
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            var db = services.GetRequiredService<ApplicationDbContext>();
            db.Database.Migrate();
            await DbSeeder.SeedAsync(db);
            logger?.LogInformation("Banco migrado e seed aplicado com sucesso.");
            return;
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Tentativa {Attempt} de migrar/seed falhou.", attempt);
            if (attempt == maxAttempts)
            {
                logger?.LogError(ex, "Esgotadas as tentativas de migrar o banco.\n{Message}", ex.Message);
                throw;
            }

            Thread.Sleep(delayMs);
        }
    }
}
