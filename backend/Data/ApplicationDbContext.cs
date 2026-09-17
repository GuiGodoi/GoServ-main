using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    /// <summary>
    /// Ponte entre o C# e o banco PostgreSQL (Entity Framework Core). Cada
    /// DbSet abaixo vira uma tabela, e OnModelCreating define detalhes como
    /// tamanho de colunas, índices únicos e o que fazer com registros
    /// relacionados quando algo é excluído (cascade, etc).
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<MenuItem> MenuItems { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<DiningTable> DiningTables { get; set; } = null!;
        public DbSet<TableSession> TableSessions { get; set; } = null!;
        public DbSet<Addon> Addons { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<OrderItemAddon> OrderItemAddons { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<DayPasscode> DayPasscodes { get; set; } = null!;
        public DbSet<Promotion> Promotions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MenuItem>(entity =>
            {
                entity.Property(m => m.Price).HasPrecision(10, 2);
                entity.Property(m => m.PhotoContentType).HasMaxLength(80);
                entity.HasOne(m => m.Category)
                    .WithMany(c => c.MenuItems)
                    .HasForeignKey(m => m.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Promotion>(entity =>
            {
                entity.Property(p => p.PromoPrice).HasPrecision(10, 2);
                // Se o produto for excluído, suas promoções somem junto (não faz
                // sentido ter uma promoção "órfã" de um produto que não existe mais).
                entity.HasOne(p => p.MenuItem)
                    .WithMany()
                    .HasForeignKey(p => p.MenuItemId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(p => p.MenuItemId);
                entity.HasIndex(p => p.EndsAt);
            });

            modelBuilder.Entity<User>(entity =>
            {
                // E-mail único: impede cadastrar dois usuários com o mesmo login.
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).HasMaxLength(200);
                entity.Property(u => u.Role).HasMaxLength(40);
            });

            modelBuilder.Entity<DiningTable>(entity =>
            {
                entity.Property(t => t.Label).HasMaxLength(40);
            });

            modelBuilder.Entity<TableSession>(entity =>
            {
                // Token único: garante que nunca existem duas sessões com o mesmo
                // AccessToken (o que quebraria a identificação da mesa pelo token).
                entity.HasIndex(s => s.AccessToken).IsUnique();
                entity.Property(s => s.AccessToken).HasMaxLength(80);
                entity.Property(s => s.GuestName).HasMaxLength(80);
                entity.Property(s => s.SpendingCap).HasPrecision(10, 2);
                entity.HasOne(s => s.DiningTable)
                    .WithMany(t => t.Sessions)
                    .HasForeignKey(s => s.DiningTableId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DayPasscode>(entity =>
            {
                // Só pode existir uma senha por dia.
                entity.HasIndex(d => d.Day).IsUnique();
                entity.Property(d => d.Code).HasMaxLength(20);
            });

            modelBuilder.Entity<Addon>(entity =>
            {
                entity.Property(a => a.Name).HasMaxLength(120);
                entity.Property(a => a.Price).HasPrecision(10, 2);
                entity.HasOne(a => a.MenuItem)
                    .WithMany()
                    .HasForeignKey(a => a.MenuItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(o => o.Status).HasMaxLength(40);
                entity.Property(o => o.TableLabel).HasMaxLength(40);
                entity.Property(o => o.Total).HasPrecision(10, 2);
                // PublicId único: é o identificador exposto ao cliente para acompanhar o pedido.
                entity.HasIndex(o => o.PublicId).IsUnique();
                entity.HasOne(o => o.TableSession)
                    .WithMany()
                    .HasForeignKey(o => o.TableSessionId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.Property(i => i.MenuItemName).HasMaxLength(200);
                entity.Property(i => i.UnitPrice).HasPrecision(10, 2);
                entity.Property(i => i.LineTotal).HasPrecision(10, 2);
                // Excluir um pedido também exclui seus itens (não faz sentido item órfão).
                entity.HasOne(i => i.Order)
                    .WithMany(o => o.Items)
                    .HasForeignKey(i => i.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OrderItemAddon>(entity =>
            {
                entity.Property(a => a.Name).HasMaxLength(120);
                entity.Property(a => a.Price).HasPrecision(10, 2);
                entity.HasOne(a => a.OrderItem)
                    .WithMany(i => i.Addons)
                    .HasForeignKey(a => a.OrderItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.Property(a => a.EntityType).HasMaxLength(80);
                entity.Property(a => a.EntityId).HasMaxLength(80);
                entity.Property(a => a.Action).HasMaxLength(80);
                entity.Property(a => a.ActorName).HasMaxLength(200);
                entity.Property(a => a.IpAddress).HasMaxLength(64);
                entity.HasIndex(a => a.CreatedAt);
            });
        }
    }
}
