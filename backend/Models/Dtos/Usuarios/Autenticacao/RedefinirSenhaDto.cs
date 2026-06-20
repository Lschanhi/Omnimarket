using System.ComponentModel.DataAnnotations;

namespace Omnimarket.Api.Models.Dtos.Usuarios.Autenticacao
{
    public class RedefinirSenhaDto
    {
        [Required(ErrorMessage = "Token e obrigatorio")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha e obrigatoria")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Senha deve ter no minimo 6 caracteres")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirmacao de senha e obrigatoria")]
        [Compare("Password", ErrorMessage = "As senhas nao coincidem")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
