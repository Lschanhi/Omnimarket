using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OmniMarket.API.Migrations
{
    /// <inheritdoc />
    public partial class Fase20RankingHome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalVisualizacoes",
                table: "TBL_PRODUTOS",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UltimaVisualizacaoEm",
                table: "TBL_PRODUTOS",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalVisualizacoes",
                table: "TBL_LOJA",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UltimaVisualizacaoEm",
                table: "TBL_LOJA",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalVisualizacoes",
                table: "TBL_PRODUTOS");

            migrationBuilder.DropColumn(
                name: "UltimaVisualizacaoEm",
                table: "TBL_PRODUTOS");

            migrationBuilder.DropColumn(
                name: "TotalVisualizacoes",
                table: "TBL_LOJA");

            migrationBuilder.DropColumn(
                name: "UltimaVisualizacaoEm",
                table: "TBL_LOJA");
        }
    }
}
