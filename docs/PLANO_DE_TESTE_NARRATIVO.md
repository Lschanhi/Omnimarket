# Plano de Teste do Frontend - OmniMarket

## 1. Introducao

Este documento descreve os testes manuais do frontend do OmniMarket pela perspectiva de quem entra no site, navega pelas telas, faz login, compra e vende. A base considerada para este roteiro e a publicacao em `https://omnimarket-web-prod.azurewebsites.net`, validada em **15/06/2026** contra o frontend atual do projeto e contra a publicacao acessivel pela URL oficial.

O foco aqui e a jornada visual do usuario: o que aparece na tela, o que ele clica, que mensagem recebe e para onde o fluxo o leva.

Por isso, os cenarios abaixo foram escritos pela navegacao do proprio frontend, sem depender de digitar enderecos internos na barra do navegador. Sempre que possivel, o roteiro parte da home, do botao `Entrar`, do link `Criar conta`, da vitrine, do carrinho, do perfil e das acoes visiveis no painel, exatamente como um usuario comum faria ao usar o site.

Observacao importante:
- Os textos citados abaixo foram alinhados com a interface publicada e com os componentes atuais do frontend.
- Os fluxos que exigem autenticacao, pedidos reais ou dados persistidos devem ser executados com contas de teste dedicadas.
- Os exemplos de e-mail usados nos cenarios positivos foram mantidos em formato valido.

## 2. Objetivo dos Testes

Validar se o OmniMarket entrega uma experiencia de frontend coerente para comprador e vendedor, cobrindo:
- entrada no site e leitura da vitrine;
- cadastro, confirmacao de email e login;
- carrinho e checkout;
- perfil do comprador;
- cadastro inicial do vendedor;
- criacao e manutencao da loja;
- gestao visual de produtos, entregas e vendas.

## 3. Perfis Testados

### Comprador

Pessoa que entra no site, explora a vitrine, abre lojas e produtos, faz login, administra dados no perfil, adiciona itens ao carrinho e segue para o checkout.

### Vendedor

Pessoa que usa o mesmo site para criar conta com intencao de venda, abrir a loja, configurar entregas, publicar produtos e acompanhar vendas pelo painel da loja.

## 4. Casos de Teste - Comprador

## CT-001 - Entrada na home e leitura da vitrine publica

**Perfil:** Comprador

**Objetivo:** Validar a primeira impressao do site para quem entra sem login.

**Pre-condicoes:**
- Navegador sem sessao autenticada.

**Fluxo no front:**
1. Acessar `https://omnimarket-web-prod.azurewebsites.net`.
2. Observar o topo com a logo do OmniMarket e o botao `Entrar`.
3. Verificar o titulo principal `Bem-vindo ao OmniMarket`.
4. Conferir a busca `Buscar produtos, marcas ou categorias`.
5. Rolar a pagina e localizar as secoes `Categorias`, `Lojas em alta`, `Produtos em destaque` e `Produtos para descobrir agora`.

**Resultado esperado na tela:**
- A home carrega com identidade visual completa.
- A vitrine publica pode ser entendida sem login.
- O usuario consegue identificar onde entrar, buscar e explorar produtos.
- O rodape aparece com suporte, participantes e links institucionais.

**Variacao importante:**
- Mesmo sem login, a home deve continuar util e navegavel, com cards de loja e produto clicaveis.

## CT-002 - Navegacao da vitrine para loja e produto

**Perfil:** Comprador

**Objetivo:** Garantir que o usuario consiga sair da home e aprofundar a navegacao em loja e produto.

**Pre-condicoes:**
- Home carregada normalmente.

**Fluxo no front:**
1. Na secao `Lojas em alta`, abrir a loja exibida na vitrine.
2. Conferir a pagina publica da loja.
3. Abrir um produto dessa loja.
4. Conferir a pagina de detalhes do item.

**Resultado esperado na tela:**
- A pagina da loja exibe nome, descricao, indicadores e a lista `Produtos desta loja`.
- A pagina do produto exibe imagem, nome, descricao, preco, avaliacao media e botoes `Comprar` e `Adicionar ao carrinho`.
- Durante carregamentos, o usuario pode ver estados temporarios como `Carregando produto...` ou `Carregando produtos...`, mas o conteudo final deve ser montado em seguida.

