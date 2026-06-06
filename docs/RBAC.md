# RBAC

## Roles implementadas hoje

Arquivo de referencia: `backend/Utils/RolesSistema.cs`

- `User`
- `Vendedor`
- `Admin`
- `Suporte`

## O que ja esta protegido

- Rotas administrativas do controller `api/admin` exigem role `Admin`.
- Diversas rotas de usuario, pedido, carrinho, financeiro, upload, loja e produto exigem autenticacao.

## Gaps atuais

1. O frontend ainda nao centraliza guardas de rota por perfil.
2. As roles sugeridas no briefing incluem `editor/moderador` e `readonly`, mas essas roles nao estao implementadas hoje.
3. Existe role `Suporte`, mas a documentacao funcional ainda nao define claramente seus limites.

## Recomendacao de evolucao

1. Documentar matriz de permissao por modulo.
2. Criar guardas de rota no frontend por autenticacao e role.
3. Separar claramente:
   - autenticacao: estar logado
   - autorizacao: o que cada role pode fazer
4. Avaliar convergencia futura entre:
   - `Admin`
   - `Suporte`
   - `Vendedor`
   - roles sugeridas de moderacao/leitura

