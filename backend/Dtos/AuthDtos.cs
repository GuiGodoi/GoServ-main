// DTOs (Data Transfer Objects) usados pelas rotas de login/autenticação.
// São classes "burras": só carregam dados entre o front-end e a API,
// sem nenhuma regra de negócio.
namespace Backend.Dtos
{
    /// <summary>O que o front-end envia para tentar logar.</summary>
    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>O que a API devolve depois de um login bem-sucedido (inclui o token JWT).</summary>
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    /// <summary>Dados do usuário logado, devolvidos pela rota "/api/auth/me".</summary>
    public class MeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