**Variacao importante:**
- No ambiente publicado inspecionado em 15/06/2026, a vitrine estava exibindo a loja `ETEC-HAS-Doces` e o produto `Mousse de Limao`. Esses itens podem ser usados como referencia no roteiro manual.

## CT-003 - Entrada na tela de login pela navegacao natural do site

**Perfil:** Comprador

**Objetivo:** Validar o caminho natural da home para a autenticacao.

**Pre-condicoes:**
- Usuario na home publica.

**Fluxo no front:**
1. Clicar em `Entrar`.
2. Conferir a tela `Entre na OmniMarket`.
3. Validar a presenca dos campos `Email` e `Senha`, do checkbox `Lembrar-me`, do link `Esqueci minha senha` e do link `Criar conta`.

**Resultado esperado na tela:**
- A tela de login apresenta uma jornada clara de entrada.
- O usuario entende que pode entrar, recuperar a senha ou criar uma conta.
- Os botoes sociais `Continuar com Google` e `Continuar com Apple` aparecem como alternativas visuais de autenticacao.

**Variacao importante:**
- Ao clicar em `Criar conta`, o usuario deve seguir para o cadastro sem perder a consistencia visual do fluxo.

## CT-004 - Cadastro de comprador com sucesso e confirmacao de email

**Perfil:** Comprador

**Objetivo:** Validar o cadastro positivo de uma conta de comprador pela interface.

**Pre-condicoes:**
- Usuario sem conta previa com os dados do teste.

**Fluxo no front:**
1. Partindo do login, clicar em `Criar conta`.
2. Confirmar que o tipo `Comprador` esta selecionado.
3. Preencher nome completo, e-mail, telefone, CPF, data de nascimento, senha e confirmacao de senha.
4. Se desejar, abrir `Adicionar endereco` e preencher o endereco no proprio cadastro.
5. Marcar o aceite do termo de uso.
6. Clicar em `Criar conta`.
7. Abrir o email recebido e clicar no link de confirmacao.

**Dados sugeridos:**
- Nome completo: `Joao Teste Comprador`
- E-mail: `comprador.front001@email.com`
- Telefone: `(11) 99999-1111`
- CPF: `529.982.247-25`
- Data de nascimento: `1998-05-14`
- Senha: `Teste@123`

**Resultado esperado na tela:**
- O frontend entra em estado de carregamento.
- Ao concluir com sucesso, a interface mostra o alerta `Usuario registrado com sucesso! Confirme o email para ativar a conta.`.
- O usuario e levado para a tela de login para entrar com a nova conta.
- O primeiro login so deve ser liberado depois da confirmacao do email.

**Variacao importante:**
- O comprador pode concluir o cadastro sem preencher endereco, pois esse bloco e opcional nessa etapa.

## CT-005 - Bloqueios visiveis no cadastro de comprador

**Perfil:** Comprador

**Objetivo:** Validar os principais erros que o proprio frontend deve mostrar antes de prosseguir.

**Pre-condicoes:**
- Usuario posicionado na tela de cadastro como `Comprador`.

**Fluxo no front:**
1. Tentar cadastrar com e-mail invalido.
2. Tentar cadastrar sem aceitar o termo.
3. Tentar cadastrar com CPF fora do formato visual esperado.
4. Tentar cadastrar com senha curta ou confirmacao divergente.

**Dados de erro sugeridos:**
- E-mail invalido: `comprador.teste4001aobiel.com`
- CPF invalido de formato: `12345678900`
- Senha curta: `123`
- Confirmacao diferente: `Teste@999`

**Resultado esperado na tela:**
- Para e-mail invalido: `Digite um email valido.`
- Para termo nao aceito: `Aceite o termo de uso para continuar.`
- Para CPF fora do formato: `Digite um CPF no formato 000.000.000-00.`
- Para senha curta: `A senha precisa ter no minimo 6 caracteres.`
- Para confirmacao divergente: `As senhas precisam coincidir.`

**Variacao importante:**
- Se o usuario abrir o bloco de endereco e preencher apenas parte dele, o frontend deve exigir o restante dos campos obrigatorios desse endereco antes de concluir o cadastro.

## CT-006 - Login do comprador com sucesso apos a confirmacao de email

**Perfil:** Comprador

**Objetivo:** Confirmar que a entrada com credenciais validas libera a navegacao autenticada.

**Pre-condicoes:**
- Conta de comprador criada e com email confirmado.

