# API

## Modulos principais

### Autenticacao

- `api/auth/login`
- `api/auth/logout`

### Usuarios

- perfil do usuario
- atualizacao cadastral
- foto de perfil
- enderecos
- telefones

### Produtos e lojas

- catalogo publico de produtos
- CRUD de produtos autenticado
- midias de produto
- avaliacoes
- lojas publicas e gestao de loja
- opcoes de entrega

### Pedido e carrinho

- carrinho autenticado
- criacao e consulta de pedidos
- cancelamentos
- recibos

### Financeiro

- inicio e confirmacao de pagamento
- visoes de vendas

### Uploads

- upload protegido para arquivos do usuario/produto

### Administrativo

- dashboard
- usuarios
- lojas
- produtos
- pedidos
- vendas

## Observacoes

- A API usa JWT Bearer.
- Parte das rotas exige autenticacao; o modulo admin exige role `Admin`.
- A API expoe `GET /health` e `GET /health/database` para monitoramento e diagnostico.
- O Swagger permanece habilitado para exploracao e teste.
