using Microsoft.EntityFrameworkCore;
using Omnimarket.Api.Data;
using Omnimarket.Api.Extensions;
using Omnimarket.Api.Models;
using Omnimarket.Api.Models.Dtos.Admin;
using Omnimarket.Api.Models.Entidades;
using Omnimarket.Api.Utils;

namespace Omnimarket.Api.Services
{
    public class AdminUsuarioService
    {
        private readonly DataContext _context;

        public AdminUsuarioService(DataContext context)
        {
            _context = context;
        }

        public async Task<PageResult<AdminUsuarioDto>> ListarUsuariosAsync(
            string? busca,
            string? role,
            int page,
            int pageSize)
        {
            var query = _context.TBL_USUARIO
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = $"%{busca.Trim()}%";
                query = query.Where(u =>
                    EF.Functions.Like(u.Nome, termo) ||
                    EF.Functions.Like(u.Sobrenome, termo) ||
                    EF.Functions.Like(u.Email, termo) ||
                    EF.Functions.Like(u.Cpf, termo));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                var roleNormalizada = RolesSistema.Normalizar(role);
                if (roleNormalizada == null)
                {
                    return await Enumerable.Empty<AdminUsuarioDto>()
                        .AsQueryable()
                        .ToPagedResultAsync(page, pageSize);
                }

                query = query.Where(u => u.Role == roleNormalizada);
            }

            return await query
                .OrderByDescending(u => u.DataCadastro)
                .Select(u => new AdminUsuarioDto
                {
                    Id = u.Id,
                    Nome = u.Nome + " " + u.Sobrenome,
                    Email = u.Email,
                    Cpf = u.Cpf,
                    Role = u.Role,
                    DataCadastro = u.DataCadastro,
                    DataAcesso = u.DataAcesso,
                    PossuiLoja = u.Loja != null,
                    LojaAtiva = u.Loja != null && u.Loja.Ativa,
                    TotalProdutos = u.Loja == null ? 0 : u.Loja.Produtos.Count,
                    TotalPedidos = u.Pedidos.Count
                })
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<AdminUsuarioDto?> AtualizarRoleUsuarioAsync(
            int usuarioId,
            AdminAtualizarRoleDto dto,
            int adminLogadoId)
        {
            var roleNormalizada = RolesSistema.Normalizar(dto.Role);
            if (roleNormalizada == null)
                throw new InvalidOperationException("Role invalida.");

            if (usuarioId == adminLogadoId && roleNormalizada != RolesSistema.Admin)
                throw new InvalidOperationException("Voce nao pode remover seu proprio acesso admin.");

            var usuario = await _context.TBL_USUARIO
                .Include(u => u.Loja)
                .ThenInclude(l => l!.Produtos)
                .Include(u => u.Pedidos)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario == null)
                return null;

            if (usuario.Role == RolesSistema.Admin && roleNormalizada != RolesSistema.Admin)
            {
                var totalAdmins = await _context.TBL_USUARIO.CountAsync(u => u.Role == RolesSistema.Admin);
                if (totalAdmins <= 1)
                    throw new InvalidOperationException("Mantenha pelo menos um administrador ativo.");
            }

            usuario.Role = roleNormalizada;
            await _context.SaveChangesAsync();

            return usuario.ToAdminDto();
        }

        public async Task<AdminUsuarioDto?> ExcluirUsuarioPorIdAsync(
            int usuarioId,
            int adminLogadoId)
        {
            var usuario = await CarregarUsuarioParaAdministracaoAsync(usuarioId);

            if (usuario == null)
                return null;

            return await ExcluirUsuarioAsync(usuario, adminLogadoId);
        }

        public async Task<AdminUsuarioDto?> ExcluirUsuarioPorEmailAsync(
            string email,
            int adminLogadoId)
        {
            var emailNormalizado = ValidadorEmail.Normalizar(email);

            if (!ValidadorEmail.TryValidarParaCadastro(emailNormalizado, out _))
                throw new InvalidOperationException("Informe um email valido.");

            var usuario = await _context.TBL_USUARIO
                .Where(u => u.Email == emailNormalizado)
                .Include(u => u.Loja)
                .ThenInclude(l => l!.Produtos)
                .Include(u => u.Pedidos)
                .FirstOrDefaultAsync();

            if (usuario == null)
                return null;

            return await ExcluirUsuarioAsync(usuario, adminLogadoId);
        }

        private async Task<Usuario?> CarregarUsuarioParaAdministracaoAsync(int usuarioId)
        {
            return await _context.TBL_USUARIO
                .Include(u => u.Loja)
                .ThenInclude(l => l!.Produtos)
                .Include(u => u.Pedidos)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);
        }

        private async Task<AdminUsuarioDto> ExcluirUsuarioAsync(
            Usuario usuario,
            int adminLogadoId)
        {
            if (usuario.Id == adminLogadoId)
                throw new InvalidOperationException("Voce nao pode excluir seu proprio usuario.");

            if (usuario.Role == RolesSistema.Admin)
            {
                var totalAdmins = await _context.TBL_USUARIO.CountAsync(u => u.Role == RolesSistema.Admin);
                if (totalAdmins <= 1)
                    throw new InvalidOperationException("Mantenha pelo menos um administrador ativo.");
            }

            if (usuario.Loja != null)
                throw new InvalidOperationException("Nao e possivel excluir usuarios com loja cadastrada.");

            if (usuario.Pedidos.Count > 0)
                throw new InvalidOperationException("Nao e possivel excluir usuarios com pedidos cadastrados.");

            var possuiAvaliacoes = await _context.TBL_AVALIACAO_PRODUTO
                .AnyAsync(a => a.UsuarioId == usuario.Id);

            if (possuiAvaliacoes)
                throw new InvalidOperationException("Nao e possivel excluir usuarios com avaliacoes publicadas.");

            var possuiVendas = await _context.TBL_VENDA
                .AnyAsync(v => v.VendedorId == usuario.Id);

            if (possuiVendas)
                throw new InvalidOperationException("Nao e possivel excluir usuarios vinculados a vendas.");

            var possuiSolicitacoes = await _context.TBL_SOLICITACAO_CANCELAMENTO
                .AnyAsync(s =>
                    s.SolicitanteId == usuario.Id ||
                    s.ResponsavelAnaliseId == usuario.Id);

            if (possuiSolicitacoes)
                throw new InvalidOperationException("Nao e possivel excluir usuarios com solicitacoes registradas.");

            var usuarioRemovido = usuario.ToAdminDto();

            _context.TBL_USUARIO.Remove(usuario);
            await _context.SaveChangesAsync();

            return usuarioRemovido;
        }
    }
}
