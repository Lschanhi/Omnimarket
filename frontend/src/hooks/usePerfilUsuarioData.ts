import { useEffect, useState } from "react";
import type {
  PerfilPedidoStatusFluxo,
  PerfilGridItem,
  PerfilPageState,
  PerfilTabId,
  PerfilVendaStatusItem,
  UsuarioEnderecoPerfil,
  UsuarioPerfil,
  UsuarioTelefonePerfil,
  UsuarioStatsData,
} from "../types/perfil";
import type { HomeProduct } from "../types/home";
import {
  getResumoFinanceiroVendedor,
  type ResumoFinanceiroVendedorResponse,
} from "../Services/financeiro/financeiroService";
import {
  AUTH_CHANGED_EVENT,
  getStoredUser,
  isAuthenticated,
  updateStoredUser,
} from "../Services/auth/session";
import { ApiError } from "../Services/http/apiClient";
import {
  criarImagemPlaceholder,
  listarProdutos,
  obterProdutoPorId,
} from "../Services/produtos/produtoService";
import { buscarPedido } from "../Services/pedidos/pedidoService";
import { listarEnderecos } from "../Services/user/enderecoService";
import {
  buscarPedidoDaMinhaLoja,
  listarTodosPedidosDaMinhaLoja,
  obterMinhaLoja,
  atualizarStatusPedidoDaMinhaLoja,
  type LojaGestaoApiResponse,
  type LojaAtualizarStatusVendaPermitido,
  type LojaPedidoLeituraApiResponse,
  type LojaPedidoStatusPedidoApi,
  type LojaPedidoStatusVendaApi,
} from "../Services/user/lojaService";
import { formatarTelefoneParaExibicao } from "../Services/user/telefoneService";
import {
  listarPedidosUsuario,
  obterMinhasMetricasLoja,
  obterPerfilUsuario,
  type LojaMetricasApiResponse,
  type PedidoLeituraApiResponse,
  type UsuarioPerfilApiResponse,
} from "../Services/user/usuarioService";

const INITIAL_STATE: PerfilPageState = {
  isUsuarioLoading: true,
  isConteudoLoading: true,
  usuarioError: "",
  conteudoError: "",
};

