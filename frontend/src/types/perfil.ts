// Representa as abas disponiveis dentro da pagina de perfil.
export type PerfilTabId = "produtos" | "vendas" | "compras";
export type PerfilVisaoId = "comprador" | "loja";

export type PerfilInfoItemId = "email" | "telefone" | "endereco";
export type PerfilTabKey = PerfilTabId | PerfilVisaoId;

export interface UsuarioTelefonePerfil {
  id: number;
  numero: string;
  isPrincipal: boolean;
}

export interface UsuarioEnderecoPerfil {
  id: number;
  tipoLogradouro: string;
  tipoLogradouroDescricao?: string;
  nomeEndereco: string;
  numero: string;
  complemento?: string;
  cep: string;
  cidade: string;
  uf: string;
  isPrincipal: boolean;
  ativo: boolean;
}

// Define os dados basicos do usuario exibidos no topo da pagina.
export interface UsuarioPerfil {
  id: number;
  nome: string;
  primeiroNome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  telefones: UsuarioTelefonePerfil[];
  telefonePrincipalId?: number;
  endereco: string;
  enderecos: UsuarioEnderecoPerfil[];
  enderecoPrincipalId?: number;
  avatarUrl?: string;
  resumo?: string;
}

export interface PerfilInfoItem {
  key: PerfilInfoItemId;
  label: string;
  value: string;
}

export interface PerfilIdentityCardData {
  rotulo: string;
  nome: string;
  resumo: string;
  avatarUrl?: string;
  fotoHint: string;
  badge?: string;
  infoItems: PerfilInfoItem[];
  footerText: string;
}

// Define os indicadores principais exibidos no painel de estatisticas.
export interface UsuarioStatsData {
  avaliacaoMedia: number;
  seguidores: number;
  totalProdutos: number;
  totalVendas: number;
  totalCompras: number;
  faturamentoBruto: number;
  ticketMedio: number;
  totalComissaoMarketplace: number;
  totalLiquidoVendedor: number;
  quantidadePedidos: number;
}

export interface PerfilStatCardItem {
  key: string;
  label: string;
  value: string;
}

export type PerfilPedidoStatusFluxo =
  | "pendente"
  | "em-separacao"
  | "pronto"
  | "enviado"
  | "finalizado"
  | "cancelado";

export type PerfilFiltroStatusVendaId = "todos" | PerfilPedidoStatusFluxo;
export type PerfilFiltroStatusCompraId =
  | "compras"
  | "cancelado"
  | "devolucao"
  | "finalizado";

export interface PerfilVendaStatusItem {
  key: "pendente" | "em-separacao" | "pronto" | "enviado" | "finalizado";
  label: string;
  total: number;
  descricao: string;
}

export interface PerfilVendaStatusFiltroItem {
  key: PerfilFiltroStatusVendaId;
  label: string;
  total: number;
}

export interface PerfilCompraStatusFiltroItem {
  key: PerfilFiltroStatusCompraId;
  label: string;
  total: number;
  descricao: string;
}

export interface PerfilPedidoItem {
  id: number;
  produtoId: number;
  nomeProduto: string;
  skuProduto: string;
  lojaId: number;
  nomeLoja: string;
  quantidade: number;
  precoUnitario: string;
  valorTotal: string;
  descricao: string;
  imagemUrl?: string;
  imagens?: string[];
}

export interface PerfilPedidoDetalhe {
  pedidoId: number;
  vendaId?: number;
  contexto: "compra" | "venda";
  status: string;
  statusPedido?: string;
  statusVenda?: string | null;
  statusFluxoKey: PerfilPedidoStatusFluxo;
  tipoEntrega: string;
  dataPedido: string;
  observacao: string;
  enderecoEntrega: string;
  valorProdutos?: string;
  valorFrete?: string;
  valorTotal?: string;
  valorComissao?: string;
  valorLiquidoVendedor?: string;
  taxaFixaComissao?: string;
  percentualComissao?: string;
  subtotal: string;
  frete: string;
  total: string;
  valorTotalPedido?: string;
  pedidoMultiloja?: boolean;
  podeConfirmarRecebimento?: boolean;
  possuiSolicitacaoCancelamentoAtiva?: boolean;
  podeAceitar?: boolean;
  podeCancelar?: boolean;
  podeMarcarComoPronto?: boolean;
  podeMarcarComoEnviado?: boolean;
  nomeCliente?: string;
  emailCliente?: string;
  motivoCancelamento?: string;
  solicitacaoResumo?: {
    id: number;
    tipo: Exclude<PerfilFiltroStatusCompraId, "compras" | "finalizado">;
    motivo: string;
    status: string;
    dataCriacao: string;
    observacao?: string;
  } | null;
  itens: PerfilPedidoItem[];
}

// Representa um item exibido no grid das abas de conteudo.
export interface PerfilGridItem {
  id: string;
  titulo: string;
  subtitulo: string;
  valor: string;
  imagemUrl?: string;
  badge?: string;
  produtoId?: number;
  categoriaId?: string;
  categoriaNome?: string;
  precoNumero?: number;
  estoque?: number;
  disponivel?: boolean;
  descricao?: string;
  imagens?: string[];
  pedido?: PerfilPedidoDetalhe;
}

// Estrutura dos dados de cada aba do perfil.
export interface PerfilTabContent {
  titulo: string;
  descricao: string;
  vazioTitulo: string;
  vazioDescricao: string;
  itens: PerfilGridItem[];
}

// Define os estados de carregamento e erro usados na pagina.
export interface PerfilPageState {
  isUsuarioLoading: boolean;
  isConteudoLoading: boolean;
  usuarioError: string;
  conteudoError: string;
}
