using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase21SolicitacoesPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_PEDIDO_PedidoId",
                table: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_SolicitanteId",
                table: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_VENDA_VendaId",
                table: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TBL_SOLICITACAO_CANCELAMENTO",
                table: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.RenameTable(
                name: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_VendaId",
                table: "TBL_SOLICITACAO_PEDIDO",
                newName: "IX_TBL_SOLICITACAO_PEDIDO_VendaId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_Status_DataCriacao",
                table: "TBL_SOLICITACAO_PEDIDO",
                newName: "IX_TBL_SOLICITACAO_PEDIDO_Status_DataCriacao");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_SolicitanteId",
                table: "TBL_SOLICITACAO_PEDIDO",
                newName: "IX_TBL_SOLICITACAO_PEDIDO_SolicitanteId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_PEDIDO",
                newName: "IX_TBL_SOLICITACAO_PEDIDO_ResponsavelAnaliseId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_CANCELAMENTO_PedidoId",
                table: "TBL_SOLICITACAO_PEDIDO",
                newName: "IX_TBL_SOLICITACAO_PEDIDO_PedidoId");

            migrationBuilder.AddColumn<string>(
                name: "TipoSolicitacao",
                table: "TBL_SOLICITACAO_PEDIDO",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Cancelamento");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TBL_SOLICITACAO_PEDIDO",
                table: "TBL_SOLICITACAO_PEDIDO",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_PEDIDO_PedidoId",
                table: "TBL_SOLICITACAO_PEDIDO",
                column: "PedidoId",
                principalTable: "TBL_PEDIDO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_USUARIO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_PEDIDO",
                column: "ResponsavelAnaliseId",
                principalTable: "TBL_USUARIO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_USUARIO_SolicitanteId",
                table: "TBL_SOLICITACAO_PEDIDO",
                column: "SolicitanteId",
                principalTable: "TBL_USUARIO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_VENDA_VendaId",
                table: "TBL_SOLICITACAO_PEDIDO",
                column: "VendaId",
                principalTable: "TBL_VENDA",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_PEDIDO_PedidoId",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_USUARIO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_USUARIO_SolicitanteId",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.DropForeignKey(
                name: "FK_TBL_SOLICITACAO_PEDIDO_TBL_VENDA_VendaId",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TBL_SOLICITACAO_PEDIDO",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.DropColumn(
                name: "TipoSolicitacao",
                table: "TBL_SOLICITACAO_PEDIDO");

            migrationBuilder.RenameTable(
                name: "TBL_SOLICITACAO_PEDIDO",
                newName: "TBL_SOLICITACAO_CANCELAMENTO");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_PEDIDO_VendaId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "IX_TBL_SOLICITACAO_CANCELAMENTO_VendaId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_PEDIDO_Status_DataCriacao",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "IX_TBL_SOLICITACAO_CANCELAMENTO_Status_DataCriacao");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_PEDIDO_SolicitanteId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "IX_TBL_SOLICITACAO_CANCELAMENTO_SolicitanteId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_PEDIDO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "IX_TBL_SOLICITACAO_CANCELAMENTO_ResponsavelAnaliseId");

            migrationBuilder.RenameIndex(
                name: "IX_TBL_SOLICITACAO_PEDIDO_PedidoId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                newName: "IX_TBL_SOLICITACAO_CANCELAMENTO_PedidoId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TBL_SOLICITACAO_CANCELAMENTO",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_PEDIDO_PedidoId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "PedidoId",
                principalTable: "TBL_PEDIDO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_ResponsavelAnaliseId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "ResponsavelAnaliseId",
                principalTable: "TBL_USUARIO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_USUARIO_SolicitanteId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "SolicitanteId",
                principalTable: "TBL_USUARIO",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TBL_SOLICITACAO_CANCELAMENTO_TBL_VENDA_VendaId",
                table: "TBL_SOLICITACAO_CANCELAMENTO",
                column: "VendaId",
                principalTable: "TBL_VENDA",
                principalColumn: "Id");
        }
    }
}
