![Status](https://img.shields.io/badge/status-em%20desenvolvimento-gold)
![.NET](https://img.shields.io/badge/.NET-9-purple)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4)
![License](https://img.shields.io/badge/license-Academic-lightgrey)

# OmniMarket

Marketplace digital desenvolvido para conectar compradores e microempreendedores em uma única plataforma moderna, segura e escalável.

---

## Sobre o Projeto

O **OmniMarket** é uma plataforma de marketplace desenvolvida como Trabalho de Conclusão de Curso (TCC) do curso Técnico em Desenvolvimento de Sistemas.

O projeto foi concebido para reduzir as barreiras de entrada no comércio eletrônico, permitindo que pequenos empreendedores comercializem seus produtos de forma simples, enquanto compradores encontram diversos vendedores em um único ambiente digital.

Diferente de marketplaces tradicionais, o OmniMarket permite que um mesmo usuário atue simultaneamente como:

* Comprador
* Vendedor
* Proprietário de Loja

Tudo utilizando uma única conta.

---

## Problema Solucionado

Muitos microempreendedores enfrentam dificuldades para ingressar no comércio eletrônico devido a:

* Custos elevados de plataformas
* Complexidade técnica
* Baixa visibilidade online
* Falta de ferramentas integradas

O OmniMarket centraliza essas funcionalidades em uma única solução.

---

## Principais Funcionalidades

### Usuários

* Cadastro com CPF ou CNPJ
* Autenticação JWT
* Recuperação de senha
* Gerenciamento de perfil
* Cadastro de endereços

### Compradores

* Navegação por produtos
* Busca e filtros
* Carrinho de compras
* Finalização de pedidos
* Histórico de compras

### Vendedores

* Criação de lojas
* Gestão de produtos
* Controle de estoque
* Gerenciamento de pedidos
* Dashboard de vendas

### Marketplace

* Multi-lojas
* Comissão por venda
* Sistema de avaliações
* Controle de permissões (RBAC)
* Integração com Azure Blob Storage

---

## Arquitetura da Solução

```text
┌─────────────────────┐
│      Frontend       │
│ React + TypeScript  │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│      Backend        │
│ ASP.NET Core 9 API  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    SQL Server       │
│   Azure SQL DB      │
└─────────────────────┘

           │
           ▼

┌─────────────────────┐
│ Azure Blob Storage  │
│ Imagens e Arquivos  │
└─────────────────────┘
```

---

## Tecnologias Utilizadas

### Backend

* ASP.NET Core 9
* Entity Framework Core 9
* SQL Server
* Azure SQL Database
* JWT Authentication
* Swagger/OpenAPI
* Azure Blob Storage
* QuestPDF

### Frontend

* React 19
* TypeScript
* Vite
* Zustand
* TanStack Router
* Tailwind CSS

### Infraestrutura

* Azure App Service
* Azure SQL Database
* Azure Blob Storage
* Render
* GitHub Actions
* Vercel

---

## Estrutura do Projeto

```text
/
├── backend/
│   ├── Controllers
│   ├── Services
│   ├── Repositories
│   ├── Models
│   ├── DTOs
│   ├── Middleware
│   └── Infrastructure
│
├── frontend/
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── services
│   │   ├── stores
│   │   └── routes
│
├── docs/
│   ├── Arquitetura
│   ├── API
│   ├── RBAC
│   ├── QA
│   ├── Plano de Testes
│   └── Manual Operacional
│
└── .github/
    └── workflows
```

---

## Segurança

O projeto implementa:

* Autenticação JWT
* Controle de acesso baseado em papéis (RBAC)
* Criptografia de senhas com Hash + Salt
* Validação de CPF e CNPJ
* Proteção contra acesso indevido a recursos
* Controle de permissões por usuário e loja

---

## Deploys

### Frontend

Azure App Service

https://omnimarket-web-prod.azurewebsites.net

Vercel

https://omnimarket-zeta.vercel.app

### Backend

Azure App Service

https://omnimarket-api-prod.azurewebsites.net

Render

https://omnimarket-uom9.onrender.com

Swagger

https://omnimarket-api-prod.azurewebsites.net/swagger

---

## Executando Localmente

### Backend

```bash
dotnet restore backend/Omnimarket.Api.sln
dotnet build backend/Omnimarket.Api.sln
dotnet test backend/Omnimarket.Api.sln
dotnet run --project backend/OmniMarket.API.csproj
```

### Frontend

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## Roadmap

### Sprint 1

* Estrutura inicial
* Autenticação
* Cadastro de usuários

### Sprint 2

* Produtos
* Lojas
* Carrinho

### Sprint 3

* Pedidos
* Dashboard
* Azure Blob Storage

### Próximas Evoluções

* Gateway de pagamento
* Sistema avançado de avaliações
* Aplicativo Mobile
* Painel administrativo
* Relatórios gerenciais
* Integração com IA para recomendação de produtos

---

## Equipe

Projeto desenvolvido pelo grupo JESKO.

* Felipe Sardinhha Miguel
* Gustavo Henrique Silva
* Icaro Dias Camargo
* Lucas Soler Chanhi
* Mauro Alexandre da Silva Roque
---

## Licença

Projeto acadêmico desenvolvido para fins educacionais como Trabalho de Conclusão de Curso (TCC).

Todos os direitos reservados aos autores.
