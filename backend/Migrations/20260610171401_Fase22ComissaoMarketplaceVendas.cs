using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase22ComissaoMarketplaceVendas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PercentualComissao",
                table: "TBL_PEDIDO",
                type: "decimal(5,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxaFixaComissao",
                table: "TBL_PEDIDO",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorComissao",
                table: "TBL_PEDIDO",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorLiquidoVendedor",
                table: "TBL_PEDIDO",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "TBL_CONFIGURACAO_MARKETPLACE",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaxaFixaComissao = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PercentualComissao = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TBL_CONFIGURACAO_MARKETPLACE", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_CONFIGURACAO_MARKETPLACE_Ativo",
                table: "TBL_CONFIGURACAO_MARKETPLACE",
                column: "Ativo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TBL_CONFIGURACAO_MARKETPLACE");

            migrationBuilder.DropColumn(
                name: "PercentualComissao",
                table: "TBL_PEDIDO");

            migrationBuilder.DropColumn(
                name: "TaxaFixaComissao",
                table: "TBL_PEDIDO");

            migrationBuilder.DropColumn(
                name: "ValorComissao",
                table: "TBL_PEDIDO");

            migrationBuilder.DropColumn(
                name: "ValorLiquidoVendedor",
                table: "TBL_PEDIDO");
        }
    }
}
