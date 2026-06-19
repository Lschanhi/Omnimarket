export type ProdutoAvaliacaoLeitura = {
  id: number;
  produtoId: number;
  nomeProduto: string;
  lojaId: number;
  nomeLoja: string;
  pedidoId: number;
  usuarioId: number;
  nomeComprador: string;
  notaProduto: number;
  notaLoja: number;
  titulo?: string | null;
  comentario?: string | null;
  compraVerificada: boolean;
  recomendaProduto: boolean;
  dtCriacao: string;
  dtAtualizacao?: string | null;
};

export type ProdutoAvaliacaoListagemResponse = {
  items: ProdutoAvaliacaoLeitura[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProdutoAvaliacaoCriacaoPayload = {
  pedidoId: number;
  notaProduto: number;
  notaLoja?: number;
  titulo?: string;
  comentario?: string;
  recomendaProduto: boolean;
};

export type ProdutoAvaliacaoAtualizacaoPayload = {
  notaProduto: number;
  notaLoja?: number;
  titulo?: string;
  comentario?: string;
  recomendaProduto: boolean;
};
