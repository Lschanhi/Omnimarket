# Manual de Teste

## Objetivo

Este manual apresenta os roteiros manuais para validar o fluxo atual de cadastro com confirmacao obrigatoria de e-mail no OmniMarket.

## Ambiente recomendado

- backend em execucao
- frontend em execucao
- base de dados configurada
- SMTP habilitado para envio real
- navegador atualizado
- acesso real a pelo menos uma caixa de e-mail

## Preparacao do e-mail de teste

- para os casos validos, use um e-mail real controlado pelo testador
- se o provedor aceitar alias, prefira algo como `SEUEMAIL+omni-comprador@gmail.com`
- se o provedor nao aceitar alias, use outra caixa real do time
- nao use dominios temporarios ou rotulados como teste, porque o backend bloqueia esse cadastro

## Dados sugeridos para teste

| Identificador | Perfil | E-mail sugerido | Observacao |
| --- | --- | --- | --- |
| `cad-comprador-valido` | Usuario/comprador | `SEUEMAIL+omni-comprador@gmail.com` | Deve receber o link de confirmacao |
| `cad-comprador-invalido` | Usuario/comprador | `comprador@mailinator.com` | Dominio temporario bloqueado |
| `cad-vendedor-valido` | Usuario/vendedor | `SEUEMAIL+omni-vendedor@gmail.com` | Deve receber o link de confirmacao |
| `cad-vendedor-invalido` | Usuario/vendedor | `vendedor@test.com.br` | Rotulo `test` bloqueado |

## CT-CAD-01 Cadastro de usuario como comprador valido

**Objetivo:** validar o cadastro de comprador com e-mail real, bloqueio de login antes da confirmacao e liberacao apos o clique no link.

**Pre-condicoes:** e-mail real disponivel para leitura e usuario ainda nao cadastrado.

**Massa sugerida:** `cad-comprador-valido`

**Passos:**

1. Acessar a tela `/cadastro`.
2. Selecionar `Comprador`.
3. Preencher `Nome completo`.
4. Preencher `Email` com um e-mail real acessivel pelo testador.
5. Preencher `Telefone`.
6. Preencher `CPF`.
7. Preencher `Data de nascimento`.
8. Preencher `Senha` e `Confirmacao de senha` com o mesmo valor.
9. Manter a secao `Endereco` recolhida ou preencher um endereco valido opcional.
10. Marcar o aceite do termo de uso.
11. Clicar em `Criar conta`.
12. Confirmar que a aplicacao redireciona para `/login`.
13. Tentar entrar com o e-mail e a senha antes de abrir o link recebido.
14. Validar que o login foi bloqueado.
15. Abrir a caixa de e-mail usada no cadastro.
16. Abrir a mensagem de confirmacao enviada pela plataforma.
17. Clicar no link de confirmacao.
18. Validar a abertura da tela `/confirmar-email`.
19. Voltar para `/login`.
20. Entrar novamente com o mesmo e-mail e senha.

**Resultado esperado:**

- o cadastro deve ser concluido com sucesso
- o sistema deve informar que o e-mail precisa ser confirmado antes do primeiro acesso
- antes da confirmacao, o login deve falhar com a mensagem `Confirme seu email antes de entrar. Use o link enviado para o endereco cadastrado.`
- a tela de confirmacao deve exibir sucesso
- apos a confirmacao, o login deve funcionar normalmente

## CT-CAD-02 Cadastro de usuario como comprador invalido

**Objetivo:** validar a rejeicao de cadastro com dominio de e-mail temporario.

**Pre-condicoes:** usuario ainda nao cadastrado.

**Massa sugerida:** `cad-comprador-invalido`

**Passos:**

1. Acessar a tela `/cadastro`.
2. Selecionar `Comprador`.
3. Preencher os campos obrigatorios com dados validos.
4. Informar `comprador@mailinator.com` no campo `Email`.
5. Marcar o aceite do termo de uso.
6. Clicar em `Criar conta`.

