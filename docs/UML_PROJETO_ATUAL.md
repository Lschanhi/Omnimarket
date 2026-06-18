# UML do projeto atual

Fontes consideradas:
- `README.md`
- `docs/ARQUITETURA.md`
- `docs/RBAC.md`
- `backend/Program.cs`
- `backend/Controllers/`
- `backend/Services/`
- `frontend/src/routes/`
- `docs/DER_BANCO_ATUAL.md`

Data de referencia do levantamento: `2026-06-14`

Complemento importante:
- para um diagrama de classes mais completo e dedicado ao TCC, veja `docs/DIAGRAMA_CLASSES_OPEN_MINIMARKET.md`

## Leitura adotada

Para "UML do projeto", assumi uma visao arquitetural e funcional do sistema inteiro, e nao um desenho exaustivo de cada classe do repositorio. Por isso, a documentacao foi separada em quatro visoes:

- casos de uso do sistema
- componentes e integracoes
- pacotes/modulos do projeto
- classes centrais do dominio

## 1. Casos de uso do sistema

Observacao:
- O papel `Suporte` existe no codigo (`RolesSistema`), mas a documentacao atual ainda nao define com clareza seus limites. Por isso ele nao entrou como ator principal neste diagrama.

```mermaid
flowchart LR
    visitante[Visitante]
    comprador[Comprador / User]
    vendedor[Vendedor]
    admin[Admin]

    uc1([Cadastrar conta])
    uc2([Realizar login])
    uc3([Navegar por lojas e produtos])
    uc4([Ver detalhes de produto e loja])
    uc5([Gerenciar perfil, enderecos e telefones])
    uc6([Gerenciar carrinho])
    uc7([Realizar pedido e pagamento])
    uc8([Acompanhar pedido e solicitar cancelamento])
    uc9([Avaliar produto e loja])
    uc10([Gerenciar loja])
    uc11([Gerenciar produtos e midias])
    uc12([Configurar opcoes de entrega])
    uc13([Acompanhar vendas e financeiro])
    uc14([Acessar painel administrativo])
    uc15([Administrar usuarios, lojas, produtos, pedidos e vendas])
    uc16([Configurar comissao do marketplace])

    visitante --> uc1
    visitante --> uc2
    visitante --> uc3
    visitante --> uc4

    comprador --> uc3
    comprador --> uc4
    comprador --> uc5
    comprador --> uc6
    comprador --> uc7
    comprador --> uc8
    comprador --> uc9

    vendedor --> uc10
    vendedor --> uc11
    vendedor --> uc12
    vendedor --> uc13

    admin --> uc14
    admin --> uc15
    admin --> uc16
```

## 2. Componentes e integracoes

```mermaid
flowchart LR
    subgraph Frontend["Frontend Web (React 19 + Vite + TypeScript)"]
        Router["TanStack Router"]
        Pages["Pages + Components"]
        State["Hooks + Zustand + Context"]
        Client["Services HTTP + apiClient"]
    end

    subgraph Backend["Backend API (ASP.NET Core 9)"]
        Controllers["Controllers REST"]
        Auth["AuthService + TokenService + JWT"]
        Domain["Services de negocio"]
        Uploads["ArquivoUploadService + AzureBlobStorageService"]
        Pdf["ReciboPedidoService + QuestPDF"]
        AdminStatic["wwwroot/admin"]
        Data["DataContext + EF Core"]
    end

    subgraph Infra["Infra e servicos externos"]
        Db[("SQL Server / Azure SQL")]
        Blob[("Azure Blob Storage")]
        Gateway["GatewayPagamentoFakeService"]
    end

    Router --> Pages
    Pages --> State
    Pages --> Client
    Client --> Controllers

    Controllers --> Auth
    Controllers --> Domain

    Domain --> Data
    Domain --> Uploads
    Domain --> Pdf
    Domain --> Gateway

    Data --> Db
    Uploads --> Blob

    AdminStatic -. servido pelo .-> Backend
```

## 3. Pacotes e modulos do projeto

```mermaid
flowchart TB
    subgraph Projeto["Estrutura do OmniMarket"]
        subgraph Backend["backend/"]
            BControllers["Controllers"]
            BServices["Services"]
            BData["Data"]
            BEntities["Models/Entidades"]
            BDtos["Models/Dtos"]
            BInfra["Utils + Extensions + Middleware"]
            BMigrations["Migrations"]
            BTests["Omnimarket.Api.Tests"]
        end

        subgraph Frontend["frontend/"]
            FRoutes["src/routes"]
            FPages["src/pages"]
            FComponents["src/Components"]
            FServices["src/Services"]
            FState["src/store + src/context + src/hooks"]
            FTypes["src/types + src/utils"]
        end

        Docs["docs/"]
    end

    FRoutes --> FPages
    FPages --> FComponents
    FPages --> FServices
    FPages --> FState
    FComponents --> FTypes
    FServices --> BControllers

    BControllers --> BDtos
    BControllers --> BServices
    BServices --> BEntities
    BServices --> BData
    BServices --> BDtos
    BInfra --> BControllers
    BInfra --> BServices
    BMigrations --> BData
    BTests --> BServices
    BTests --> BData

    Docs -. documenta .-> Backend
    Docs -. documenta .-> Frontend
```

## 4. Classes centrais do dominio

