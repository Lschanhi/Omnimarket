using Omnimarket.Api.Models.Enum;

namespace Omnimarket.Api.Models.Dtos.Uploads
{
    public class ProdutoMidiaUploadLeituraDto : ArquivoUploadLeituraDto
    {
        public TipoMidiaProduto Tipo { get; set; }
    }
}
