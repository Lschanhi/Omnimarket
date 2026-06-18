using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase23FkPedidoConfiguracaoMarketplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TBL_PEDIDO_ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO",
                column: "ConfiguracaoMarketplaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_PEDIDO_TBL_CONFIGURACAO_MARKETPLACE_ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO",
                column: "ConfiguracaoMarketplaceId",
                principalTable: "TBL_CONFIGURACAO_MARKETPLACE",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TBL_PEDIDO_TBL_CONFIGURACAO_MARKETPLACE_ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO");

            migrationBuilder.DropIndex(
                name: "IX_TBL_PEDIDO_ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO");

            migrationBuilder.DropColumn(
                name: "ConfiguracaoMarketplaceId",
                table: "TBL_PEDIDO");
        }
    }
}
