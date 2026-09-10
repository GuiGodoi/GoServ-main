using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    /// <summary>
    /// Seed mínimo: apenas usuários de acesso. Cardápio e mesas começam vazios.
    /// </summary>
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext db)
        {
            await SeedUsersAsync(db);
        }

        private static async Task SeedUsersAsync(ApplicationDbContext db)
        {
            if (await db.Users.AnyAsync())
                return;

            db.Users.AddRange(
                new User
                {
                    Name = "Admin GoServ",
                    Email = "admin@goserv.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = UserRoles.Admin,
                    Active = true
                },
                new User
                {
                    Name = "Cozinha",
                    Email = "cozinha@goserv.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("cozinha123"),
                    Role = UserRoles.Kitchen,
                    Active = true
                }
            );

            await db.SaveChangesAsync();
        }
    }
}