**Fluxo no front:**
1. Acessar a tela `Entre na OmniMarket`.
2. Preencher `Email` e `Senha`.
3. Clicar em `Entrar`.

**Dados sugeridos:**
- E-mail: `comprador.front001@email.com`
- Senha: `Teste@123`

**Resultado esperado na tela:**
- O sistema mostra o alerta `Login realizado com sucesso!`.
- O usuario retorna para a home ja autenticado.
- A sessao passa a habilitar o uso de carrinho, checkout e perfil.

**Variacao importante:**
- Se o usuario marcar `Lembrar-me`, a sessao deve continuar coerente ao longo da navegacao do front.

## CT-007 - Login bloqueado antes da confirmacao e acesso ao fluxo de redefinicao

**Perfil:** Comprador

**Objetivo:** Garantir que o frontend trate bem tanto o bloqueio por email nao confirmado quanto a entrada na tela de nova senha.

**Pre-condicoes:**
- Usuario na tela de login.

**Fluxo no front:**
1. Tentar enviar o login com campos vazios.
2. Tentar enviar com e-mail mal formatado.
3. Tentar entrar com uma conta criada, mas ainda nao confirmada por email.
4. Observar o bloco de orientacao para ativacao e clicar em `Reenviar link`.
5. Clicar em `Esqueci minha senha`.
6. Na tela `Redefina sua senha`, preencher `Nova senha` e `Confirmar senha`.

**Resultado esperado na tela:**
- Para e-mail vazio: `Informe seu email.`
- Para e-mail invalido: `Digite um email valido.`
- Para senha vazia: `Informe sua senha.`
- Para conta nao confirmada, o frontend alerta `Confirme seu email antes de entrar. Use o link enviado para o endereco cadastrado.`
- A propria tela de login passa a exibir a orientacao `Ative sua conta antes do primeiro login` com a acao `Reenviar link`.
- Para falha de autenticacao, o usuario permanece no fluxo de entrada.
- A tela de nova senha exibe o titulo `Redefina sua senha` e o botao `Alterar senha`.

**Variacao importante:**
- Na redefinicao, o frontend deve bloquear com mensagens como `A senha deve ter no minimo 6 caracteres` e `As senhas nao coincidem` quando os dados nao forem consistentes.

## CT-008 - Carrinho sem login

**Perfil:** Comprador

**Objetivo:** Validar o tratamento do carrinho para quem ainda nao entrou na conta.

**Pre-condicoes:**
- Navegador sem autenticacao.

**Fluxo no front:**
1. Abrir o carrinho pelo atalho visual do site.
2. Observar a tela `Revise seus itens antes de finalizar a compra`.

**Resultado esperado na tela:**
- O carrinho exibe o estado de bloqueio com a mensagem `Faca login para acessar seu carrinho`.
- O usuario recebe um CTA claro com o botao `Ir para login`.
- Tambem existe a opcao `Continuar navegando`.

**Variacao importante:**
- Ao clicar em `Ir para login`, o usuario deve cair diretamente na tela de entrada da conta.

## CT-009 - Tentativa de adicionar produto ao carrinho sem login

**Perfil:** Comprador

**Objetivo:** Confirmar que a jornada do produto empurra corretamente para autenticacao quando necessario.

**Pre-condicoes:**
- Usuario sem login.
- Produto publico carregado na tela.

**Fluxo no front:**
1. Abrir um produto na vitrine.
2. Clicar em `Adicionar ao carrinho`.

**Resultado esperado na tela:**
- O usuario e redirecionado para a tela de login.
- O front nao deve deixar a interface travada nem manter o usuario perdido na pagina do produto sem orientacao.

**Variacao importante:**
- A pagina do produto continua util mesmo antes do login, pois o usuario ainda consegue ver preco, descricao e dados da loja antes de decidir entrar.

## CT-010 - Perfil do comprador sem login e estados vazios

**Perfil:** Comprador

**Objetivo:** Validar o comportamento visual do painel quando alguem tenta abrir o perfil sem sessao.

**Pre-condicoes:**
- Navegador sem autenticacao.

**Fluxo no front:**
1. Acessar a area de perfil do usuario.
2. Observar os cards e a secao de compras.

**Resultado esperado na tela:**
- O titulo `Meu perfil` aparece corretamente.
- O painel informa `Erro ao carregar perfil` e `Faca login para visualizar seu perfil.`
- A secao `Minha atividade` aparece com contadores zerados.
- A secao `Historico de compras` fica vazia, com os filtros visiveis e sem quebrar o layout.

