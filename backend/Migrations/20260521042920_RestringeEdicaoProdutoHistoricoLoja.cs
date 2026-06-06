using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class RestringeEdicaoProdutoHistoricoLoja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TBL_HISTORICO_PRODUTO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    LojaId = table.Column<int>(type: "int", nullable: false),
                    UsuarioResponsavelId = table.Column<int>(type: "int", nullable: false),
                    TipoAlteracao = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                    NomeProdutoSnapshot = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    CategoriaProdutoSnapshot = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    SkuProdutoSnapshot = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                    PrecoAnterior = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PrecoNovo = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    EstoqueAnterior = table.Column<int>(type: "int", nullable: true),
                    EstoqueNovo = table.Column<int>(type: "int", nullable: true),
                    DescricaoAnterior = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true),
                    DescricaoNova = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true),
                    DataAlteracao = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TBL_HISTORICO_PRODUTO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TBL_HISTORICO_PRODUTO_TBL_PRODUTOS_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "TBL_PRODUTOS",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_HISTORICO_PRODUTO_LojaId_DataAlteracao",
                table: "TBL_HISTORICO_PRODUTO",
                columns: new[] { "LojaId", "DataAlteracao" });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_HISTORICO_PRODUTO_ProdutoId_DataAlteracao",
                table: "TBL_HISTORICO_PRODUTO",
                columns: new[] { "ProdutoId", "DataAlteracao" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TBL_HISTORICO_PRODUTO");
        }
    }
}
