# Plano de Teste

## 1. Objetivo

Planejar a validacao funcional do OmniMarket com foco no ciclo atual de onboarding:

- cadastro de conta
- confirmacao obrigatoria de e-mail
- liberacao do primeiro acesso para comprador e vendedor

## 2. Escopo

### Dentro do escopo deste ciclo

- cadastro de usuario como comprador
- cadastro de usuario como vendedor
- envio do e-mail de confirmacao apos o cadastro
- confirmacao da conta pelo link recebido no e-mail
- bloqueio de login antes da confirmacao
- liberacao do login apos a confirmacao
- rejeicao de cadastro com e-mail nao permitido

### Fora do escopo deste ciclo

- criacao de loja apos o login
- cadastro e manutencao de produto
- carrinho, checkout e pagamento
- fluxos administrativos
- upload de arquivos e imagens

## 3. Itens a testar

- tela de cadastro
- tela de login
- tela de confirmacao de e-mail
- endpoint `POST /api/usuario/registrar`
- endpoint `GET /api/auth/confirmar-email`
- endpoint `POST /api/auth/login`

## 4. Estrategia de teste

### Testes funcionais manuais

Execucao guiada dos roteiros descritos em `docs/MANUAL_DE_TESTE.md`.

### Testes de fumaca

Verificacao rapida de:

- abertura do frontend
- resposta do backend
- acesso as rotas `/cadastro`, `/login` e `/confirmar-email`
- envio do e-mail de confirmacao

### Testes de regressao focal

Conferencia dos pontos mais sensiveis:

- comprador e vendedor usam o mesmo formulario
- login deve falhar antes da confirmacao do e-mail
- login deve funcionar apos a confirmacao do e-mail
- dominios temporarios ou de teste devem ser rejeitados
- cadastro de vendedor nao deve criar loja automaticamente

## 5. Ambiente de teste

### Aplicacao

- frontend React/Tailwind em execucao local ou publicado
- backend .NET em execucao local ou publicado

### Configuracao minima

- navegador atualizado
- banco de dados acessivel e atualizado
- `SmtpEmail:Enabled=true`
- `SmtpEmail:Host`, `Port`, `Username`, `Password` e `FromEmail` configurados
- `EmailConfirmation:FrontendBaseUrl` apontando para a URL do frontend em teste
- pelo menos um e-mail real sob controle do testador para receber os links

### Comandos uteis

```bash
dotnet run --project backend/OmniMarket.API.csproj
npm --prefix frontend install
npm --prefix frontend run dev
```

## 6. Dados de teste

Atencao: para os cenarios validos, substitua `SEUEMAIL` por uma caixa real do time ou por um alias real acessivel pelo testador.

| Massa | Descricao | Dados principais | Finalidade |
| --- | --- | --- | --- |
| `MT-CAD-01` | Usuario/comprador valido | `SEUEMAIL+omni-comprador@gmail.com` | Validar cadastro, confirmacao por e-mail e primeiro login |
| `MT-CAD-02` | Comprador invalido | `comprador@mailinator.com` | Validar bloqueio de dominio temporario |
| `MT-CAD-03` | Usuario/vendedor valido | `SEUEMAIL+omni-vendedor@gmail.com` | Validar cadastro, confirmacao por e-mail e orientacao para criar loja depois |
| `MT-CAD-04` | Vendedor invalido | `vendedor@test.com.br` | Validar bloqueio de dominio rotulado como teste |

## 7. Criterios de entrada

- backend compilando sem erro critico
- frontend compilando sem erro critico
- tela inicial acessivel
- banco de dados com estrutura atualizada
- SMTP configurado para envio real
- massa de teste disponivel

## 8. Criterios de saida

- todos os casos prioritarios executados
- cadastro valido envia e-mail de confirmacao
- login sem confirmacao permanece bloqueado
- login apos confirmacao funciona
- casos invalidos retornam mensagem de erro coerente
- evidencias minimas coletadas para apresentacao

## 9. Priorizacao dos cenarios

| ID | Cenario | Prioridade |
| --- | --- | --- |
| `P1` | Cadastro de usuario como comprador com e-mail valido | Alta |
| `P2` | Tentativa de login antes da confirmacao do e-mail | Alta |
| `P3` | Cadastro de usuario como vendedor com e-mail valido | Alta |
| `P4` | Cadastro com e-mail temporario ou de teste | Alta |

## 10. Riscos

- SMTP desabilitado ou configurado com credenciais invalidas
- `FrontendBaseUrl` incorreta e link de confirmacao apontando para URL errada
- uso de e-mail sem acesso real pelo testador
- divergencia entre mensagem exibida no frontend e erro retornado pelo backend

## 11. Entregaveis

- `docs/PLANO_DE_TESTE.md`
- `docs/MANUAL_DE_TESTE.md`
- evidencias capturadas durante a execucao
- lista de defeitos encontrados, se houver

## 12. Referencias

- `backend/appsettings.Local.example.json`
- `backend/Controllers/Usuarios/UsuarioController.cs`
- `backend/Controllers/Usuarios/AuthController.cs`
- `backend/Services/AuthService.cs`
- `backend/Services/EmailConfirmationService.cs`
- `backend/Utils/ValidadorEmail.cs`
- `frontend/src/pages/Auth/CadastrePage.tsx`
- `frontend/src/pages/Auth/ConfirmarEmailPage.tsx`