**Variacao importante:**
- Os filtros `Compras`, `Cancelado`, `Devolucao` e `Finalizado` podem aparecer mesmo sem pedidos, mas o estado vazio deve continuar compreensivel.

## CT-011 - Perfil do comprador com sessao ativa e edicao de dados

**Perfil:** Comprador

**Objetivo:** Validar a experiencia principal do perfil para uma conta ja autenticada.

**Pre-condicoes:**
- Conta autenticada como comprador.

**Fluxo no front:**
1. Abrir `Meu perfil`.
2. Conferir o resumo `Minha atividade`.
3. Clicar em `Editar perfil`.
4. Ajustar dados pessoais, telefones e enderecos.
5. Usar `Adicionar endereco` quando necessario.

**Resultado esperado na tela:**
- O comprador consegue manter seus dados no mesmo painel.
- O perfil separa claramente a visao de comprador da visao de loja.
- Os enderecos podem ser marcados como principal para uso futuro no checkout.

**Variacao importante:**
- Se ainda nao houver compras, a secao `Historico de compras` deve continuar mostrando um vazio claro, sem parecer erro de renderizacao.

## CT-012 - Etapa de enderecos no checkout

**Perfil:** Comprador

**Objetivo:** Confirmar que a primeira etapa do checkout e clara e operavel.

**Pre-condicoes:**
- Conta autenticada.
- Carrinho com itens.

**Fluxo no front:**
1. Ir do carrinho para a finalizacao.
2. Na tela de checkout, localizar `Resumo do pedido`.
3. Abrir ou manter aberta a `Etapa 1 - Enderecos`.
4. Selecionar um endereco salvo ou clicar em `Adicionar endereco`.
5. Se for o primeiro endereco, salvar pelo botao `Salvar primeiro endereco`.
6. Se ja houver outros, usar `Salvar novo endereco`.

**Resultado esperado na tela:**
- A etapa de enderecos deixa claro qual endereco esta selecionado.
- O formulario de novo endereco fica coerente com o contexto do usuario.
- Depois de salvar, o checkout pode seguir para entrega e pagamento.

**Variacao importante:**
- Quando nao houver endereco ativo, o front deve exibir `Nenhum endereco ativo foi encontrado no seu perfil. Cadastre o primeiro para concluir a compra.`

## CT-013 - Etapa de opcoes de entrega no checkout

**Perfil:** Comprador

**Objetivo:** Validar a segunda etapa do checkout com foco nas opcoes por loja.

**Pre-condicoes:**
- Endereco ja selecionado ou salvo no checkout.
- Carrinho com itens de uma ou mais lojas.

**Fluxo no front:**
1. Avancar para `Etapa 2 - Opcoes de entrega`.
2. Verificar se cada loja do carrinho apresenta ao menos uma modalidade.
3. Escolher a opcao desejada para cada grupo de produtos.

**Resultado esperado na tela:**
- O usuario entende que a entrega pode variar por loja.
- O front exibe carregamento quando preciso e libera a selecao em seguida.
- O resumo do pedido incorpora frete e total geral sem confundir o usuario.

**Variacao importante:**
- Se uma loja ainda nao tiver entrega configurada, o checkout deve avisar isso claramente e impedir o fechamento daquele pedido.

## CT-014 - Etapa de forma de pagamento no checkout

**Perfil:** Comprador

**Objetivo:** Validar a escolha do pagamento pela interface.

**Pre-condicoes:**
- Endereco e entrega resolvidos no checkout.

**Fluxo no front:**
1. Abrir `Etapa 3 - Forma de pagamento`.
2. Conferir as opcoes `PIX`, `Cartao de credito`, `Cartao de debito` e `Boleto bancario`.
3. Selecionar um metodo e observar o comportamento do formulario.

**Resultado esperado na tela:**
- O checkout destaca claramente o metodo selecionado.
- O usuario entende qual forma esta ativa antes de finalizar.
- O resumo lateral continua exibindo subtotal, frete e total geral.

**Variacao importante:**
- `Boleto bancario` pode aparecer na interface, mas nesta versao deve se comportar como opcao indisponivel e nao concluir a compra.

## CT-015 - Bloqueios visiveis do checkout

**Perfil:** Comprador

