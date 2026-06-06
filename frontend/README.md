# OmniMarket Web

Aplicacao web do OmniMarket, consumindo a API .NET via HTTP.

## Stack

- React 19
- TypeScript
- Vite 8
- TanStack Router
- Zustand
- Tailwind CSS

## Configuracao

1. Copie `.env.example` para `.env.local`.
2. Configure `VITE_API_BASE_URL` com a URL do backend local ou publicado.

## Comandos

```powershell
npm install
npm run dev
npm run build
npm run lint
```

## Estrutura principal

- `src/routes/`: definicoes de rota
- `src/pages/`: paginas por fluxo
- `src/Components/`: componentes reutilizaveis
- `src/Services/`: integracao com a API
- `src/store/` e `src/context/`: estado local

## Observacoes

- O fallback atual da API aponta para `https://omnimarket-api.azurewebsites.net`.
- A autenticacao do cliente usa `localStorage`.
- Ainda nao existe suite de testes automatizados no frontend.
