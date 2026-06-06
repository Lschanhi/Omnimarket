using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class SuporteFotoPerfilUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TBL_USUARIO_FOTO_PERFIL",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MimeType = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    NomeArquivo = table.Column<string>(type: "varchar(260)", maxLength: 260, nullable: false),
                    Conteudo = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    DtCriacao = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DtAtualizacao = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TBL_USUARIO_FOTO_PERFIL", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TBL_USUARIO_FOTO_PERFIL_TBL_USUARIO_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "TBL_USUARIO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TBL_USUARIO_FOTO_PERFIL_UsuarioId",
                table: "TBL_USUARIO_FOTO_PERFIL",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO [TBL_USUARIO_FOTO_PERFIL] ([UsuarioId], [MimeType], [NomeArquivo], [Conteudo], [DtCriacao], [DtAtualizacao])
                SELECT [Id], 'image/png', CONCAT('foto-perfil-', [Id], '.png'), [Foto], SYSDATETIMEOFFSET(), NULL
                FROM [TBL_USUARIO]
                WHERE [Foto] IS NOT NULL AND DATALENGTH([Foto]) > 0;
                """);

            migrationBuilder.DropColumn(
                name: "Foto",
                table: "TBL_USUARIO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "Foto",
                table: "TBL_USUARIO",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE [usuario]
                SET [Foto] = [foto].[Conteudo]
                FROM [TBL_USUARIO] AS [usuario]
                INNER JOIN [TBL_USUARIO_FOTO_PERFIL] AS [foto]
                    ON [usuario].[Id] = [foto].[UsuarioId];
                """);

            migrationBuilder.DropTable(
                name: "TBL_USUARIO_FOTO_PERFIL");
        }
    }
}