**Objetivo:** Garantir que o frontend nao deixe o usuario concluir uma compra incompleta.

**Pre-condicoes:**
- Usuario autenticado, mas com algum item faltando no fluxo.

**Fluxo no front:**
1. Tentar finalizar sem itens.
2. Tentar finalizar sem endereco valido.
3. Tentar finalizar sem selecionar entrega por loja.
4. Observar o estado do botao `Finalizar compra`.

**Resultado esperado na tela:**
- O botao final deve permanecer bloqueado quando a compra ainda nao esta pronta.
- O checkout precisa orientar o usuario sobre o que falta ajustar.
- O total deve permanecer coerente com o estado atual da compra.

**Variacao importante:**
- Quando o carrinho estiver vazio, o resumo deve continuar consistente, sem permitir avancar apenas por engano visual.

## CT-016 - Revisao final e confirmacao da compra com PIX

**Perfil:** Comprador

**Objetivo:** Validar a etapa de revisao antes da conclusao.

**Pre-condicoes:**
- Checkout preenchido com `PIX` como metodo.

**Fluxo no front:**
1. Clicar em `Finalizar compra`.
2. Conferir a tela de revisao com os blocos `Comprador`, `Endereco de entrega`, `Pagamento`, `Totais da compra` e `Lojas e produtos`.
3. Se precisar, usar `Ajustar checkout`.
4. Se estiver tudo certo, clicar em `Confirmar compra`.

**Resultado esperado na tela:**
- O usuario consegue revisar tudo antes de concluir.
- Os dados estao organizados por comprador, endereco, pagamento, totais e lojas.
- A pagina passa seguranca para a ultima confirmacao da compra.

**Variacao importante:**
- Ao voltar por `Voltar` ou `Ajustar checkout`, o fluxo deve retornar ao checkout sem descaracterizar a experiencia.

## CT-017 - Modal PIX demonstrativo e conclusao do checkout fake

**Perfil:** Comprador

**Objetivo:** Validar o comportamento visual do fechamento com PIX demonstrativo.

**Pre-condicoes:**
- Compra revisada e confirmada com `PIX`.

**Fluxo no front:**
1. Confirmar a compra na tela de revisao.
2. Aguardar a abertura do modal `PIX demonstrativo`.
3. Conferir o bloco `Resumo da demonstracao`.
4. Clicar em `Simular pagamento PIX`.

**Resultado esperado na tela:**
- O modal aparece com QR demonstrativo e valor total.
- O usuario entende que se trata de um PIX fake de apresentacao.
- Depois de simular o pagamento, o fluxo segue para a tela de sucesso.

**Variacao importante:**
- O modal deve continuar explicito o suficiente para o usuario nao confundir demonstracao com pagamento real.

## CT-018 - Tela de sucesso da compra

**Perfil:** Comprador

**Objetivo:** Validar o fechamento visual do fluxo de compra.

**Pre-condicoes:**
- Checkout concluido com sucesso.

**Fluxo no front:**
1. Concluir o pagamento do fluxo anterior.
2. Conferir a tela `Compra realizada com sucesso!`.
3. Ler metodo de pagamento, itens, preco total, status e pedido gerado.
4. Testar os botoes finais da tela.

**Resultado esperado na tela:**
- A pagina apresenta um encerramento claro e positivo da jornada.
- O usuario visualiza status, itens e identificadores de pedido.
- Os botoes `Voltar para Pagina Principal` e `Voltar ao carrinho` ficam disponiveis.

**Variacao importante:**
- Se o checkout gerar mais de um pedido, a tela deve listar `Pedidos gerados:` em vez de mostrar apenas um item isolado.

## 5. Casos de Teste - Vendedor

## CT-019 - Alternancia visual entre comprador e vendedor no cadastro

**Perfil:** Vendedor

**Objetivo:** Confirmar que a propria tela de cadastro deixa claro o caminho de venda.

**Pre-condicoes:**
- Usuario na tela `Crie sua conta na OmniMarket`.

**Fluxo no front:**
1. Abrir o cadastro.
2. Alternar de `Comprador` para `Vendedor`.
3. Observar os campos e textos extras que surgem.

**Resultado esperado na tela:**
- A tela passa a mostrar `CPF do responsavel`, um bloco `Proximo passo para vender` e a orientacao de que a loja sera aberta depois da confirmacao do email.
- O bloco de endereco continua opcional, servindo para adiantar um endereco principal no perfil.
- O botao final permanece como `Criar conta`.

