using System.ComponentModel.DataAnnotations;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Dtos.Produtos
{
    public class ProdutoAtualizarDto
    {
        [StringLength(100)]
        public string? Nome { get; set; }

        [StringLength(100)]
        public string? Categoria { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Preco deve ser maior que 0.")]
        public decimal? Preco { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantidade nao pode ser negativa.")]
        public int? Estoque { get; set; }

        public bool? Disponivel { get; set; }

        [StringLength(1000)]
        public string? Descricao { get; set; }

        public StatusProduto? StatusPublicacao { get; set; }

        public List<string>? Imagens { get; set; }
    }
}
