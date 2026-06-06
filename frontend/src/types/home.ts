// Define a estrutura de uma categoria exibida na Home.
export type HomeCategory = {
  id: string;
  nome: string;
  icone: "smartphone" | "shirt" | "gamepad" | "sofa" | "headphones" | "watch";
};

// Define o formato de um produto exibido no catalogo.
export type HomeProduct = {
  id: number;
  nome: string;
  preco: number;
  avaliacao: number;
  categoriaId: string;
  categoriaNome: string;
  imagem: string;
  imagens: string[];
  destaque?: string;
  descricao?: string;
  sku?: string;
  estoque?: number;
  disponivel?: boolean;
  lojaId?: number;
  lojaNome?: string;
  lojaAvatarUrl?: string;
  slugLoja?: string;
  totalAvaliacoes?: number;
  totalVisualizacoes?: number;
};

export type HomeStore = {
  id: number;
  nome: string;
  avatarUrl?: string;
  descricao?: string;
  cidade?: string;
  uf?: string;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  totalProdutos: number;
  categorias: string[];
  totalVisualizacoes: number;
  pontuacao: number;
};