**Resultado esperado:**

- o cadastro nao deve ser concluido
- o frontend deve permanecer na tela de cadastro
- o sistema deve exibir a mensagem `Informe um email pessoal ou corporativo valido. Dominios de teste ou temporarios nao sao aceitos.`
- nenhum e-mail de confirmacao deve ser enviado

## CT-CAD-03 Cadastro de usuario como vendedor valido

**Objetivo:** validar o cadastro de vendedor com e-mail real e confirmar o comportamento atual da plataforma, em que a loja e criada apenas depois do primeiro login confirmado.

**Pre-condicoes:** e-mail real disponivel para leitura e usuario ainda nao cadastrado.

**Massa sugerida:** `cad-vendedor-valido`

**Passos:**

1. Acessar a tela `/cadastro`.
2. Selecionar `Vendedor`.
3. Preencher `Nome completo`.
4. Preencher `Email` com um e-mail real acessivel pelo testador.
5. Preencher `Telefone`.
6. Preencher `CPF do responsavel`.
7. Preencher `Data de nascimento`.
8. Preencher `Senha` e `Confirmacao de senha` com o mesmo valor.
9. Manter a secao `Endereco` recolhida ou preencher um endereco valido opcional.
10. Marcar o aceite do termo de uso.
11. Clicar em `Criar conta`.
12. Validar a mensagem final do cadastro.
13. Tentar entrar em `/login` antes de confirmar o e-mail.
14. Validar que o acesso ainda esta bloqueado.
15. Abrir a mensagem recebida na caixa de e-mail.
16. Clicar no link de confirmacao.
17. Validar a tela de sucesso em `/confirmar-email`.
18. Entrar novamente em `/login` com o mesmo e-mail e senha.

**Resultado esperado:**

- o cadastro deve ser concluido com sucesso
- o sistema deve orientar que, depois da confirmacao, a loja sera aberta pelo perfil
- antes da confirmacao, o login deve falhar com a mensagem `Confirme seu email antes de entrar. Use o link enviado para o endereco cadastrado.`
- apos a confirmacao, o login deve funcionar normalmente
- nenhuma loja deve ser criada automaticamente durante o cadastro

## CT-CAD-04 Cadastro de usuario como vendedor invalido

**Objetivo:** validar a rejeicao de cadastro de vendedor com dominio rotulado como teste.

**Pre-condicoes:** usuario ainda nao cadastrado.

**Massa sugerida:** `cad-vendedor-invalido`

**Passos:**

1. Acessar a tela `/cadastro`.
2. Selecionar `Vendedor`.
3. Preencher os campos obrigatorios com dados validos.
4. Informar `vendedor@test.com.br` no campo `Email`.
5. Marcar o aceite do termo de uso.
6. Clicar em `Criar conta`.

**Resultado esperado:**

- o cadastro nao deve ser concluido
- o frontend deve permanecer na tela de cadastro
- o sistema deve exibir a mensagem `Informe um email pessoal ou corporativo valido. Dominios de teste ou temporarios nao sao aceitos.`
- nenhum e-mail de confirmacao deve ser enviado

## Evidencias recomendadas

- captura da tela de cadastro preenchido como comprador
- captura da mensagem de bloqueio de login antes da confirmacao
- captura do e-mail recebido com o link de confirmacao
- captura da tela `Email confirmado`
- captura do login bem-sucedido apos a confirmacao
- captura da rejeicao de cadastro invalido

## Observacoes

- o formulario atual de cadastro exige `Data de nascimento`, mesmo que esse dado nao seja enviado na requisicao de registro
- o perfil `Vendedor` usa o mesmo formulario base do `Comprador`
- no comportamento atual, selecionar `Vendedor` nao cria loja diretamente no cadastro; a abertura da loja fica para o perfil apos o login confirmado
