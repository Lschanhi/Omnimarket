using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Utils
{
    public static class VendaStatusHelper
    {
        public static StatusVenda ObterStatusOperacional(StatusVenda? statusVenda)
        {
            if (!statusVenda.HasValue)
                return StatusVenda.Criada;

            return statusVenda.Value switch
            {
                StatusVenda.Paga => StatusVenda.Pendente,
                _ => statusVenda.Value
            };
        }

        public static StatusVenda? ObterStatusParaExibicao(StatusVenda? statusVenda)
        {
            if (!statusVenda.HasValue || statusVenda == StatusVenda.Criada)
                return null;

            return ObterStatusOperacional(statusVenda.Value);
        }

        public static StatusVenda[] ObterStatusPersistidosParaFiltro(StatusVenda statusVenda)
        {
            return statusVenda switch
            {
                StatusVenda.Pendente => [StatusVenda.Paga, StatusVenda.Pendente],
                StatusVenda.Paga => [StatusVenda.Paga, StatusVenda.Pendente],
                _ => [statusVenda]
            };
        }
    }
}
