# Manual de Teste

## Objetivo

Este manual apresenta roteiros manuais para validar os fluxos mais importantes do OmniMarket.

## Ambiente recomendado

- Backend em execucao
- Frontend em execucao
- Base de dados configurada
- Navegador atualizado

## Dados sugeridos para teste

| Identificador | Perfil | Uso sugerido |
| --- | --- | --- |
| `comprador-01` | Comprador sem endereco inicial | Validar cadastro simples e endereco no checkout |
| `comprador-02` | Comprador com endereco | Validar compra direta |
| `vendedor-01` | Vendedor com loja | Validar loja, produto e venda |
| `comprador-vendedor-01` | Comprador que depois abre loja | Validar evolucao de perfil |

## CT-01 Cadastro de comprador sem endereco inicial

**Objetivo:** validar a criacao de conta de comprador sem expandir a secao de endereco.

**Pre-condicoes:** usuario ainda nao cadastrado.

**Passos:**

1. Acessar a tela de cadastro.
2. Selecionar `Comprador`.
3. Preencher todos os campos obrigatorios.
4. Manter a secao `Endereco` recolhida.
5. Marcar o checkbox do termo de uso.
6. Clicar em `Criar conta`.

**Resultado esperado:**

- O cadastro deve ser concluido com sucesso.
- Nenhum erro de endereco deve ser exibido.

## CT-02 Cadastro de comprador com endereco inicial

**Objetivo:** validar a criacao de comprador com endereco informado ja no cadastro.

**Pre-condicoes:** usuario ainda nao cadastrado.

**Passos:**

1. Acessar a tela de cadastro.
2. Selecionar `Comprador`.
3. Clicar no botao `+` da secao `Endereco`.
4. Preencher os campos de endereco.
5. Marcar o checkbox do termo de uso.
6. Clicar em `Criar conta`.

**Resultado esperado:**

- O cadastro deve ser concluido com sucesso.
- O endereco deve ficar vinculado ao perfil do comprador.

## CT-03 Cadastro de vendedor direto

**Objetivo:** validar a criacao de conta de vendedor desde a tela de cadastro.

**Pre-condicoes:** usuario ainda nao cadastrado.

**Passos:**

1. Acessar a tela de cadastro.
2. Selecionar `Vendedor`.
3. Preencher os dados pessoais.
4. Preencher `Nome fantasia`, `Tipo de documento fiscal` e `Documento fiscal da loja`.
5. Marcar o checkbox do termo de uso.
6. Marcar o checkbox do termo fiscal para vendedores.
7. Clicar em `Criar conta`.

**Resultado esperado:**

- A conta deve ser criada com loja vinculada.
- O usuario deve conseguir acessar as opcoes da loja no perfil.

## CT-04 Comprador abrindo loja depois

**Objetivo:** validar a transformacao operacional de comprador em vendedor.

**Pre-condicoes:** conta criada como comprador e autenticada.

**Passos:**

1. Abrir `Perfil do usuario`.
2. Clicar em `Criar loja`.
3. Preencher os campos do modal da loja.
4. Selecionar `CPF` em `Tipo do documento`.
5. Confirmar se o campo fiscal vem preenchido com o CPF da conta, quando aplicavel.
6. Marcar o termo fiscal.
7. Clicar em `Criar loja`.

**Resultado esperado:**

- A loja deve ser criada com sucesso.
- O perfil deve passar a exibir as funcionalidades de vendedor.

## CT-05 Cadastro de produto

**Objetivo:** validar o cadastro de um produto por uma conta com loja.

**Pre-condicoes:** conta autenticada com loja ativa.

**Passos:**

1. Abrir o perfil da loja.
2. Clicar no botao de adicionar produto.
3. Preencher nome, categoria, preco, estoque e descricao.
4. Manter o produto como disponivel para venda.
5. Clicar em `Criar produto`.

**Resultado esperado:**

- O produto deve aparecer na listagem da loja.

## CT-06 Adicao de um item ao carrinho

**Objetivo:** validar a inclusao simples de um produto no carrinho.

**Pre-condicoes:** produto disponivel para venda e comprador autenticado.

**Passos:**

1. Abrir a pagina do produto.
2. Clicar em `Adicionar ao carrinho`.
3. Abrir o carrinho.

**Resultado esperado:**

- O carrinho deve exibir o produto adicionado.
- O subtotal deve ser calculado corretamente.

## CT-07 Adicao de mais de um produto

**Objetivo:** validar carrinho com multiplos itens.

**Pre-condicoes:** pelo menos dois produtos disponiveis.

**Passos:**

1. Adicionar o primeiro produto ao carrinho.
2. Adicionar o segundo produto ao carrinho.
3. Abrir o carrinho.
4. Ajustar a quantidade de um dos itens, se necessario.

**Resultado esperado:**

- O carrinho deve listar todos os itens.
- O total deve ser recalculado conforme produtos e quantidades.

## CT-08 Compra com comprador sem endereco salvo

**Objetivo:** validar o cadastro do primeiro endereco durante o checkout.

**Pre-condicoes:** comprador autenticado, com carrinho preenchido e sem endereco ativo no perfil.

**Passos:**

1. Abrir o carrinho.
2. Clicar em `Finalizar compra`.
3. Na etapa de endereco, preencher o primeiro endereco.
4. Prosseguir para entrega e pagamento.

**Resultado esperado:**

- O endereco deve ser aceito pelo checkout.
- O fluxo deve permitir continuar sem travar na etapa de endereco.

## CT-09 Revisao do checkout

**Objetivo:** validar a tela de confirmacao antes da conclusao do pedido.

**Pre-condicoes:** checkout preenchido com endereco, entrega e pagamento.

**Passos:**

1. Selecionar uma forma de pagamento.
2. Clicar em `Finalizar compra`.
3. Revisar a tela `Confirmacao do pedido`.

**Resultado esperado:**

- A tela deve mostrar comprador, endereco, pagamento, totais e itens.
- O botao `Confirmar compra` deve estar disponivel.

## CT-10 Pagamento com PIX demonstrativo

**Objetivo:** validar a conclusao do pedido com PIX fake.

**Pre-condicoes:** checkout revisado e metodo `PIX` selecionado.

**Passos:**

1. Na tela de confirmacao, clicar em `Confirmar compra`.
2. Validar a abertura do modal de PIX demonstrativo.
3. Clicar em `Simular pagamento PIX`.

**Resultado esperado:**

- O modal de PIX deve exibir QR fake e codigo demonstrativo.
- O sistema deve concluir o pedido e abrir a tela de sucesso.

## Evidencias recomendadas

- Captura da tela de cadastro concluido
- Captura da loja criada
- Captura do produto cadastrado
- Captura do carrinho com um item
- Captura do carrinho com multiplos itens
- Captura da revisao do checkout
- Captura do modal de PIX
- Captura da tela de compra concluida

## Complemento

Este manual pode ser executado em conjunto com o checklist de regressao em `docs/QA_CHECKLIST.md`.