**Variacao importante:**
- Ao voltar para `Comprador`, os elementos especificos de loja nao devem permanecer poluindo o formulario.

## CT-020 - Cadastro de vendedor com confirmacao de email e abertura posterior da loja

**Perfil:** Vendedor

**Objetivo:** Validar a jornada segura em que o vendedor cria a conta primeiro, confirma o email e so depois abre a loja.

**Pre-condicoes:**
- Dados de vendedor ainda nao usados em outra conta.

**Fluxo no front:**
1. Selecionar `Vendedor`.
2. Preencher dados pessoais normalmente.
3. Se desejar adiantar o perfil, abrir `Adicionar endereco` e preencher um endereco principal.
4. Marcar o termo de uso.
5. Clicar em `Criar conta`.
6. Abrir o email recebido e clicar no link de confirmacao.
7. Voltar para o site, fazer login e entrar no perfil.
8. Clicar em `Criar loja`.
9. Preencher `Nome fantasia`, `Tipo do documento`, `Documento fiscal`, `Email de contato` e confirmar o termo fiscal.

**Dados sugeridos para a conta:**
- Nome completo: `Marina Teste Vendedora`
- E-mail: `vendedora.front001@email.com`
- Telefone: `(11) 99999-2222`
- CPF do responsavel: `390.533.447-05`
- Senha: `Teste@123`

**Dados sugeridos para a loja:**
- Nome fantasia: `Loja Aurora Tech`
- Documento fiscal da loja: `390.533.447-05`

**Resultado esperado na tela:**
- O cadastro da conta termina com a mensagem `Usuario registrado com sucesso! Confirme o email para ativar a conta.`
- O login so e liberado depois da confirmacao do email.
- A criacao da loja acontece no perfil, dentro do modal `Criar loja`.
- Ao terminar bem, o usuario recebe o alerta `Loja criada com sucesso!`.

**Variacao importante:**
- Se o vendedor ja tiver cadastrado endereco no registro da conta, esse dado pode facilitar a abertura da loja no perfil depois do primeiro login.

## CT-021 - Cadastro de vendedor sem endereco previo

**Perfil:** Vendedor

**Objetivo:** Validar a jornada de quem cria a conta agora e deixa o endereco e a loja para concluir depois no perfil.

**Pre-condicoes:**
- Usuario na tela de cadastro como `Vendedor`.

**Fluxo no front:**
1. Preencher os dados de vendedor sem abrir o bloco `Adicionar endereco`.
2. Marcar o termo de uso.
3. Clicar em `Criar conta`.

**Resultado esperado na tela:**
- O frontend permite concluir a conta mesmo sem endereco nessa etapa.
- O usuario recebe orientacao para confirmar o email antes de entrar.
- Depois do login, a abertura da loja permanece disponivel no perfil, mas dependera de telefone principal e endereco principal.

**Variacao importante:**
- A jornada do vendedor continua valida mesmo sem endereco no cadastro, desde que ele complete esse dado no perfil antes de clicar em `Criar loja`.

## CT-022 - Bloqueios visiveis no cadastro de vendedor

**Perfil:** Vendedor

**Objetivo:** Validar os principais erros frontais da jornada de venda.

**Pre-condicoes:**
- Usuario na tela de cadastro como `Vendedor`.

**Fluxo no front:**
1. Tentar enviar o formulario sem nome completo.
2. Tentar enviar com e-mail invalido.
3. Tentar seguir sem marcar o termo de uso.
4. Tentar enviar endereco incompleto, caso o bloco tenha sido aberto.

**Resultado esperado na tela:**
- O frontend deve bloquear com mensagens claras, como:
  - `Informe seu nome completo.`
  - `Digite um email valido.`
  - `Aceite o termo de uso para continuar.`
  - `Digite um CPF no formato 000.000.000-00.`

**Variacao importante:**
- Se o bloco de endereco inicial foi iniciado, ele deve exigir cidade, UF, CEP, nome do endereco e numero antes da conclusao.

## CT-023 - Entrada do vendedor no proprio painel apos a confirmacao de email

**Perfil:** Vendedor

**Objetivo:** Validar a experiencia principal do vendedor apos autenticacao.

**Pre-condicoes:**
- Conta autenticada depois da confirmacao de email.

