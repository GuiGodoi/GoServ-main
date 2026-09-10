namespace Backend.Models
{
    public static class UserRoles
    {
        public const string Admin = "Admin";
        public const string Kitchen = "Kitchen";
    }

    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = UserRoles.Admin;
        public bool Active { get; set; } = true;
    }
}