const INITIAL_STATS: UsuarioStatsData = {
  avaliacaoMedia: 0,
  seguidores: 0,
  totalProdutos: 0,
  totalVendas: 0,
  totalCompras: 0,
  faturamentoBruto: 0,
  ticketMedio: 0,
  totalComissaoMarketplace: 0,
  totalLiquidoVendedor: 0,
  quantidadePedidos: 0,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatarPercentual(valor: number) {
  return `${(valor * 100).toFixed(2)}%`;
}

const FLUXO_VENDAS_BASE: PerfilVendaStatusItem[] = [
  {
    key: "pendente",
    label: "Pendente",
    total: 0,
    descricao: "Vendas aprovadas aguardando o aceite operacional da loja.",
  },
  {
    key: "em-separacao",
    label: "Em separacao",
    total: 0,
    descricao: "Pedidos aceitos pela loja e em preparacao para expedicao ou retirada.",
  },
  {
    key: "pronto",
    label: "Pronto",
    total: 0,
    descricao: "Itens separados e liberados para expedicao ou retirada.",
  },
  {
    key: "enviado",
    label: "Enviado",
    total: 0,
    descricao: "Pedidos que ja sairam da loja e estao em transporte.",
  },
  {
    key: "finalizado",
    label: "Finalizado",
    total: 0,
    descricao: "Vendas concluidas com entrega ou recebimento confirmado.",
  },
];

function formatarEndereco(endereco: UsuarioPerfilApiResponse["enderecos"][number] | undefined) {
  if (!endereco) {
    return "";
  }

  return `${endereco.tipoLogradouro} ${endereco.nomeEndereco}, ${endereco.numero} - ${endereco.cidade}/${endereco.uf}`;
}

function normalizarTextoBase(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mapearTelefones(perfil: UsuarioPerfilApiResponse): UsuarioTelefonePerfil[] {
  return perfil.telefones.map((telefone) => ({
    id: telefone.id,
    numero: formatarTelefoneParaExibicao(telefone.numeroE164),
    isPrincipal: telefone.isPrincipal,
  }));
}

function mapearEnderecos(
  perfil: UsuarioPerfilApiResponse,
  enderecosDetalhados: Awaited<ReturnType<typeof listarEnderecos>>,
): UsuarioEnderecoPerfil[] {
  const enderecosDetalhadosPorId = new Map(
    enderecosDetalhados.map((endereco) => [endereco.id, endereco]),
  );

  return perfil.enderecos.map((endereco) => {
    const detalhe = enderecosDetalhadosPorId.get(endereco.id);

    return {
      id: endereco.id,
      tipoLogradouro: endereco.tipoLogradouro,
      tipoLogradouroDescricao: detalhe?.tipoLogradouro ?? endereco.tipoLogradouro,
      nomeEndereco: endereco.nomeEndereco,
      numero: endereco.numero,
      complemento: detalhe?.complemento ?? "",
      cep: endereco.cep,
      cidade: endereco.cidade,
      uf: endereco.uf,
      isPrincipal: endereco.isPrincipal,
      ativo: endereco.ativo,
    };
  });
}

function mapearUsuario(
  perfil: UsuarioPerfilApiResponse,
  telefones: UsuarioTelefonePerfil[],
  enderecos: UsuarioEnderecoPerfil[],
): UsuarioPerfil {
  const telefonePrincipal = telefones.find((telefone) => telefone.isPrincipal) ?? telefones[0];
  const enderecoPrincipal = enderecos.find((endereco) => endereco.isPrincipal) ?? enderecos[0];

  return {
    id: perfil.id,
    nome: `${perfil.nome} ${perfil.sobrenome}`.trim(),
    primeiroNome: perfil.nome,
    sobrenome: perfil.sobrenome,
    email: perfil.email,
    telefone: telefonePrincipal?.numero ?? "",
    telefones,
    telefonePrincipalId: telefonePrincipal?.id,
    endereco: formatarEndereco(
      enderecoPrincipal
        ? {
            id: enderecoPrincipal.id,
            tipoLogradouro: enderecoPrincipal.tipoLogradouro,
            nomeEndereco: enderecoPrincipal.nomeEndereco,
            numero: enderecoPrincipal.numero,
            cep: enderecoPrincipal.cep,
            cidade: enderecoPrincipal.cidade,
            uf: enderecoPrincipal.uf,
            isPrincipal: enderecoPrincipal.isPrincipal,
            ativo: enderecoPrincipal.ativo,
          }
        : undefined,
    ),
    enderecos,
    enderecoPrincipalId: enderecoPrincipal?.id,
    avatarUrl: perfil.avatarUrl ?? undefined,
  };
}

function isImagemPlaceholder(url: string | undefined) {
  return Boolean(url && /^data:image\/svg\+xml/i.test(url));
}

function produtoTemImagemUtil(produto: HomeProduct | undefined) {
  if (!produto) {
    return false;
  }

  const fontes = [produto.imagem, ...(produto.imagens ?? [])].filter(
    (fonte): fonte is string => typeof fonte === "string" && fonte.trim().length > 0,
  );

  return fontes.some((fonte) => !isImagemPlaceholder(fonte));
}

function combinarProdutos(base: HomeProduct[], extras: Array<HomeProduct | null>) {
  const produtosPorId = new Map(base.map((produto) => [produto.id, produto]));

  extras.forEach((produto) => {
    if (produto) {
      produtosPorId.set(produto.id, produto);
    }
  });

  return Array.from(produtosPorId.values());
}

function resolverChaveFluxoVenda(status: string) {
  const statusNormalizado = normalizarTextoBase(status.trim());
  const statusCompacto = statusNormalizado.replace(/[\s_-]+/g, "");

  if (!statusCompacto) {
    return null;
  }

  if (
    [
      "pendente",
      "aguardandopagamento",
      "aguardandoconfirmacao",
      "pago",
      "paga",
      "pagamentoconfirmado",
      "confirmado",
      "aprovado",
      "aprovada",
    ].includes(statusCompacto)
  ) {
    return "pendente" as const;
  }

  if (
    [
      "emseparacao",
      "separacao",
      "separando",
      "processando",
      "empreparo",
    ].includes(statusCompacto)
  ) {
    return "em-separacao" as const;
  }

  if (
    ["pronto", "prontoparaenvio", "prontopararetirada", "embalado"].includes(statusCompacto)
  ) {
    return "pronto" as const;
  }

  if (
    [
      "enviado",
      "enviada",
      "emtransito",
      "saiuparaentrega",
      "transportando",
      "despachado",
    ].includes(statusCompacto)
  ) {
    return "enviado" as const;
  }

  if (
    [
      "cancelado",
      "cancelada",
      "cancelamentosolicitado",
      "pedidocancelado",
      "canceladopelovendedor",
    ].includes(statusCompacto)
  ) {
    return "cancelado" as const;
  }

  if (
    ["finalizado", "entregue", "concluido", "concluida", "recebido", "retirado"].includes(
      statusCompacto,
    )
  ) {
    return "finalizado" as const;
  }

  return null;
}

function normalizarStatusFluxoVenda(status: string): PerfilPedidoStatusFluxo {
  return resolverChaveFluxoVenda(status) ?? "pendente";
}

function criarFluxoStatusVendas(metricas: LojaMetricasApiResponse | null): PerfilVendaStatusItem[] {
  const fluxo = FLUXO_VENDAS_BASE.map((item) => ({ ...item }));

  metricas?.pedidosPorStatus.forEach((itemStatus) => {
    const chave = resolverChaveFluxoVenda(itemStatus.status);

    if (!chave) {
      return;
    }

    const etapa = fluxo.find((item) => item.key === chave);

    if (etapa) {
      etapa.total += itemStatus.total;
    }
  });

  return fluxo;
}

function formatarDataPedido(dataPedido: string) {
  const data = new Date(dataPedido);

  if (Number.isNaN(data.getTime())) {
    return dataPedido;
  }

  return dateTimeFormatter.format(data);
}

function formatarEnderecoEntrega(
  pedido: {
    tipoLogradouroEntrega: string;
    nomeEnderecoEntrega: string;
    numeroEntrega: string;
    complementoEntrega?: string | null;
    cidadeEntrega: string;
    ufEntrega: string;
    cepEntrega: string;
  },
) {
  const partes = [
    `${pedido.tipoLogradouroEntrega} ${pedido.nomeEnderecoEntrega}, ${pedido.numeroEntrega}`,
    pedido.complementoEntrega?.trim() || "",
    `${pedido.cidadeEntrega}/${pedido.ufEntrega}`,
    `CEP ${pedido.cepEntrega}`,
  ].filter(Boolean);

  return partes.join(" - ");
}

function normalizarStatusFluxoPedidoLoja(
  statusPedido: LojaPedidoStatusPedidoApi,
  statusVenda?: LojaPedidoStatusVendaApi | null,
): PerfilPedidoStatusFluxo {
  switch (statusVenda) {
    case "Cancelada":
      return "cancelado";
    case "Concluida":
      return "finalizado";
    case "Enviada":
      return "enviado";
    case "Pronto":
      return "pronto";
    case "EmSeparacao":
      return "em-separacao";
    case "Pendente":
    case "Paga":
    case "Criada":
      return "pendente";
    default:
      break;
  }

  if (statusPedido === "Cancelado") {
    return "cancelado";
  }

  if (statusPedido === "Entregue") {
    return "finalizado";
  }

  if (statusPedido === "Enviado") {
    return "enviado";
  }

  return "pendente";
}

function criarRotuloStatusPedidoLoja(
  statusPedido: LojaPedidoStatusPedidoApi,
  statusVenda?: LojaPedidoStatusVendaApi | null,
) {
  switch (statusVenda) {
    case "Cancelada":
      return "Cancelado";
    case "Concluida":
      return "Finalizado";
    case "Enviada":
      return "Enviado";
    case "Pronto":
      return "Pronto";
    case "EmSeparacao":
      return "Em separacao";
    case "Pendente":
    case "Paga":
    case "Criada":
      return "Pendente";
    default:
      break;
  }

  if (statusPedido === "Cancelado") {
    return "Cancelado";
  }

  if (statusPedido === "Entregue") {
    return "Finalizado";
  }

  if (statusPedido === "Enviado") {
    return "Enviado";
  }

  return "Pendente";
}

function mapearItensPedido(
  pedido: PedidoLeituraApiResponse,
  produtosPorId: Map<number, HomeProduct>,
) {
  return pedido.itens.map((item) => {
    const produto = produtosPorId.get(item.produtoId);
    const imagens = produto?.imagens?.filter(Boolean) ?? [];
    const imagemPrincipal =
      produto?.imagem || imagens[0] || criarImagemPlaceholder(item.nomeProduto);
    const imagensDisponiveis = imagens.length > 0 ? imagens : [imagemPrincipal];

    return {
      id: item.id,
      produtoId: item.produtoId,
      nomeProduto: item.nomeProduto,
      skuProduto: item.skuProduto ?? "",
      lojaId: item.lojaId,
      nomeLoja: produto?.lojaNome?.trim() || item.nomeLoja,
      quantidade: item.quantidade,
      precoUnitario: currencyFormatter.format(Number(item.precoUnitario)),
      valorTotal: currencyFormatter.format(Number(item.valorTotal)),
      descricao:
        produto?.descricao?.trim() ||
        "Produto comprado neste pedido. A descricao detalhada ainda nao foi enviada pela API.",
      imagemUrl: imagemPrincipal,
      imagens: imagensDisponiveis,
    };
  });
}

function mapearCompras(
  pedidos: PedidoLeituraApiResponse[],
  produtos: HomeProduct[],
): PerfilGridItem[] {
  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

  return pedidos.map((pedido) => {
    const itensDetalhados = mapearItensPedido(pedido, produtosPorId);
    const itemPrincipal = itensDetalhados[0];
    const pedidoMultiloja = new Set(itensDetalhados.map((item) => item.lojaId).filter(Boolean)).size > 1;
    const resumoItens = itensDetalhados
      .slice(0, 2)
      .map((item) => `${item.quantidade}x ${item.nomeProduto}`)
      .join(" | ");
    const descricaoPedido =
      pedido.observacao?.trim() ||
      resumoItens ||
      "Abra o pedido para visualizar os itens, a entrega e as opcoes de acompanhamento.";
    const valorProdutos = Number(pedido.valorProdutos ?? pedido.valorTotalProdutos);
    const valorFrete = Number(pedido.valorFrete ?? 0);
    const valorTotal = Number(pedido.valorTotal ?? pedido.valorTotalPedido);
    const valorComissao = Number(pedido.valorComissao ?? 0);
    const valorLiquidoVendedor = Number(pedido.valorLiquidoVendedor ?? 0);
    const taxaFixaComissao = Number(pedido.taxaFixaComissao ?? 0);
    const percentualComissao = Number(pedido.percentualComissao ?? 0);

    return {
      id: `pedido-${pedido.id}`,
      titulo: `Pedido #${pedido.id}`,
      subtitulo: `${pedido.status} - ${pedido.tipoEntrega}`,
      valor: currencyFormatter.format(Number(pedido.valorTotalPedido)),
      imagemUrl: itemPrincipal?.imagemUrl,
      imagens: itemPrincipal?.imagens,
      badge: itemPrincipal?.nomeLoja ?? pedido.itens[0]?.nomeLoja ?? undefined,
      descricao: descricaoPedido,
      pedido: {
        pedidoId: pedido.id,
        contexto: "compra",
        status: pedido.status,
        statusFluxoKey: normalizarStatusFluxoVenda(pedido.status),
        tipoEntrega: pedido.tipoEntrega,
        dataPedido: formatarDataPedido(pedido.dataPedido),
        observacao:
          pedido.observacao?.trim() ||
          "Sem observacoes adicionais informadas para este pedido.",
        enderecoEntrega: formatarEnderecoEntrega(pedido),
        valorProdutos: currencyFormatter.format(valorProdutos),
        valorFrete: currencyFormatter.format(valorFrete),
        valorTotal: currencyFormatter.format(valorTotal),
        valorComissao: currencyFormatter.format(valorComissao),
        valorLiquidoVendedor: currencyFormatter.format(valorLiquidoVendedor),
        taxaFixaComissao: currencyFormatter.format(taxaFixaComissao),
        percentualComissao: formatarPercentual(percentualComissao),
        subtotal: currencyFormatter.format(valorProdutos),
        frete: currencyFormatter.format(valorFrete),
        total: currencyFormatter.format(valorTotal),
        valorTotalPedido: currencyFormatter.format(Number(pedido.valorTotalPedido ?? valorTotal)),
        pedidoMultiloja,
        podeCancelar: Boolean(pedido.podeCancelar),
        podeConfirmarRecebimento: Boolean(pedido.podeConfirmarRecebimento),
        possuiSolicitacaoCancelamentoAtiva: Boolean(
          pedido.possuiSolicitacaoCancelamentoAtiva,
        ),
        itens: itensDetalhados,
      },
    };
  });
}

function mapearItensPedidoLoja(
  pedido: LojaPedidoLeituraApiResponse,
  produtosPorId: Map<number, HomeProduct>,
) {
  return pedido.itens.map((item) => {
    const produto = produtosPorId.get(item.produtoId);
    const imagens = produto?.imagens?.filter(Boolean) ?? [];
    const imagemPrincipal =
      produto?.imagem || imagens[0] || criarImagemPlaceholder(item.nomeProduto);
    const imagensDisponiveis = imagens.length > 0 ? imagens : [imagemPrincipal];

    return {
      id: item.id,
      produtoId: item.produtoId,
      nomeProduto: item.nomeProduto,
      skuProduto: produto?.sku ?? "",
      lojaId: pedido.lojaId,
      nomeLoja: pedido.nomeLoja,
      quantidade: item.quantidade,
      precoUnitario: currencyFormatter.format(Number(item.precoUnitario)),
      valorTotal: currencyFormatter.format(Number(item.valorTotal)),
      descricao:
        produto?.descricao?.trim() ||
        "Produto vendido por esta loja. A descricao detalhada ainda nao foi enviada pela API.",
      imagemUrl: imagemPrincipal,
      imagens: imagensDisponiveis,
    };
  });
}

function mapearVendasLoja(
  pedidos: LojaPedidoLeituraApiResponse[],
  produtos: HomeProduct[],
): PerfilGridItem[] {
  if (pedidos.length === 0) {
    return [];
  }

  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
  return pedidos.map((pedido) => {
    const itensDetalhados = mapearItensPedidoLoja(pedido, produtosPorId);
    const itemPrincipal = itensDetalhados[0];
    const statusFluxoKey = normalizarStatusFluxoPedidoLoja(pedido.statusPedido, pedido.statusVenda);
    const statusRotulo = criarRotuloStatusPedidoLoja(pedido.statusPedido, pedido.statusVenda);
    const resumoItens = itensDetalhados
      .slice(0, 2)
      .map((item) => `${item.quantidade}x ${item.nomeProduto}`)
      .join(" | ");
    const descricaoPedido =
      pedido.observacao.trim() ||
      resumoItens ||
      "Abra o pedido para ver os itens, a entrega e as acoes do fluxo da venda.";
    const valorProdutos = Number(pedido.valorProdutos ?? pedido.valorTotalLoja);
    const valorFrete = Number(pedido.valorFrete ?? 0);
    const valorTotal = Number(pedido.valorTotal ?? valorProdutos + valorFrete);
    const valorComissao = Number(pedido.valorComissao ?? 0);
    const valorLiquidoVendedor = Number(pedido.valorLiquidoVendedor ?? valorProdutos);
    const taxaFixaComissao = Number(pedido.taxaFixaComissao ?? 0);
    const percentualComissao = Number(pedido.percentualComissao ?? 0);

    return {
      id: `venda-pedido-${pedido.pedidoId}`,
      titulo: `Pedido #${pedido.pedidoId}`,
      subtitulo: `${statusRotulo} - ${pedido.tipoEntrega}`,
      valor: currencyFormatter.format(Number(pedido.valorTotalLoja)),
      imagemUrl: itemPrincipal?.imagemUrl,
      imagens: itemPrincipal?.imagens,
      descricao: descricaoPedido,
      badge: pedido.quantidadeItens > 1 ? `${pedido.quantidadeItens} itens` : "1 item",
      pedido: {
        pedidoId: pedido.pedidoId,
        vendaId: pedido.vendaId ?? undefined,
        contexto: "venda",
        status: statusRotulo,
        statusPedido: pedido.statusPedido,
        statusVenda: pedido.statusVenda ?? null,
        statusFluxoKey,
        tipoEntrega: pedido.tipoEntrega,
        dataPedido: formatarDataPedido(pedido.dataPedido),
        observacao:
          pedido.observacao.trim() ||
          "Sem observacoes adicionais informadas para este pedido.",
        enderecoEntrega: formatarEnderecoEntrega(pedido),
        valorProdutos: currencyFormatter.format(valorProdutos),
        valorFrete: currencyFormatter.format(valorFrete),
        valorTotal: currencyFormatter.format(valorTotal),
        valorComissao: currencyFormatter.format(valorComissao),
        valorLiquidoVendedor: currencyFormatter.format(valorLiquidoVendedor),
        taxaFixaComissao: currencyFormatter.format(taxaFixaComissao),
        percentualComissao: formatarPercentual(percentualComissao),
        subtotal: currencyFormatter.format(valorProdutos),
        frete: currencyFormatter.format(valorFrete),
        total: currencyFormatter.format(valorTotal),
        valorTotalPedido: currencyFormatter.format(Number(pedido.valorTotalPedido)),
        pedidoMultiloja: pedido.pedidoMultiloja,
        possuiSolicitacaoCancelamentoAtiva: Boolean(
          pedido.possuiSolicitacaoCancelamentoAtiva,
        ),
        podeAceitar: pedido.podeAceitar,
        podeCancelar: pedido.podeCancelar,
        podeMarcarComoPronto: pedido.podeMarcarComoPronto,
        podeMarcarComoEnviado: pedido.podeMarcarComoEnviado,
        nomeCliente: pedido.nomeCliente,
        emailCliente: pedido.emailCliente,
        itens: itensDetalhados,
      },
    };
  });
}

function mapearStats(
  metricas: LojaMetricasApiResponse | null,
  resumoFinanceiro: ResumoFinanceiroVendedorResponse | null,
  totalCompras: number,
  totalProdutos: number,
): UsuarioStatsData {
  return {
    avaliacaoMedia: metricas?.mediaAvaliacao ?? 0,
    seguidores: 0,
    totalProdutos,
    totalVendas:
      metricas?.pedidosPorStatus.reduce((acumulador, item) => acumulador + item.total, 0) ?? 0,
    totalCompras,
    faturamentoBruto: Number(
      resumoFinanceiro?.totalVendidoBruto ?? metricas?.faturamentoBruto ?? 0,
    ),
    ticketMedio: Number(metricas?.ticketMedio ?? 0),
    totalComissaoMarketplace: Number(resumoFinanceiro?.totalComissaoMarketplace ?? 0),
    totalLiquidoVendedor: Number(resumoFinanceiro?.totalLiquidoVendedor ?? 0),
    quantidadePedidos: Number(resumoFinanceiro?.quantidadePedidos ?? 0),
  };
}

function sincronizarSessaoComPerfil(perfil: UsuarioPerfilApiResponse) {
  const usuarioSessao = getStoredUser();

  if (!usuarioSessao) {
    return;
  }

  const nomeCompleto = `${perfil.nome} ${perfil.sobrenome}`.trim();
  const avatarUrl = perfil.avatarUrl ?? null;

  if (
    usuarioSessao.nome === nomeCompleto &&
    usuarioSessao.email === perfil.email &&
    (usuarioSessao.avatarUrl ?? null) === avatarUrl
  ) {
    return;
  }

  updateStoredUser({
    ...usuarioSessao,
    nome: nomeCompleto,
    email: perfil.email,
    avatarUrl,
  });
}

async function carregarComFallback<T>(
  carregamento: Promise<T>,
  fallback: T,
  contexto: string,
) {
  try {
    return await carregamento;
  } catch (error) {
    console.warn(`[PerfilUsuario] Falha ao carregar ${contexto}.`, error);
    return fallback;
  }
}

export function usePerfilUsuarioData() {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loja, setLoja] = useState<LojaGestaoApiResponse | null>(null);
  const [produtosCatalogo, setProdutosCatalogo] = useState<HomeProduct[]>([]);
  const [stats, setStats] = useState<UsuarioStatsData>(INITIAL_STATS);
  const [fluxoVendas, setFluxoVendas] = useState<PerfilVendaStatusItem[]>(FLUXO_VENDAS_BASE);
  const [abaAtiva, setAbaAtiva] = useState<PerfilTabId>("produtos");
  const [tabItems, setTabItems] = useState<Record<PerfilTabId, PerfilGridItem[]>>({
    produtos: [],
    vendas: [],
    compras: [],
  });
  const [pageState, setPageState] = useState<PerfilPageState>(INITIAL_STATE);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleAuthChange = () => {
      setReloadSeed((currentSeed) => currentSeed + 1);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function carregarDados() {
      if (!isAuthenticated()) {
        setPageState({
          isUsuarioLoading: false,
          isConteudoLoading: false,
          usuarioError: "Faca login para visualizar seu perfil.",
          conteudoError: "",
        });
        setUsuario(null);
        setLoja(null);
        setProdutosCatalogo([]);
        setStats(INITIAL_STATS);
        setFluxoVendas(FLUXO_VENDAS_BASE);
        setTabItems({
          produtos: [],
          vendas: [],
          compras: [],
        });
        return;
      }

      setPageState({
        isUsuarioLoading: true,
        isConteudoLoading: true,
        usuarioError: "",
        conteudoError: "",
      });

      try {
        const perfil = await obterPerfilUsuario();

        if (!isMounted) {
          return;
        }

        const [pedidos, lojaAtual, metricas, resumoFinanceiro, produtos, enderecosDetalhados] =
          await Promise.all([
            carregarComFallback(listarPedidosUsuario(perfil.id), [], "os pedidos do usuario"),
            carregarComFallback(obterMinhaLoja(), null, "a loja do usuario"),
            carregarComFallback(obterMinhasMetricasLoja(), null, "as metricas da loja"),
            carregarComFallback(
              getResumoFinanceiroVendedor(),
              null,
              "o resumo financeiro da loja",
            ),
            carregarComFallback(listarProdutos(), [], "o catalogo publico"),
            carregarComFallback(
              listarEnderecos(perfil.id),
              [],
              "os enderecos detalhados do usuario",
            ),
          ]);

        if (!isMounted) {
          return;
        }

        const pedidosLoja = lojaAtual
          ? await carregarComFallback(
              listarTodosPedidosDaMinhaLoja().catch((error) => {
                if (error instanceof ApiError && error.status === 404) {
                  // Mantem o perfil carregando enquanto a API publicada ainda nao expuser a rota nova.
                  return [];
                }

                throw error;
              }),
              [],
              "os pedidos da loja",
            )
          : [];

        if (!isMounted) {
          return;
        }

        const idsProdutosPedidos = Array.from(
          new Set(
            pedidos.flatMap((pedido) => pedido.itens.map((item) => item.produtoId)).filter(Boolean),
          ),
        );
        const idsProdutosPedidosLoja = Array.from(
          new Set(
            pedidosLoja.flatMap((pedido) => pedido.itens.map((item) => item.produtoId)).filter(Boolean),
          ),
        );
        const idsProdutosMetricas = Array.from(
          new Set(
            metricas?.produtosMaisVendidosPorReceita
              .map((produto) => produto.produtoId)
              .filter(Boolean) ?? [],
          ),
        );
        const idsProdutosRelacionados = Array.from(
          new Set([...idsProdutosPedidos, ...idsProdutosPedidosLoja, ...idsProdutosMetricas]),
        );
        const produtosPedidosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
        const produtosDetalhadosPedidos = await Promise.all(
          idsProdutosRelacionados
            .filter((produtoId) => !produtoTemImagemUtil(produtosPedidosPorId.get(produtoId)))
            .map((produtoId) => obterProdutoPorId(produtoId).catch(() => null)),
        );

        if (!isMounted) {
          return;
        }

        const produtosEnriquecidosPedidos = combinarProdutos(produtos, produtosDetalhadosPedidos);
        setProdutosCatalogo(produtosEnriquecidosPedidos);

        const lojaId = lojaAtual?.id ?? metricas?.lojaId;
        const produtosDaLoja = lojaId
          ? produtosEnriquecidosPedidos
              .filter((produto) => produto.lojaId === lojaId && produto.disponivel !== false)
              .map((produto) => ({
                id: `produto-${produto.id}`,
                titulo: produto.nome,
                subtitulo: produto.categoriaNome,
                valor: currencyFormatter.format(produto.preco),
                imagemUrl: produto.imagem,
                badge: "Publicado",
                produtoId: produto.id,
                categoriaId: produto.categoriaId,
                categoriaNome: produto.categoriaNome,
                precoNumero: produto.preco,
                estoque: produto.estoque,
                disponivel: produto.disponivel ?? true,
                descricao: produto.descricao,
                imagens: produto.imagens,
              }))
          : [];
        const compras = mapearCompras(pedidos, produtosEnriquecidosPedidos);
        const vendas = mapearVendasLoja(pedidosLoja, produtosEnriquecidosPedidos);
        const telefones = mapearTelefones(perfil);
        const enderecos = mapearEnderecos(perfil, enderecosDetalhados);

        sincronizarSessaoComPerfil(perfil);
        setUsuario(mapearUsuario(perfil, telefones, enderecos));
        setLoja(lojaAtual);
        setStats(mapearStats(metricas, resumoFinanceiro, compras.length, produtosDaLoja.length));
        setFluxoVendas(criarFluxoStatusVendas(metricas));
        setTabItems({
          produtos: produtosDaLoja,
          vendas,
          compras,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os dados do perfil.";

        setPageState({
          isUsuarioLoading: false,
          isConteudoLoading: false,
          usuarioError: message,
          conteudoError: message,
        });
        return;
      }

      if (isMounted) {
        setPageState({
          isUsuarioLoading: false,
          isConteudoLoading: false,
          usuarioError: "",
          conteudoError: "",
        });
      }
    }

    void carregarDados();

    return () => {
      isMounted = false;
    };
  }, [reloadSeed]);

  function sincronizarProdutoLojaLocal(produto: PerfilGridItem) {
    let proximoTotalProdutos = tabItems.produtos.length;

    setTabItems((currentItems) => {
      const indiceProdutoAtual = currentItems.produtos.findIndex(
        (item) => item.produtoId === produto.produtoId,
      );

      if (produto.disponivel === false) {
        if (indiceProdutoAtual < 0) {
          proximoTotalProdutos = currentItems.produtos.length;
          return currentItems;
        }

        proximoTotalProdutos = currentItems.produtos.length - 1;
        return {
          ...currentItems,
          produtos: currentItems.produtos.filter((item) => item.produtoId !== produto.produtoId),
        };
      }

      if (indiceProdutoAtual < 0) {
        proximoTotalProdutos = currentItems.produtos.length + 1;
        return {
          ...currentItems,
          produtos: [produto, ...currentItems.produtos],
        };
      }

      const proximosProdutos = [...currentItems.produtos];
      proximosProdutos[indiceProdutoAtual] = produto;
      proximoTotalProdutos = proximosProdutos.length;

      return {
        ...currentItems,
        produtos: proximosProdutos,
      };
    });

    setStats((currentStats) =>
      currentStats.totalProdutos === proximoTotalProdutos
        ? currentStats
        : {
            ...currentStats,
            totalProdutos: proximoTotalProdutos,
          },
    );
  }

  function mapearPedidoVendaLoja(pedido: LojaPedidoLeituraApiResponse) {
    return mapearVendasLoja([pedido], produtosCatalogo)[0] ?? null;
  }

  function mapearPedidoCompra(pedido: PedidoLeituraApiResponse) {
    return mapearCompras([pedido], produtosCatalogo)[0] ?? null;
  }

  async function buscarDetalhePedidoCompra(pedidoId: number) {
    const pedido = await buscarPedido(pedidoId);
    return mapearPedidoCompra(pedido);
  }

  async function buscarDetalhePedidoVenda(pedidoId: number) {
    const pedido = await buscarPedidoDaMinhaLoja(pedidoId);
    return mapearPedidoVendaLoja(pedido);
  }

  async function atualizarPedidoVendaStatus(
    pedidoId: number,
    statusVenda: LojaAtualizarStatusVendaPermitido,
  ) {
    const resposta = await atualizarStatusPedidoDaMinhaLoja(pedidoId, { statusVenda });

    return {
      mensagem: resposta.mensagem,
      item: mapearPedidoVendaLoja(resposta.pedido),
    };
  }

  return {
    usuario,
    loja,
    temLoja: Boolean(loja),
    stats,
    fluxoVendas,
    abaAtiva,
    tabItems,
    ...pageState,
    setAbaAtiva,
    sincronizarProdutoLojaLocal,
    buscarDetalhePedidoCompra,
    buscarDetalhePedidoVenda,
    atualizarPedidoVendaStatus,
    recarregarDados: () => setReloadSeed((currentSeed) => currentSeed + 1),
  };
}