**Fluxo no front:**
1. Fazer login.
2. Abrir o perfil.
3. Alternar ou acessar a visao da loja.

**Resultado esperado na tela:**
- O painel passa a usar o destaque `Central da loja`.
- O titulo principal mostra o nome da loja ou `Minha loja`.
- O usuario encontra acoes como `Criar loja`, `Editar loja`, `Resumo financeiro`, `Produtos` e `Vendas`.

**Variacao importante:**
- Se a conta ainda nao tiver loja criada, o front deve manter a jornada compreensivel e indicar a necessidade de completar esse passo.

## CT-024 - Criacao da loja pelo perfil como fluxo principal do vendedor

**Perfil:** Vendedor

**Objetivo:** Validar a abertura da loja a partir do painel, sem depender do cadastro inicial.

**Pre-condicoes:**
- Conta autenticada como vendedor.
- Perfil com telefone principal e endereco principal ja definidos.

**Fluxo no front:**
1. No perfil, clicar em `Criar loja`.
2. Observar o modal de loja.
3. Preencher ou revisar nome fantasia, documento fiscal, descricao e dados visiveis.
4. Confirmar a criacao.

**Resultado esperado na tela:**
- O modal explica que `o cadastro usa o endereco e o telefone principal do seu perfil atual`.
- A criacao da loja acontece no mesmo fluxo do painel.
- Depois de salvar, a visao da loja fica disponivel para gestao.

**Variacao importante:**
- Se faltar telefone principal ou endereco principal, o painel deve orientar o usuario a completar o perfil antes de liberar a loja.

## CT-025 - Edicao da loja e termo fiscal no perfil

**Perfil:** Vendedor

**Objetivo:** Garantir que a manutencao da loja continue clara depois da criacao.

**Pre-condicoes:**
- Loja ja criada e acessivel no painel.

**Fluxo no front:**
1. Abrir `Editar loja`.
2. Conferir a opcao `Loja ativa para receber publicacoes e vendas`.
3. Ajustar dados e salvar.

**Resultado esperado na tela:**
- O modal permite atualizar a identidade da loja no mesmo lugar.
- O botao final aparece como `Salvar loja`.
- O estado ativo da loja fica visualmente compreensivel.

**Variacao importante:**
- Se o usuario tentar concluir a primeira abertura da loja sem a confirmacao fiscal necessaria, o front deve bloquear a operacao com mensagem especifica.

## CT-026 - Gestao de opcoes de entrega da loja

**Perfil:** Vendedor

**Objetivo:** Validar a configuracao visual das entregas no painel da loja.

**Pre-condicoes:**
- Loja criada.

**Fluxo no front:**
1. No painel da loja, abrir `Opcoes de entrega`.
2. Cadastrar uma modalidade.
3. Editar outra modalidade.
4. Remover uma opcao que nao sera usada.

**Resultado esperado na tela:**
- O painel apresenta um modal dedicado a entregas.
- O vendedor entende que esta configurando frete e modalidades da propria loja.
- As opcoes salvas devem refletir depois no checkout do comprador.

**Variacao importante:**
- Se uma loja nao tiver entrega configurada, isso deve impactar o checkout do comprador com aviso claro, sem quebrar o restante da navegacao.

## CT-027 - Publicacao e manutencao de produtos no painel da loja

**Perfil:** Vendedor

**Objetivo:** Validar a rotina visual de cadastrar, editar e acompanhar produtos.

**Pre-condicoes:**
- Loja ativa.

**Fluxo no front:**
1. Entrar na aba `Produtos`.
2. Cadastrar um item novo.
3. Editar nome, preco, estoque, descricao e imagem.
4. Confirmar que o item aparece como publicado na area da loja.

**Resultado esperado na tela:**
- A aba `Produtos` funciona como central de manutencao da vitrine.
- O vendedor consegue identificar os produtos publicados e suas alteracoes.
- Um produto salvo corretamente pode voltar a aparecer na vitrine publica da loja e da home.

**Variacao importante:**
- Quando nao houver itens, o painel deve exibir um estado vazio compreensivel, e nao uma tela quebrada.

## CT-028 - Painel de vendas e leitura do fluxo operacional

**Perfil:** Vendedor

**Objetivo:** Validar a visualizacao das vendas e seus status no frontend.

**Pre-condicoes:**
- Loja com ao menos um pedido vinculado.

