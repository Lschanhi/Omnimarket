using System.ComponentModel.DataAnnotations;

namespace Omnimarket.Api.Models.Dtos.Usuarios.Autenticacao
{
    public class SolicitarRedefinicaoSenhaDto
    {
        [Required(ErrorMessage = "Email e obrigatorio")]
        [EmailAddress(ErrorMessage = "Informe um email valido")]
        public string Email { get; set; } = string.Empty;
    }
}
