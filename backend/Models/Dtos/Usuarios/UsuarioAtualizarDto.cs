using System.ComponentModel.DataAnnotations;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Models.Dtos.Usuarios
{
    // DTO usado quando o cliente deseja atualizar dados basicos do usuario.
    public class UsuarioAtualizarDto
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Sobrenome { get; set; } = string.Empty;

        [Required]
        [EmailCadastro]
        public string Email { get; set; } = string.Empty;

        // Opcional: so troca a senha se o cliente enviar um novo valor.
        public string? Password { get; set; }
    }
}
