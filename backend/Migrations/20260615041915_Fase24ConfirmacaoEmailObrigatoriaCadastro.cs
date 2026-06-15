using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase24ConfirmacaoEmailObrigatoriaCadastro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataConfirmacaoEmail",
                table: "TBL_USUARIO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailConfirmacaoEnviadoEm",
                table: "TBL_USUARIO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailConfirmacaoTokenExpiraEm",
                table: "TBL_USUARIO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailConfirmacaoTokenHash",
                table: "TBL_USUARIO",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmado",
                table: "TBL_USUARIO",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataConfirmacaoEmail",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "EmailConfirmacaoEnviadoEm",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "EmailConfirmacaoTokenExpiraEm",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "EmailConfirmacaoTokenHash",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "EmailConfirmado",
                table: "TBL_USUARIO");
        }
    }
}
