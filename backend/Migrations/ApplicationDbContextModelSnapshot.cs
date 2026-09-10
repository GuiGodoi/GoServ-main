using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using Backend.Data;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("Relational:MaxIdentifierLength", 63)
                .HasAnnotation("ProductVersion", "8.0.8")
                .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            modelBuilder.Entity("Backend.Models.Addon", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<bool>("Available").HasColumnType("boolean");
                b.Property<int>("MenuItemId").HasColumnType("integer");
                b.Property<string>("Name").IsRequired().HasMaxLength(120).HasColumnType("character varying(120)");
                b.Property<decimal>("Price").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.HasKey("Id");
                b.HasIndex("MenuItemId");
                b.ToTable("Addons");
            });

            modelBuilder.Entity("Backend.Models.Category", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<string>("Name").IsRequired().HasColumnType("text");
                b.Property<int>("SortOrder").HasColumnType("integer");
                b.HasKey("Id");
                b.ToTable("Categories");
            });

            modelBuilder.Entity("Backend.Models.DiningTable", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<bool>("Active").HasColumnType("boolean");
                b.Property<string>("Label").IsRequired().HasMaxLength(40).HasColumnType("character varying(40)");
                b.HasKey("Id");
                b.ToTable("DiningTables");
            });

            modelBuilder.Entity("Backend.Models.MenuItem", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<bool>("Available").HasColumnType("boolean");
                b.Property<int?>("CategoryId").HasColumnType("integer");
                b.Property<string>("Description").HasColumnType("text");
                b.Property<string>("Name").IsRequired().HasColumnType("text");
                b.Property<byte[]>("PhotoData").HasColumnType("bytea");
                b.Property<string>("PhotoContentType").HasMaxLength(80).HasColumnType("character varying(80)");
                b.Property<decimal>("Price").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.HasKey("Id");
                b.HasIndex("CategoryId");
                b.ToTable("MenuItems");
            });

            modelBuilder.Entity("Backend.Models.Order", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<string>("CustomerNotes").HasColumnType("text");
                b.Property<string>("Status").IsRequired().HasMaxLength(40).HasColumnType("character varying(40)");
                b.Property<string>("TableLabel").HasMaxLength(40).HasColumnType("character varying(40)");
                b.Property<int?>("TableSessionId").HasColumnType("integer");
                b.Property<decimal>("Total").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.Property<DateTime>("UpdatedAt").HasColumnType("timestamp with time zone");
                b.HasKey("Id");
                b.HasIndex("TableSessionId");
                b.ToTable("Orders");
            });

            modelBuilder.Entity("Backend.Models.OrderItem", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<decimal>("LineTotal").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.Property<int>("MenuItemId").HasColumnType("integer");
                b.Property<string>("MenuItemName").IsRequired().HasMaxLength(200).HasColumnType("character varying(200)");
                b.Property<string>("Notes").HasColumnType("text");
                b.Property<int>("OrderId").HasColumnType("integer");
                b.Property<int>("Quantity").HasColumnType("integer");
                b.Property<decimal>("UnitPrice").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.HasKey("Id");
                b.HasIndex("OrderId");
                b.ToTable("OrderItems");
            });

            modelBuilder.Entity("Backend.Models.OrderItemAddon", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<int>("AddonId").HasColumnType("integer");
                b.Property<string>("Name").IsRequired().HasMaxLength(120).HasColumnType("character varying(120)");
                b.Property<int>("OrderItemId").HasColumnType("integer");
                b.Property<decimal>("Price").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.HasKey("Id");
                b.HasIndex("OrderItemId");
                b.ToTable("OrderItemAddons");
            });

            modelBuilder.Entity("Backend.Models.TableSession", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<string>("AccessToken").IsRequired().HasMaxLength(80).HasColumnType("character varying(80)");
                b.Property<DateTime?>("ClosedAt").HasColumnType("timestamp with time zone");
                b.Property<int>("DiningTableId").HasColumnType("integer");
                b.Property<DateTime>("ExpiresAt").HasColumnType("timestamp with time zone");
                b.Property<string>("GuestName").HasMaxLength(80).HasColumnType("character varying(80)");
                b.Property<DateTime>("OpenedAt").HasColumnType("timestamp with time zone");
                b.Property<decimal?>("SpendingCap").HasPrecision(10, 2).HasColumnType("numeric(10,2)");
                b.HasKey("Id");
                b.HasIndex("AccessToken").IsUnique();
                b.HasIndex("DiningTableId");
                b.ToTable("TableSessions");
            });

            modelBuilder.Entity("Backend.Models.DayPasscode", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<string>("Code").IsRequired().HasMaxLength(20).HasColumnType("character varying(20)");
                b.Property<DateTime>("CreatedAt").HasColumnType("timestamp with time zone");
                b.Property<DateOnly>("Day").HasColumnType("date");
                b.Property<DateTime?>("RotatedAt").HasColumnType("timestamp with time zone");
                b.HasKey("Id");
                b.HasIndex("Day").IsUnique();
                b.ToTable("DayPasscodes");
            });

            modelBuilder.Entity("Backend.Models.User", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("integer")
                    .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
                b.Property<bool>("Active").HasColumnType("boolean");
                b.Property<string>("Email").IsRequired().HasMaxLength(200).HasColumnType("character varying(200)");
                b.Property<string>("Name").IsRequired().HasColumnType("text");
                b.Property<string>("PasswordHash").IsRequired().HasColumnType("text");
                b.Property<string>("Role").IsRequired().HasMaxLength(40).HasColumnType("character varying(40)");
                b.HasKey("Id");
                b.HasIndex("Email").IsUnique();
                b.ToTable("Users");
            });

            modelBuilder.Entity("Backend.Models.Addon", b =>
            {
                b.HasOne("Backend.Models.MenuItem", "MenuItem")
                    .WithMany()
                    .HasForeignKey("MenuItemId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
                b.Navigation("MenuItem");
            });

            modelBuilder.Entity("Backend.Models.MenuItem", b =>
            {
                b.HasOne("Backend.Models.Category", "Category")
                    .WithMany("MenuItems")
                    .HasForeignKey("CategoryId")
                    .OnDelete(DeleteBehavior.SetNull);
                b.Navigation("Category");
            });

            modelBuilder.Entity("Backend.Models.Order", b =>
            {
                b.HasOne("Backend.Models.TableSession", "TableSession")
                    .WithMany()
                    .HasForeignKey("TableSessionId")
                    .OnDelete(DeleteBehavior.SetNull);
                b.Navigation("TableSession");
            });

            modelBuilder.Entity("Backend.Models.OrderItem", b =>
            {
                b.HasOne("Backend.Models.Order", "Order")
                    .WithMany("Items")
                    .HasForeignKey("OrderId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
                b.Navigation("Order");
            });

            modelBuilder.Entity("Backend.Models.OrderItemAddon", b =>
            {
                b.HasOne("Backend.Models.OrderItem", "OrderItem")
                    .WithMany("Addons")
                    .HasForeignKey("OrderItemId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
                b.Navigation("OrderItem");
            });

            modelBuilder.Entity("Backend.Models.TableSession", b =>
            {
                b.HasOne("Backend.Models.DiningTable", "DiningTable")
                    .WithMany("Sessions")
                    .HasForeignKey("DiningTableId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
                b.Navigation("DiningTable");
            });

            modelBuilder.Entity("Backend.Models.Category", b => b.Navigation("MenuItems"));
            modelBuilder.Entity("Backend.Models.DiningTable", b => b.Navigation("Sessions"));
            modelBuilder.Entity("Backend.Models.Order", b => b.Navigation("Items"));
            modelBuilder.Entity("Backend.Models.OrderItem", b => b.Navigation("Addons"));
        }
    }
}
