using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Backend.Data;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260829_StorePhotosInDatabase")]
    public partial class StorePhotosInDatabase : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "MenuItems");

            migrationBuilder.AddColumn<byte[]>(
                name: "PhotoData",
                table: "MenuItems",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoContentType",
                table: "MenuItems",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "PhotoData", table: "MenuItems");
            migrationBuilder.DropColumn(name: "PhotoContentType", table: "MenuItems");

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "MenuItems",
                type: "text",
                nullable: true);
        }
    }
}
