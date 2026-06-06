using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Entidades
{
    public class SolicitacaoCancelamento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PedidoId { get; set; }

        [ForeignKey(nameof(PedidoId))]
        public Pedido Pedido { get; set; } = null!;

        [Required]
        public int VendaId { get; set; }

        [ForeignKey(nameof(VendaId))]
        public Venda Venda { get; set; } = null!;

        [Required]
        public int SolicitanteId { get; set; }

        [ForeignKey(nameof(SolicitanteId))]
        public Usuario Solicitante { get; set; } = null!;

        public int? ResponsavelAnaliseId { get; set; }

        [ForeignKey(nameof(ResponsavelAnaliseId))]
        public Usuario? ResponsavelAnalise { get; set; }

        [Required]
        public MotivoSolicitacaoCancelamento Motivo { get; set; }

        [Required]
        public StatusSolicitacaoCancelamento Status { get; set; } = StatusSolicitacaoCancelamento.Aberta;

        [Required]
        public StatusPedido StatusPedidoOrigem { get; set; }

        [Required]
        public StatusVenda StatusVendaOrigem { get; set; }

        [StringLength(500)]
        public string Observacao { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ObservacaoAnalise { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime? DataAtualizacao { get; set; }

        public DateTime? DataAnalise { get; set; }

        public DateTime? DataConclusao { get; set; }
    }
}
