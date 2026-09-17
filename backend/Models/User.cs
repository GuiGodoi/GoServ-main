namespace Backend.Models
{
    /// <summary>Papéis (permissões) possíveis de um usuário do sistema.</summary>
    public static class UserRoles
    {
        /// <summary>Acesso total: cardápio, mesas, promoções, relatórios.</summary>
        public const string Admin = "Admin";
        /// <summary>Acesso restrito ao painel da cozinha (KDS), só vê e atualiza pedidos.</summary>
        public const string Kitchen = "Kitchen";
    }

    /// <summary>Um usuário que faz login no painel admin ou na cozinha.</summary>
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        /// <summary>Senha já criptografada (hash BCrypt) — nunca guardamos a senha em texto puro.</summary>
        public string PasswordHash { get; set; } = string.Empty;
        /// <summary>Um dos valores de <see cref="UserRoles"/>.</summary>
        public string Role { get; set; } = UserRoles.Admin;
        /// <summary>Se falso, o usuário não consegue mais fazer login (desativado em vez de excluído).</summary>
        public bool Active { get; set; } = true;
    }
}
