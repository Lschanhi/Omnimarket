# Plano de Teste

## 1. Objetivo

Planejar a validacao funcional do OmniMarket com foco nos fluxos de cadastro, criacao de loja, cadastro de produto, carrinho, checkout e pagamento com PIX demonstrativo.

## 2. Escopo

### Dentro do escopo

- cadastro de comprador
- cadastro de vendedor
- abertura de loja por usuario que ja era comprador
- cadastro e manutencao basica de produto
- adicao de um ou mais itens ao carrinho
- conclusao do checkout
- pagamento com PIX demonstrativo

### Fora do escopo

- integracao com meios de pagamento reais
- conciliacao financeira
- validacoes fiscais externas
- testes de carga e estresse

## 3. Itens a testar

- Tela de cadastro
- Perfil do usuario
- Modal de criacao de loja
- Modal de cadastro de produto
- Carrinho
- Checkout
- Tela de confirmacao do pedido
- Modal de PIX demonstrativo
- Tela de sucesso do pedido

## 4. Estrategia de teste

### Testes funcionais manuais

Execucao guiada dos roteiros descritos em `docs/MANUAL_DE_TESTE.md`.

### Testes de fumaca

Verificacao rapida de:

- abertura do frontend
- abertura do backend
- login
- navegação basica
- criacao e conclusao de pedido

### Testes de regressao focal

Conferencia dos pontos mais sensiveis:

- cadastro com campos opcionais recolhidos
- persistencia de endereco principal
- uso do mesmo usuario primeiro como comprador e depois como vendedor
- revisao do checkout para qualquer forma de pagamento
- fluxo demonstrativo de PIX

## 5. Ambiente de teste

### Aplicacao

- Frontend React/Tailwind em execucao local ou publicado
- Backend .NET em execucao local ou publicado

### Configuracao minima

- Navegador atualizado
- Banco de dados acessivel
- Variaveis de ambiente configuradas

### Comandos uteis

```bash
dotnet run --project backend/OmniMarket.API.csproj
npm --prefix frontend install
npm --prefix frontend run dev
```

## 6. Dados de teste

| Massa | Descricao | Finalidade |
| --- | --- | --- |
| `MT-01` | Comprador sem endereco | Validar endereco no checkout |
| `MT-02` | Comprador com endereco | Validar compra direta |
| `MT-03` | Vendedor com loja | Validar catalogo e venda |
| `MT-04` | Comprador que vai abrir loja | Validar migracao operacional |
| `MT-05` | Produto simples com estoque | Validar carrinho e pedido |
| `MT-06` | Dois produtos ativos | Validar carrinho com varios itens |

## 7. Criterios de entrada

- Backend compilando sem erro critico
- Frontend compilando sem erro critico
- Tela inicial acessivel
- Banco de dados com estrutura atualizada
- Massa de teste disponivel ou facilmente reproduzivel

## 8. Criterios de saida

- Todos os casos prioritarios executados
- Nenhum defeito bloqueador aberto nos fluxos principais
- Defeitos medios registrados com evidencia e plano de correcao
- Evidencias minimas coletadas para a apresentacao

## 9. Priorizacao dos cenarios

| ID | Cenario | Prioridade |
| --- | --- | --- |
| `P1` | Cadastro de comprador | Alta |
| `P2` | Cadastro de vendedor | Alta |
| `P3` | Comprador abrindo loja | Alta |
| `P4` | Cadastro de produto | Alta |
| `P5` | Adicao de item ao carrinho | Alta |
| `P6` | Carrinho com mais de um produto | Alta |
| `P7` | Checkout com endereco novo | Alta |
| `P8` | Revisao do pedido | Alta |
| `P9` | Pagamento PIX demonstrativo | Alta |

## 10. Riscos

- divergencia entre ambiente local e ambiente publicado
- massa de dados manual criada com inconsistencias
- dependencia de autenticacao para abrir alguns fluxos
- alteracoes recentes em checkout, endereco e perfil podem causar regressao

## 11. Entregaveis

- `docs/MANUAL_OPERACAO_APLICATIVO.md`
- `docs/MANUAL_DE_TESTE.md`
- `docs/PLANO_DE_TESTE.md`
- evidencias capturadas durante a execucao
- lista de defeitos encontrados, se houver

## 12. Referencias

- `README.md`
- `docs/QA_CHECKLIST.md`
- `docs/API.md`
- `docs/ARQUITETURA.md`
