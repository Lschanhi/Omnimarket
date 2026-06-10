using System.ComponentModel.DataAnnotations;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Dtos.Pedidos
{
    public class SolicitacaoCancelamentoCriacaoDto
    {
        public int? VendaId { get; set; }

        public TipoSolicitacaoPedido? TipoSolicitacao { get; set; }

        [Required]
        public MotivoSolicitacaoCancelamento Motivo { get; set; }

        [StringLength(500)]
        public string? Observacao { get; set; }
    }

    public class SolicitacaoCancelamentoAtualizacaoDto
    {
        [Required]
        public StatusSolicitacaoCancelamento Status { get; set; }

        [StringLength(500)]
        public string? ObservacaoAnalise { get; set; }
    }

    public class SolicitacaoCancelamentoLeituraDto
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int VendaId { get; set; }
        public int ClienteId { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public string EmailCliente { get; set; } = string.Empty;
        public int VendedorId { get; set; }
        public int LojaId { get; set; }
        public string NomeLoja { get; set; } = string.Empty;
        public StatusPedido StatusPedidoAtual { get; set; }
        public StatusVenda StatusVendaAtual { get; set; }
        public StatusPedido StatusPedidoOrigem { get; set; }
        public StatusVenda StatusVendaOrigem { get; set; }
        public TipoSolicitacaoPedido TipoSolicitacao { get; set; }
        public MotivoSolicitacaoCancelamento Motivo { get; set; }
        public StatusSolicitacaoCancelamento Status { get; set; }
        public string Observacao { get; set; } = string.Empty;
        public string? ObservacaoAnalise { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? DataAnalise { get; set; }
        public DateTime? DataConclusao { get; set; }
        public bool PodeCancelarPeloSolicitante { get; set; }
        public bool PodeColocarEmAnalise { get; set; }
        public bool PodeAprovar { get; set; }
        public bool PodeRecusar { get; set; }
        public bool PodeConcluir { get; set; }
    }
}
