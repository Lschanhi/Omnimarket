using System.ComponentModel.DataAnnotations;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Dtos.Produtos.Lojas
{
    public class LojaPedidoLeituraDto
    {
        public int PedidoId { get; set; }
        public int? VendaId { get; set; }
        public int LojaId { get; set; }
        public string NomeLoja { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public string EmailCliente { get; set; } = string.Empty;
        public StatusPedido StatusPedido { get; set; }
        public StatusVenda? StatusVenda { get; set; }
        public string TipoEntrega { get; set; } = string.Empty;
        public decimal ValorTotalPedido { get; set; }
        public decimal ValorTotalLoja { get; set; }
        public int QuantidadeItens { get; set; }
        public DateTime DataPedido { get; set; }
        public string Observacao { get; set; } = string.Empty;
        public string TipoLogradouroEntrega { get; set; } = string.Empty;
        public string NomeEnderecoEntrega { get; set; } = string.Empty;
        public string NumeroEntrega { get; set; } = string.Empty;
        public string? ComplementoEntrega { get; set; }
        public string CepEntrega { get; set; } = string.Empty;
        public string CidadeEntrega { get; set; } = string.Empty;
        public string UfEntrega { get; set; } = string.Empty;
        public bool PedidoMultiloja { get; set; }
        public bool AguardandoConfirmacaoRecebimento { get; set; }
        public bool PossuiSolicitacaoCancelamentoAtiva { get; set; }
        public bool PodeCancelar { get; set; }
        public bool PodeAceitar { get; set; }
        public bool PodeMarcarComoPronto { get; set; }
        public bool PodeMarcarComoEnviado { get; set; }
        public List<LojaPedidoItemLeituraDto> Itens { get; set; } = new();
    }

    public class LojaPedidoItemLeituraDto
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public string NomeProduto { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
        public decimal ValorTotal { get; set; }
    }

    public class LojaAtualizarStatusPedidoDto
    {
        [Required]
        public StatusVenda StatusVenda { get; set; }
    }
}
