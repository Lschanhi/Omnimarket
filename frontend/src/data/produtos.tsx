import type { HomeProduct } from "../types/home";

export function createMockImage(label: string, colorA: string, colorB: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <circle cx="650" cy="140" r="110" fill="rgba(255,255,255,0.08)" />
      <circle cx="180" cy="470" r="150" fill="rgba(0,0,0,0.18)" />
      <text x="70" y="310" fill="#ffffff" font-family="Arial, sans-serif" font-size="56" font-weight="700">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const produtosMock: HomeProduct[] = [
  {
    id: 1,
    nome: "Smartphone Orion Pro 256GB com camera tripla",
    preco: 2499.9,
    avaliacao: 4.8,
    categoriaId: "eletronicos",
    categoriaNome: "Eletronicos",
    imagem: createMockImage("Orion Pro", "#f59e0b", "#111827"),
    imagens: [createMockImage("Orion Pro", "#f59e0b", "#111827")],
    destaque: "Frete gratis",
  },
  {
    id: 2,
    nome: "Jaqueta urban tech resistente a agua",
    preco: 289.9,
    avaliacao: 4.6,
    categoriaId: "roupas",
    categoriaNome: "Roupas",
    imagem: createMockImage("Urban Tech", "#334155", "#0f172a"),
    imagens: [createMockImage("Urban Tech", "#334155", "#0f172a")],
    destaque: "Mais vendido",
  },
  {
    id: 3,
    nome: "Console NovaPlay com controle sem fio",
    preco: 3599.0,
    avaliacao: 4.9,
    categoriaId: "games",
    categoriaNome: "Games",
    imagem: createMockImage("NovaPlay", "#1d4ed8", "#020617"),
    imagens: [createMockImage("NovaPlay", "#1d4ed8", "#020617")],
  },
];