**Fluxo no front:**
1. Abrir a aba `Vendas`.
2. Conferir o bloco `Desempenho de vendas`.
3. Observar os filtros e os totais por etapa.
4. Abrir um pedido para inspecionar a venda.

**Resultado esperado na tela:**
- O vendedor consegue entender o andamento das vendas no proprio painel.
- O resumo mostra etapas como `Pendente`, `Em separacao`, `Pronto`, `Enviado`, `Finalizado` e `Cancelado`.
- O bloco `Resumo financeiro` complementa a leitura da loja.

**Variacao importante:**
- Se ainda nao houver vendas, a aba deve apresentar um vazio claro, sem esconder o proposito do painel.

## CT-029 - Acompanhamento das compras no perfil do comprador

**Perfil:** Comprador

**Objetivo:** Confirmar que, apos comprar, o usuario tenha um lugar claro para consultar pedidos.

**Pre-condicoes:**
- Conta autenticada.
- Pelo menos um pedido ja concluido ou em andamento.

**Fluxo no front:**
1. Acessar `Meu perfil`.
2. Abrir `Historico de compras`.
3. Alternar entre os filtros `Compras`, `Cancelado`, `Devolucao` e `Finalizado`.

**Resultado esperado na tela:**
- O comprador consegue localizar rapidamente em que grupo cada pedido aparece.
- O filtro ativo reorganiza a leitura do historico sem exigir nova navegacao fora do painel.

**Variacao importante:**
- Quando um filtro nao tiver itens, o painel deve explicar o vazio com uma mensagem coerente, e nao apenas desaparecer.

## CT-030 - Checagem geral de responsividade e consistencia visual

**Perfil:** Comprador e Vendedor

**Objetivo:** Validar a experiencia geral do frontend em navegacoes mais longas.

**Pre-condicoes:**
- Ambiente carregando normalmente.

**Fluxo no front:**
1. Navegar pela home, login, cadastro, carrinho, checkout, perfil e loja.
2. Repetir a validacao em largura de desktop e em largura de celular.
3. Conferir se botoes, cards, formularios e resumos permanecem utilizaveis.

**Resultado esperado na tela:**
- O layout continua legivel e navegavel em telas maiores e menores.
- Formularios nao devem cortar campos nem sobrepor botoes.
- O usuario deve continuar entendendo a hierarquia das etapas, principalmente em cadastro, checkout e painel.

**Variacao importante:**
- Mesmo quando houver estado vazio, carregamento ou bloqueio por falta de login, a tela precisa manter boa leitura e orientacao.

## 6. Observacoes do Frontend Publicado

Com base na verificacao feita em 15/06/2026, alguns pontos merecem registro no roteiro:

1. A home publicada esta funcional e usa uma narrativa forte de vitrine, com busca, categorias, lojas em alta e produtos em destaque.
2. O caminho natural `Home -> Entrar -> Criar conta` esta claro e mais alinhado com uso real do usuario do que citar rotas manualmente.
3. O fluxo novo de cadastro passa a depender da tela `Confirmacao de conta`, acessada pelo link enviado por email.
4. O login agora bloqueia o primeiro acesso quando o email ainda nao foi confirmado e oferece a acao `Reenviar link`.
5. O carrinho sem login e bem sinalizado, com CTA direto para a autenticacao.
6. O produto publico redireciona para login quando o usuario tenta `Adicionar ao carrinho` sem estar autenticado.
7. O checkout esta organizado em tres etapas visuais: `Enderecos`, `Opcoes de entrega` e `Forma de pagamento`.
8. O fluxo de PIX demonstrativo esta preparado para apresentacao, com revisao, modal de QR fake e tela final de sucesso.
9. O perfil separa bem a leitura de comprador e de loja, o que ajuda a narrativa do TCC no frontend.

## 7. Conclusao

Esta versao do plano foi adaptada para a linguagem real do frontend do OmniMarket. Em vez de explicar o sistema por detalhes internos, o documento passa a narrar a experiencia da pessoa que entra no site, clica, preenche, confirma o email, faz o primeiro login e acompanha o resultado na tela.

Com isso, o material fica melhor para apresentacao, demonstracao guiada, validacao manual e defesa funcional do projeto, especialmente quando a intencao e mostrar o que o usuario final enxerga ao usar o marketplace na pratica com uma etapa extra de seguranca para ativar a conta.
