using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase25RecuperacaoSenhaEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ResetSenhaSolicitadoEm",
                table: "TBL_USUARIO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResetSenhaTokenExpiraEm",
                table: "TBL_USUARIO",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResetSenhaTokenHash",
                table: "TBL_USUARIO",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResetSenhaSolicitadoEm",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "ResetSenhaTokenExpiraEm",
                table: "TBL_USUARIO");

            migrationBuilder.DropColumn(
                name: "ResetSenhaTokenHash",
                table: "TBL_USUARIO");
        }
    }
}
