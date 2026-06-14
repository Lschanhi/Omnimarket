# Manual de Operacao do Aplicativo

## Objetivo

Este manual descreve como operar os principais fluxos do OmniMarket pela interface web:

- cadastrar um comprador
- cadastrar um vendedor
- transformar uma conta de comprador em vendedor
- criar uma loja
- cadastrar um produto
- adicionar itens ao carrinho
- comprar mais de um produto
- concluir o pagamento com PIX demonstrativo

## Perfis de uso

- `Comprador`: conta usada para navegar, adicionar itens ao carrinho e concluir compras.
- `Vendedor`: conta usada para manter uma loja ativa, cadastrar produtos e receber pedidos.

## 1. Cadastrar um comprador

1. Acesse a pagina de cadastro.
2. Na secao `Tipo de cadastro`, selecione `Comprador`.
3. Preencha os campos obrigatorios:
   - `Nome completo`
   - `Email`
   - `Telefone`
   - `CPF`
   - `Data de nascimento`
   - `Senha`
   - `Confirmacao de senha`
4. Se quiser cadastrar o endereco ja nesse momento, clique no botao `+` da secao `Endereco`.
5. Preencha o endereco, se a secao for expandida.
6. Leia e marque o checkbox do `termo de uso e responsabilidade`.
7. Clique em `Criar conta`.

### Resultado esperado

- A conta de comprador e criada com sucesso.
- Se o endereco tiver sido informado, ele passa a ficar disponivel no perfil e no checkout.

## 2. Cadastrar um vendedor direto

1. Acesse a pagina de cadastro.
2. Na secao `Tipo de cadastro`, selecione `Vendedor`.
3. Preencha os dados pessoais da conta:
   - `Nome completo`
   - `Email`
   - `Telefone`
   - `CPF do responsavel`
   - `Data de nascimento`
   - `Senha`
   - `Confirmacao de senha`
4. Preencha os dados da loja:
   - `Nome fantasia`
   - `Tipo de documento fiscal`
   - `Documento fiscal da loja`
5. Se quiser informar o endereco inicial da loja, clique no botao `+` da secao `Endereco inicial`.
6. Leia e marque:
   - o checkbox do `termo de uso e responsabilidade`
   - o checkbox do `termo fiscal para vendedores`
7. Clique em `Criar conta`.

### Resultado esperado

- A conta e criada com perfil de vendedor.
- A loja inicial fica pronta para futuras edicoes e cadastro de produtos.

## 3. Como um comprador abre uma loja depois

1. Entre com a conta ja cadastrada como comprador.
2. Acesse `Perfil do usuario`.
3. Se necessario, clique em `Editar perfil` e mantenha telefone e endereco principal atualizados.
4. Clique em `Criar loja`.
5. No modal, preencha:
   - `Nome fantasia`
   - `Tipo do documento`
   - `Documento fiscal`
   - `Email de contato`
   - `Descricao`
6. Se o tipo do documento for `CPF`, o campo fiscal pode vir preenchido com o CPF do proprio usuario.
7. Marque o checkbox `Loja ativa para receber publicacoes e vendas`, se desejar deixar a loja publica.
8. Leia e marque o `termo fiscal para vendedores`.
9. Clique em `Criar loja`.

### Resultado esperado

- A conta passa a ter uma loja vinculada.
- O perfil passa a exibir os botoes de manutencao da loja e dos produtos.

## 4. Cadastrar um produto para venda

1. Entre com a conta do vendedor.
2. Acesse `Perfil do usuario`.
3. Abra a area da loja.
4. Clique no botao com icone de `+` para adicionar um produto.
5. Preencha o formulario:
   - `Nome do produto`
   - `Categoria`
   - `Preco`
   - `Estoque`
   - `Descricao`
6. Se desejar, envie a `Imagem principal`.
7. Mantenha marcado o checkbox `Produto disponivel para venda`.
8. Clique em `Criar produto`.

### Resultado esperado

- O produto passa a aparecer na loja e no fluxo de venda.

## 5. Adicionar um produto ao carrinho

1. Acesse a pagina de detalhes do produto.
2. Clique em `Adicionar ao carrinho`.

### Resultado esperado

- O sistema confirma que o item foi adicionado.
- O contador do carrinho e atualizado.

## 6. Adicionar mais de um produto

Voce pode fazer isso de duas formas:

### Opcao A: adicionar produtos diferentes

1. Entre em um produto e clique em `Adicionar ao carrinho`.
2. Volte ao catalogo.
3. Abra outro produto.
4. Clique novamente em `Adicionar ao carrinho`.

### Opcao B: ajustar quantidade no carrinho

1. Acesse a pagina `Carrinho`.
2. Ajuste a quantidade do item desejado.

### Resultado esperado

- O carrinho deve refletir todos os itens selecionados e o total atualizado.

## 7. Realizar uma compra

1. Acesse o `Carrinho`.
2. Revise os produtos adicionados.
3. Clique em `Finalizar compra`.
4. Na etapa de endereco:
   - selecione um endereco existente, ou
   - cadastre um novo endereco, caso a conta ainda nao tenha um endereco principal
5. Na etapa de entrega, selecione a opcao disponivel para a loja.
6. Na etapa de pagamento, escolha a forma desejada.

## 8. Realizar o pagamento com PIX

1. Na etapa `Forma de pagamento`, selecione `PIX`.
2. Clique em `Finalizar compra`.
3. Na tela `Confirmacao do pedido`, revise:
   - dados do comprador
   - endereco de entrega
   - metodo de pagamento
   - totais da compra
   - lojas e produtos envolvidos
4. Clique em `Confirmar compra`.
5. No modal de PIX demonstrativo:
   - apresente o QR fake na tela, ou
   - copie o codigo fake de PIX, se desejar usar em demonstracao
6. Clique em `Simular pagamento PIX`.

### Resultado esperado

- O pedido e concluido com sucesso.
- A tela final exibe o resumo da compra e o metodo de pagamento utilizado.

## 9. Observacoes operacionais

- O fluxo de PIX atual e demonstrativo e foi preparado para apresentacao academica.
- A conta de comprador pode ser criada sem endereco, mas um endereco valido sera necessario para compras com entrega.
- Ao abrir loja a partir do perfil, o sistema utiliza o telefone e o endereco principal ja cadastrados na conta.
- O boleto bancario aparece apenas como indisponivel no estado atual da aplicacao.
