# QA Checklist

## Setup

- [ ] `backend/appsettings.Local.json` criado a partir do exemplo
- [ ] `frontend/.env.local` criado a partir do exemplo
- [ ] Connection string local valida
- [ ] JWT configurado com chave forte

## Backend

- [ ] `dotnet restore backend/Omnimarket.Api.sln`
- [ ] `dotnet build backend/Omnimarket.Api.sln -v minimal`
- [ ] `dotnet test backend/Omnimarket.Api.sln -v minimal`
- [ ] Swagger abre sem erro
- [ ] CORS permite o frontend local

## Frontend

- [ ] `npm --prefix frontend install`
- [ ] `npm --prefix frontend run build`
- [ ] `npm --prefix frontend run lint`
- [ ] Aplicacao abre localmente
- [ ] Erro de API fica claro quando `VITE_API_BASE_URL` esta incorreta

## Fluxos manuais prioritarios

- [ ] Login com credenciais validas
- [ ] Falha de login com credenciais invalidas
- [ ] Cadastro de usuario
- [ ] Visualizacao de home e catalogo
- [ ] Visualizacao de detalhe de produto
- [ ] Carrinho: adicionar, alterar quantidade e remover item
- [ ] Pedido: criar pedido com dados validos
- [ ] Pagamento fake: iniciar e confirmar
- [ ] Perfil do usuario: carregar e atualizar dados
- [ ] Loja: criar/editar dados do vendedor
- [ ] Produto: criar/editar item autenticado
- [ ] Admin: acessar dashboard com `Admin`
- [ ] Admin: garantir bloqueio para usuario sem role `Admin`

## Riscos a observar em regressao

- [ ] URLs antigas entre frontend e backend
- [ ] Uploads e leitura de imagens
- [ ] Sessao expirada e logout
- [ ] Migracoes e seed em ambiente novo
- [ ] Compatibilidade entre HTTP local e configuracao CORS

