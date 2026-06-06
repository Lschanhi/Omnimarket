# Arquitetura

## Visao geral

O OmniMarket esta organizado como monorepo com duas aplicacoes principais:

- `backend/`: API principal, regras de negocio, autenticacao, persistencia, uploads e rotas administrativas.
- `frontend/`: interface web publica e autenticada, consumindo a API via HTTP.

## Backend

Principais areas:

- `Controllers/`: entrada HTTP por dominio.
- `Services/`: regras de negocio e orquestracao.
- `Data/`: `DataContext` e factory do EF Core.
- `Models/Entidades`: entidades de dominio.
- `Models/Dtos`: contratos de entrada/saida.
- `Migrations/`: historico de schema.
- `wwwroot/admin/`: interface administrativa estatica legada/auxiliar.

Dominios ja identificados:

- autenticacao e sessao
- usuarios, enderecos e telefones
- lojas e entregas
- produtos, midias e avaliacoes
- carrinho, pedidos e cancelamentos
- financeiro e recibos
- admin

## Frontend

Principais areas:

- `src/routes/`: rotas TanStack Router.
- `src/pages/`: paginas por fluxo.
- `src/Components/`: componentes reutilizaveis.
- `src/Services/`: camada de consumo HTTP por dominio.
- `src/store/` e `src/context/`: estado local.
- `src/hooks/`: composicao de regras de UI.

## Integracoes

- Frontend -> Backend via `VITE_API_BASE_URL`
- Backend -> SQL Server/Azure SQL via EF Core
- Backend -> Azure Blob Storage para fotos/videos
- Backend -> PDF via QuestPDF

## Pontos de atencao arquitetural

1. O admin esta parcialmente no backend (`wwwroot/admin`) e parcialmente na experiencia web moderna. Vale decidir se a estrategia final sera:
   - manter admin estatico separado
   - migrar admin integralmente para o frontend React
2. O frontend tem autenticacao armazenada em `localStorage`, mas a autorizacao de navegacao ainda nao esta centralizada no router.
3. O backend esta relativamente organizado por dominio, mas ainda mistura concerns de aplicacao em `Program.cs` e nao expoe health check.

