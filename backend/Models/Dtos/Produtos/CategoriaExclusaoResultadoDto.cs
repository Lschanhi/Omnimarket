namespace Omnimarket.Api.Models.Dtos.Produtos
{
    public class CategoriaExclusaoResultadoDto
    {
        public string Categoria { get; set; } = string.Empty;
        public int TotalProdutosEncontrados { get; set; }
        public int TotalProdutosDesativados { get; set; }
        public bool RequerConfirmacao { get; set; }
        public string Mensagem { get; set; } = string.Empty;
    }
}
