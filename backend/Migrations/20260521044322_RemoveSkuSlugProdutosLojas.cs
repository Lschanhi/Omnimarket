using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSkuSlugProdutosLojas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TBL_PRODUTOS_LojaId_Sku",
                table: "TBL_PRODUTOS");

            migrationBuilder.DropIndex(
                name: "IX_TBL_LOJA_Slug",
                table: "TBL_LOJA");

            migrationBuilder.DropColumn(
                name: "Sku",
                table: "TBL_PRODUTOS");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "TBL_LOJA");

            migrationBuilder.DropColumn(
                name: "SkuProdutoSnapshot",
                table: "TBL_HISTORICO_PRODUTO");

            migrationBuilder.CreateIndex(
                name: "IX_TBL_PRODUTOS_LojaId",
                table: "TBL_PRODUTOS",
                column: "LojaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TBL_PRODUTOS_LojaId",
                table: "TBL_PRODUTOS");

            migrationBuilder.AddColumn<string>(
                name: "Sku",
                table: "TBL_PRODUTOS",
                type: "varchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "TBL_LOJA",
                type: "varchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SkuProdutoSnapshot",
                table: "TBL_HISTORICO_PRODUTO",
                type: "varchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TBL_PRODUTOS_LojaId_Sku",
                table: "TBL_PRODUTOS",
                columns: new[] { "LojaId", "Sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TBL_LOJA_Slug",
                table: "TBL_LOJA",
                column: "Slug",
                unique: true);
        }
    }
}
