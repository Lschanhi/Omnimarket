export type CartItemType = {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  lojaId?: number;
  imagem?: string;
  descricao?: string;
  categoria?: string;
  lojaNome?: string;
  estoqueDisponivel?: number;
};