Observacao:
- Esta e uma visao de alto nivel das entidades principais do negocio.
- O detalhamento fisico completo das tabelas, colunas e FKs esta em `docs/DER_BANCO_ATUAL.md`.

```mermaid
classDiagram
    class Usuario {
        +int Id
        +string Nome
        +string Email
        +string Cpf
        +string Role
    }

    class Loja {
        +int Id
        +string NomeFantasia
        +string DocumentoFiscal
        +bool Ativa
    }

    class LojaEntregaOpcao {
        +int Id
        +string Nome
        +decimal ValorFrete
        +int PrazoEntregaDias
    }

    class Produto {
        +int Id
        +string Nome
        +string Categoria
        +decimal Preco
        +int Estoque
    }

    class ProdutoMidia {
        +int Id
        +string NomeArquivo
        +string Url
        +int Tipo
    }

    class Carrinho {
        +int Id
    }

    class ItemCarrinho {
        +int Id
        +int Quantidade
    }

    class Pedido {
        +int Id
        +int? ConfiguracaoMarketplaceId
        +int StatusPedidosId
        +decimal ValorTotalPedido
        +decimal ValorComissao
        +decimal ValorLiquidoVendedor
    }

    class ConfiguracaoMarketplace {
        +int Id
        +decimal TaxaFixaComissao
        +decimal PercentualComissao
        +bool Ativo
    }

    class ItensPedido {
        +int Id
        +string NomeProdutoSnapshot
        +int Quantidade
        +decimal PrecoUnitario
        +decimal ValorTotal
    }

    class FormaPagamento {
        +int Id
        +string Nome
        +bool Ativo
    }

    class PlanoPagamento {
        +int Id
        +string StatusPagamento
        +decimal ValorTotal
    }

    class Venda {
        +int Id
        +string StatusVenda
        +decimal ValorBruto
        +decimal ValorLiquido
    }

    class SolicitacaoCancelamento {
        +int Id
        +string TipoSolicitacao
        +string Motivo
        +string Status
    }

    class AvaliacaoProduto {
        +int Id
        +int NotaProduto
        +int NotaLoja
        +bool CompraVerificada
    }

    Usuario "1" --> "0..1" Loja : opera
    Usuario "1" --> "1" Carrinho : possui
    Usuario "1" --> "0..*" Pedido : realiza
    Usuario "1" --> "0..*" AvaliacaoProduto : escreve
    Usuario "1" --> "0..*" Venda : recebe como vendedor
    Usuario "1" --> "0..*" SolicitacaoCancelamento : solicita/analisa

    Loja "1" --> "0..*" LojaEntregaOpcao : oferece
    Loja "1" --> "0..*" Produto : publica
    Loja "1" --> "0..*" AvaliacaoProduto : recebe

    Produto "1" --> "0..*" ProdutoMidia : possui
    Produto "1" --> "0..*" ItemCarrinho : compoe
    Produto "1" --> "0..*" ItensPedido : compoe
    Produto "1" --> "0..*" AvaliacaoProduto : recebe

    Carrinho "1" --> "0..*" ItemCarrinho : contem

    Pedido "1" --> "1..*" ItensPedido : consolida
    ConfiguracaoMarketplace "1" --> "0..*" Pedido : configura comissao aplicada
    Pedido "1" --> "0..1" PlanoPagamento : pagamento
    Pedido "1" --> "0..*" Venda : gera
    Pedido "1" --> "0..*" SolicitacaoCancelamento : origina
    Pedido "1" --> "0..*" AvaliacaoProduto : referencia

    FormaPagamento "1" --> "0..*" PlanoPagamento : utilizada
    Venda "1" --> "0..*" SolicitacaoCancelamento : alvo
```

## 5. Rotas e modulos visiveis no frontend atual

Rotas identificadas em `frontend/src/routes/`:

- `/`
- `/login`
- `/cadastro`
- `/recuperarSenha`
- `/carrinho`
- `/paginaPagamento`
- `/paginaConfirmacaoPix`
- `/paginaSucesso`
- `/perfilUsuario`
- `/loja/$id`
- `/produto/$id`

Fluxos organizados em `src/pages/`:

- autenticacao
- home
- carrinho
- pedido e pagamento
- loja
- produto
- perfil do usuario

## 6. Observacoes arquiteturais importantes

- O sistema esta organizado com separacao clara entre `backend/`, `frontend/` e `docs/`.
- O backend centraliza autenticacao JWT, negocio, persistencia EF Core, upload em Blob e geracao de PDF.
- O frontend consome a API por uma camada de services e usa TanStack Router para navegacao.
- Existe uma interface administrativa estatica em `backend/wwwroot/admin`, entao hoje o admin esta parcialmente fora do frontend React.
- O health check leve da API esta em `/health`, e o de conectividade de banco em `/health/database`.
- O gateway de pagamento atual registrado na aplicacao e `GatewayPagamentoFakeService`, entao o desenho financeiro ainda depende de integracao simulada.

## 7. Relacao com o DER

Se voce for apresentar os dois juntos, a leitura mais natural fica assim:

1. `UML_PROJETO_ATUAL.md`: mostra como o sistema esta organizado e como os modulos conversam.
2. `DER_BANCO_ATUAL.md`: mostra como o banco foi estruturado fisicamente.
3. `TBL_PEDIDO`: e o principal elo entre o fluxo comercial e o fluxo financeiro.
