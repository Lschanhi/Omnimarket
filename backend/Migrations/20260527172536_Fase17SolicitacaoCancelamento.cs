using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase17SolicitacaoCancelamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TBL_SOLICITACAO_CANCELAMENTO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    VendaId = table.Column<int>(type: "int", nullable: false),
                    SolicitanteId = table.Column<int>(type: "int", nullable: false),
                    ResponsavelAnaliseId = table.Column<int>(type: "int", nullable: true),
                    Motivo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StatusPedidoOrigem = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StatusVendaOrigem = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Observacao = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    ObservacaoAnalise = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataAnalise = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataConclusao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TBL_SOLICITACAO_CANCELAMENTO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_PEDIDO_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "TBL_PEDIDO",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_ResponsavelAnaliseId",
                        column: x => x.ResponsavelAnaliseId,
                        principalTable: "TBL_USUARIO",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_SolicitanteId",
                        column: x => x.SolicitanteId,
                        principalTable: "TBL_USUARIO",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_VENDA_VendaId",
                        column: x => x.VendaId,
                        principalTable: "TBL_VENDA",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_PedidoId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "ResponsavelAnaliseId");

            migrationBuilder.CreateIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_SolicitanteId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "SolicitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_Status_DataCriacao",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                columns: new[] { "Status", "DataCriacao" });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_VendaId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "VendaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TBL_SOLICITACAO_CANCELAMENTO");
        }
    }
}
