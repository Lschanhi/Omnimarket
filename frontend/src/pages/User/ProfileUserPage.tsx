import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Plus,
  Store,
  Truck,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Spotlight } from "../../Components/home/SpotLight";
import { PageLayout } from "../../Components/PageLayout";
import { ProductGrid } from "../../Components/perfil/ProductGrid";
import { ProfileFeedback } from "../../Components/perfil/ProfileFeedback";
import { ProfileSection } from "../../Components/perfil/ProfileSection";
import { ProfileSkeleton } from "../../Components/perfil/ProfileSkeleton";
import { UserCard } from "../../Components/perfil/UserCard";
import { UserStats } from "../../Components/perfil/UserStats";
import { UserTabs } from "../../Components/perfil/UserTabs";
import { usePerfilUsuarioData } from "../../hooks/usePerfilUsuarioData";
import {
  baixarReciboPedidoPdf,
  cancelarPedido,
  cancelarSolicitacaoCancelamento,
  confirmarEntregaPedido,
  criarSolicitacaoCancelamento,
  listarSolicitacoesCancelamentoPedido,
  type CriarSolicitacaoCancelamentoPayload,
  type SolicitacaoCancelamentoLeituraApiResponse,
  type StatusSolicitacaoCancelamentoApi,
} from "../../Services/pedidos/pedidoService";
import {
  atualizarMinhaEntregaLoja,
  criarMinhaEntregaLoja,
  listarMinhasEntregasLoja,
  removerMinhaEntregaLoja,
  TIPOS_ENTREGA_OPTIONS,
  type LojaEntregaMutacaoPayload,
  type LojaEntregaOpcao,
} from "../../Services/produtos/lojaEntregaService";
import {
  buscarAvaliacaoProdutoDoPedido,
  criarAvaliacaoProduto,
  atualizarAvaliacaoProduto,
} from "../../Services/produtos/avaliacaoService";
import type { ProdutoAvaliacaoAtualizacaoPayload } from "../../types/avaliacao";
import {
  atualizarProduto,
  criarProduto,
  enviarMidiasProduto,
  listarMidiasProduto,
  removerCategoriaDaLoja,
  removerProduto,
  type ProdutoMutacaoPayload,
} from "../../Services/produtos/produtoService";
import { ApiError } from "../../Services/http/apiClient";
import {
  removeStoredProdutoImage,
  saveStoredProdutoImage,
} from "../../Services/produtos/produtoImageStorage";
import { getStoredUser, updateStoredUser } from "../../Services/auth/session";
import {
  criarEndereco,
  atualizarEndereco,
  listarTiposLogradouro,
  removerEndereco,
  TIPOS_LOGRADOURO_FALLBACK,
} from "../../Services/user/enderecoService";
import {
  atualizarStatusSolicitacaoCancelamentoDaMinhaLoja,
  criarMinhaLoja,
  atualizarMinhaLoja,
  listarTodasSolicitacoesCancelamentoDaMinhaLoja,
  type LojaMutacaoPayload,
  type LojaAtualizarStatusVendaPermitido,
  type TipoDocumentoFiscalLoja,
} from "../../Services/user/lojaService";
import {
  criarTelefone,
  removerTelefone,
  atualizarTelefone,
  normalizarTelefoneParaApi,
} from "../../Services/user/telefoneService";
import {
  atualizarFotoPerfil,
  atualizarPerfilUsuario,
  removerFotoPerfil,
} from "../../Services/user/usuarioService";
import type {
  PerfilCompraStatusFiltroItem,
  PerfilFiltroStatusCompraId,
  PerfilFiltroStatusVendaId,
  PerfilGridItem,
  PerfilPedidoDetalhe,
  PerfilPedidoStatusFluxo,
  PerfilTabContent,
  PerfilTabId,
  PerfilVendaStatusFiltroItem,
  PerfilVisaoId,
} from "../../types/perfil";
import { ModalAvatarPerfil } from "./perfilUsuario/ModalAvatarPerfil";
import { DialogoCancelarPedidoVenda } from "./perfilUsuario/DialogoCancelarPedidoVenda";
import { ModalEntregasLoja } from "./perfilUsuario/ModalEntregasLoja";
import { ModalLojaPerfil } from "./perfilUsuario/ModalLojaPerfil";
import { ModalPedidoCompra } from "./perfilUsuario/ModalPedidoCompra";
import { ModalPedidoVenda } from "./perfilUsuario/ModalPedidoVenda";
import { ModalPerfilUsuario } from "./perfilUsuario/ModalPerfilUsuario";
import { ModalProdutoLoja } from "./perfilUsuario/ModalProdutoLoja";
import { SecaoProdutosLoja } from "./perfilUsuario/SecaoProdutosLoja";
import { StatusComprasTabs } from "./perfilUsuario/StatusComprasTabs";
import { StatusVendasTabs } from "./perfilUsuario/StatusVendasTabs";
import type { CategoriaLojaOption, PerfilEnderecoFormState } from "./perfilUsuario/tipos";
import { useEstadoLocalPerfilUsuario } from "./perfilUsuario/useEstadoLocalPerfilUsuario";
import {
  ABAS_DE_CONTEUDO_POR_VISAO,
  ABAS_DE_VISAO,
  ENDERECO_FORM_INICIAL,
  LOJA_ENTREGA_FORM_INICIAL,
  MAX_AVATAR_FILE_SIZE,
  MAX_PRODUCT_IMAGE_FILE_SIZE,
  METADADOS_ABAS,
  TELEFONE_FORM_INICIAL,
  criarCardComprador,
  criarCardLoja,
  criarCategoriasDaLoja,
  criarEntregaLojaForm,
  criarMensagemSucessoExclusaoCategoria,
  deduplicarEnderecosParaFormulario,
  criarProdutoGridItem,
  criarProdutoForm,
  criarStatsComprador,
  criarStatsLoja,
  deduplicarTelefonesParaFormulario,
  enderecoTemConteudo,
  encontrarTelefoneDuplicado,
  lerArquivoComoDataUrl,
  mapearEnderecoParaFormulario,
  mapearTelefoneParaFormulario,
  normalizarCep,
  normalizarFreteParaApi,
  normalizarDocumentoFiscalParaInput,
  normalizarMoedaParaInput,
  normalizarPrazoEntregaParaApi,
  normalizarPrecoParaApi,
  normalizarPrincipalEnderecos,
  normalizarPrincipalTelefones,
  normalizarTelefoneParaInput,
  normalizarValorEnderecoFormulario,
  obterErroEnderecoInvalido,
  obterNomePadraoEntrega,
  obterMensagemErroLoja,
  ordenarEntregasLoja,
  resolverAvatarLoja,
  telefoneTemConteudo,
} from "./perfilUsuario/utilitarios";

const ROTULO_STATUS_VENDA: Record<PerfilPedidoStatusFluxo, string> = {
  pendente: "Pendente",
  "em-separacao": "Em separacao",
  pronto: "Pronto",
  enviado: "Enviado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const ROTULO_STATUS_COMPRA: Record<PerfilFiltroStatusCompraId, string> = {
  compras: "Compras",
  cancelado: "Cancelado",
  devolucao: "Devolucao",
  finalizado: "Finalizado",
};

type FiltroDisponibilidadeProdutoLoja = "todos" | "disponiveis" | "indisponiveis";

function formatarStatusSolicitacaoResumo(status: string) {
  switch (status) {
    case "EmAnalise":
      return "Em analise";
    case "Aprovada":
      return "Aprovada";
    case "Recusada":
      return "Recusada";
    case "Cancelada":
      return "Cancelada";
    case "Concluida":
      return "Concluida";
    case "Aberta":
    default:
      return "Aberta";
  }
}

function obterCpfUsuarioFormatado(cpf: string | undefined) {
  return cpf ? normalizarDocumentoFiscalParaInput(cpf, "1") : "";
}

function obterDataReferenciaSolicitacao(solicitacao: SolicitacaoCancelamentoLeituraApiResponse) {
  return (
    solicitacao.dataAtualizacao ??
    solicitacao.dataConclusao ??
    solicitacao.dataAnalise ??
    solicitacao.dataCriacao
  );
}

function obterSolicitacaoMaisRecente(
  solicitacoes: SolicitacaoCancelamentoLeituraApiResponse[],
) {
  return [...solicitacoes].sort((primeira, segunda) => {
    const dataPrimeira = new Date(obterDataReferenciaSolicitacao(primeira)).getTime();
    const dataSegunda = new Date(obterDataReferenciaSolicitacao(segunda)).getTime();

    return dataSegunda - dataPrimeira;
  })[0] ?? null;
}

function classificarTratativaCompra(
  solicitacao: SolicitacaoCancelamentoLeituraApiResponse | null,
): Exclude<PerfilFiltroStatusCompraId, "compras" | "finalizado"> | null {
  if (!solicitacao) {
    return null;
  }

  return solicitacao.tipoSolicitacao === "Devolucao" || solicitacao.tipoSolicitacao === "Troca"
    ? "devolucao"
    : "cancelado";
}

function enriquecerPedidoCompraComTratativa(
  item: PerfilGridItem,
  solicitacoesPorPedido: Record<number, SolicitacaoCancelamentoLeituraApiResponse[]>,
): PerfilGridItem {
  const pedido = item.pedido;

  if (!pedido) {
    return item;
  }

  const solicitacao = obterSolicitacaoMaisRecente(
    solicitacoesPorPedido[pedido.pedidoId] ?? [],
  );
  const tipoTratativa = classificarTratativaCompra(solicitacao);

  if (!solicitacao || !tipoTratativa) {
    return {
      ...item,
      pedido: {
        ...pedido,
        solicitacaoResumo: null,
      },
    };
  }

  return {
    ...item,
    subtitulo: `${item.subtitulo} | ${ROTULO_STATUS_COMPRA[tipoTratativa]} ${formatarStatusSolicitacaoResumo(solicitacao.status)}`,
    pedido: {
      ...pedido,
      solicitacaoResumo: {
        id: solicitacao.id,
        tipo: tipoTratativa,
        motivo: solicitacao.motivo,
        status: solicitacao.status,
        dataCriacao: solicitacao.dataCriacao,
        observacao: solicitacao.observacao,
      },
    },
  };
}

function solicitacaoCancelamentoEstaAtiva(
  solicitacao: SolicitacaoCancelamentoLeituraApiResponse | null,
) {
  return Boolean(
    solicitacao && ["Aberta", "EmAnalise", "Aprovada"].includes(solicitacao.status),
  );
}

function agruparSolicitacoesPorPedido(
  solicitacoes: SolicitacaoCancelamentoLeituraApiResponse[],
) {
  return solicitacoes.reduce<Record<number, SolicitacaoCancelamentoLeituraApiResponse[]>>(
    (acumulador, solicitacao) => {
      const grupoAtual = acumulador[solicitacao.pedidoId] ?? [];

      return {
        ...acumulador,
        [solicitacao.pedidoId]: [...grupoAtual, solicitacao],
      };
    },
    {},
  );
}

function enriquecerPedidoVendaComSolicitacao(
  item: PerfilGridItem,
  solicitacoesPorPedido: Record<number, SolicitacaoCancelamentoLeituraApiResponse[]>,
): PerfilGridItem {
  const pedido = item.pedido;

  if (!pedido) {
    return item;
  }

  const solicitacao = obterSolicitacaoMaisRecente(
    solicitacoesPorPedido[pedido.pedidoId] ?? [],
  );

  if (
    !pedido.possuiSolicitacaoCancelamentoAtiva &&
    !solicitacaoCancelamentoEstaAtiva(solicitacao)
  ) {
    return item;
  }

  const subtituloComSolicitacao = item.subtitulo.includes("Solicitacao")
    ? item.subtitulo
    : `${item.subtitulo} | Solicitacao ${solicitacao ? formatarStatusSolicitacaoResumo(solicitacao.status) : "aberta"}`;

  return {
    ...item,
    subtitulo: subtituloComSolicitacao,
  };
}

function obterFiltroStatusCompra(item: PerfilGridItem): PerfilFiltroStatusCompraId {
  const resumoSolicitacao = item.pedido?.solicitacaoResumo;
  const statusFluxo = item.pedido?.statusFluxoKey;

  if (resumoSolicitacao?.tipo === "devolucao") {
    return "devolucao";
  }

  if (statusFluxo === "cancelado" || resumoSolicitacao?.tipo === "cancelado") {
    return "cancelado";
  }

  if (statusFluxo === "finalizado") {
    return "finalizado";
  }

  return "compras";
}

function criarFiltrosStatusCompra(itens: PerfilGridItem[]): PerfilCompraStatusFiltroItem[] {
  const totais = itens.reduce(
    (acumulador, item) => {
      const filtro = obterFiltroStatusCompra(item);
      acumulador[filtro] += 1;

      return acumulador;
    },
    {
      compras: 0,
      cancelado: 0,
      devolucao: 0,
      finalizado: 0,
    },
  );

  return [
    {
      key: "compras",
      label: "Compras",
      total: totais.compras,
      descricao: "Mostra apenas os pedidos que ainda estao em andamento.",
    },
    {
      key: "cancelado",
      label: "Cancelado",
      total: totais.cancelado,
      descricao: "Pedidos cancelados ou com tratativa de cancelamento vinculada.",
    },
    {
      key: "devolucao",
      label: "Devolucao",
      total: totais.devolucao,
      descricao: "Pedidos com tratativa de devolucao ou troca vinculada.",
    },
    {
      key: "finalizado",
      label: "Finalizado",
      total: totais.finalizado,
      descricao: "Pedidos concluidos sem cancelamento, devolucao ou troca vinculados.",
    },
  ];
}

function criarFiltrosStatusVenda(itens: PerfilGridItem[]): PerfilVendaStatusFiltroItem[] {
  const totais = itens.reduce<Record<PerfilPedidoStatusFluxo, number>>(
    (acumulador, item) => {
      const statusKey = item.pedido?.statusFluxoKey ?? "pendente";

      acumulador[statusKey] += 1;

      return acumulador;
    },
    {
      pendente: 0,
      "em-separacao": 0,
      pronto: 0,
      enviado: 0,
      finalizado: 0,
      cancelado: 0,
    },
  );

  return [
    { key: "todos", label: "Todos", total: itens.length },
    { key: "pendente", label: "Pendente", total: totais.pendente },
    { key: "em-separacao", label: "Em separacao", total: totais["em-separacao"] },
    { key: "pronto", label: "Pronto", total: totais.pronto },
    { key: "enviado", label: "Enviado", total: totais.enviado },
    { key: "finalizado", label: "Finalizado", total: totais.finalizado },
    { key: "cancelado", label: "Cancelado", total: totais.cancelado },
  ];
}

function pedidoPodeReceberStatusOperacional(
  pedido: PerfilPedidoDetalhe,
  statusVenda: Exclude<LojaAtualizarStatusVendaPermitido, "Cancelada">,
) {
  if (statusVenda === "EmSeparacao") {
    return Boolean(pedido.podeAceitar);
  }

  if (statusVenda === "Pronto") {
    return Boolean(pedido.podeMarcarComoPronto);
  }

  return Boolean(pedido.podeMarcarComoEnviado);
}

function atualizarCardPedido(item: PerfilGridItem, itemAtualizado: PerfilGridItem): PerfilGridItem {
  if (item.pedido?.pedidoId !== itemAtualizado.pedido?.pedidoId) {
    return item;
  }

  return itemAtualizado;
}

async function enriquecerPedidoCompraComAvaliacoes(item: PerfilGridItem | null) {
  if (!item?.pedido) {
    return item;
  }

  const pedido = item.pedido;

  if (pedido.statusFluxoKey !== "finalizado" || pedido.itens.length === 0) {
    return {
      ...item,
      pedido: {
        ...pedido,
        itens: pedido.itens.map((itemPedido) => ({
          ...itemPedido,
          avaliacaoAtual: itemPedido.avaliacaoAtual ?? null,
        })),
      },
    };
  }

  const avaliacoesPorItem = await Promise.all(
    pedido.itens.map(async (itemPedido) => {
      try {
        const avaliacaoAtual = await buscarAvaliacaoProdutoDoPedido(
          itemPedido.produtoId,
          pedido.pedidoId,
        );

        return [itemPedido.id, avaliacaoAtual] as const;
      } catch (error) {
        console.warn("[PerfilUsuario] Falha ao carregar a avaliacao do item.", error);
        return [itemPedido.id, null] as const;
      }
    }),
  );

  const mapaAvaliacoes = new Map(avaliacoesPorItem);

  return {
    ...item,
    pedido: {
      ...pedido,
      itens: pedido.itens.map((itemPedido) => ({
        ...itemPedido,
        avaliacaoAtual: mapaAvaliacoes.get(itemPedido.id) ?? null,
      })),
    },
  };
}

function baixarBlobComoArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = nomeArquivo;
  anchor.rel = "noopener";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function avatarEhDataUrl(avatar: string) {
  return /^data:image\//i.test(avatar.trim());
}

function criarPayloadAtualizacaoFotoLoja(
  loja: {
    nomeFantasia: string;
    tipoDocumentoFiscal: TipoDocumentoFiscalLoja;
    documentoFiscal: string;
    descricao?: string | null;
    emailContato?: string | null;
    ativa: boolean;
  },
  fotoPerfilDataUrl?: string,
  fotoPerfilNomeArquivo?: string,
) {
  return {
    nomeFantasia: loja.nomeFantasia,
    tipoDocumentoFiscal: loja.tipoDocumentoFiscal,
    documentoFiscal: loja.documentoFiscal,
    descricao: loja.descricao ?? undefined,
    emailContato: loja.emailContato ?? undefined,
    fotoPerfilDataUrl,
    fotoPerfilNomeArquivo,
    usarEnderecoUsuario: false,
    usarTelefoneUsuario: false,
    ativa: loja.ativa,
  } satisfies LojaMutacaoPayload;
}

export function PerfilUsuarioPage() {
  // Consome toda a logica do perfil em um hook separado da interface.
  const {
    usuario,
    loja,
    temLoja,
    stats,
    abaAtiva,
    tabItems,
    isUsuarioLoading,
    isConteudoLoading,
    usuarioError,
    conteudoError,
    setAbaAtiva,
    sincronizarProdutoLojaLocal,
    buscarDetalhePedidoCompra,
    buscarDetalhePedidoVenda,
    atualizarPedidoVendaStatus,
    recarregarDados,
  } = usePerfilUsuarioData();
  const {
    avatarDestino,
    avatarErroAcao,
    avatarLojaUrl,
    avatarNomeArquivo,
    avatarPreview,
    categoriaLojaAtiva,
    categoriaLojaModoExclusao,
    categoriaLojaPendenteExclusao,
    categoriaLojaRemovendoId,
    enderecosForm,
    enderecosRemovidos,
    entregaErroAcao,
    entregaLojaForm,
    entregaRemovendoId,
    entregasLoja,
    fecharModalLocal,
    isCarregandoEntregas,
    isRemovendoProduto,
    isSalvandoAvatar,
    isSalvandoEntrega,
    isSalvandoLoja,
    isSalvandoPerfil,
    isSalvandoProduto,
    lojaErroAcao,
    lojaFeedback,
    lojaForm,
    modalAberto,
    novoEnderecoForm,
    novoTelefoneForm,
    perfilErroAcao,
    perfilForm,
    produtoConfirmandoExclusao,
    produtoErroAcao,
    produtoForm,
    produtoImagemArquivo,
    setAvatarDestino,
    setAvatarErroAcao,
    setAvatarLojaUrl,
    setAvatarNomeArquivo,
    setAvatarPreview,
    setCategoriaLojaAtiva,
    setCategoriaLojaModoExclusao,
    setCategoriaLojaPendenteExclusao,
    setCategoriaLojaRemovendoId,
    setEnderecosForm,
    setEnderecosRemovidos,
    setEntregaErroAcao,
    setEntregaLojaForm,
    setEntregaRemovendoId,
    setEntregasLoja,
    setIsCarregandoEntregas,
    setIsRemovendoProduto,
    setIsSalvandoAvatar,
    setIsSalvandoEntrega,
    setIsSalvandoLoja,
    setIsSalvandoPerfil,
    setIsSalvandoProduto,
    setLojaErroAcao,
    setLojaFeedback,
    setLojaForm,
    setModalAberto,
    setNovoEnderecoForm,
    setNovoTelefoneForm,
    setPerfilErroAcao,
    setPerfilForm,
    setProdutoConfirmandoExclusao,
    setProdutoErroAcao,
    setProdutoForm,
    setProdutoImagemArquivo,
    setTelefonesForm,
    setTelefonesRemovidos,
    setTiposLogradouro,
    setVisaoAtiva,
    telefonesForm,
    telefonesRemovidos,
    tiposLogradouro,
    visaoAtiva,
  } = useEstadoLocalPerfilUsuario();

  const podeGerenciarLoja = Boolean(usuario?.enderecoPrincipalId && usuario?.telefonePrincipalId);
  const produtosDaLoja = tabItems.produtos;
  const visoesDisponiveis = temLoja
    ? ABAS_DE_VISAO
    : ABAS_DE_VISAO.filter((visao) => visao.id !== "loja");
  const abasDisponiveis = ABAS_DE_CONTEUDO_POR_VISAO[visaoAtiva];
  const abaAtivaResolvida = abasDisponiveis.some((aba) => aba.id === abaAtiva)
    ? (abaAtiva as PerfilTabId)
    : (abasDisponiveis[0]?.id as PerfilTabId);
  const isStoreProductsTab = visaoAtiva === "loja" && abaAtivaResolvida === "produtos";
  const isStoreSalesTab = visaoAtiva === "loja" && abaAtivaResolvida === "vendas";
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PerfilPedidoDetalhe | null>(null);
  const [pedidosCompraLocais, setPedidosCompraLocais] = useState<PerfilGridItem[]>([]);
  const [pedidosVendaLocais, setPedidosVendaLocais] = useState<PerfilGridItem[]>([]);
  const [solicitacoesPedidoCompra, setSolicitacoesPedidoCompra] = useState<
    SolicitacaoCancelamentoLeituraApiResponse[]
  >([]);
  const [solicitacoesPedidoVenda, setSolicitacoesPedidoVenda] = useState<
    SolicitacaoCancelamentoLeituraApiResponse[]
  >([]);
  const [solicitacoesPorPedidoCompra, setSolicitacoesPorPedidoCompra] = useState<
    Record<number, SolicitacaoCancelamentoLeituraApiResponse[]>
  >({});
  const [solicitacoesPorPedidoVenda, setSolicitacoesPorPedidoVenda] = useState<
    Record<number, SolicitacaoCancelamentoLeituraApiResponse[]>
  >({});
  const [filtroStatusCompraAtivo, setFiltroStatusCompraAtivo] =
    useState<PerfilFiltroStatusCompraId>("compras");
  const [filtroStatusVendaAtivo, setFiltroStatusVendaAtivo] =
    useState<PerfilFiltroStatusVendaId>("todos");
  const [filtroDisponibilidadeProdutoLojaAtivo, setFiltroDisponibilidadeProdutoLojaAtivo] =
    useState<FiltroDisponibilidadeProdutoLoja>("todos");
  const [isCarregandoResumoCompras, setIsCarregandoResumoCompras] = useState(false);
  const [isCarregandoPedidoCompra, setIsCarregandoPedidoCompra] = useState(false);
  const [isCarregandoSolicitacoesPedidoCompra, setIsCarregandoSolicitacoesPedidoCompra] =
    useState(false);
  const [isCarregandoSolicitacoesPedidoVenda, setIsCarregandoSolicitacoesPedidoVenda] =
    useState(false);
  const [isConfirmandoRecebimentoPedidoCompra, setIsConfirmandoRecebimentoPedidoCompra] =
    useState(false);
  const [isBaixandoReciboPedidoCompra, setIsBaixandoReciboPedidoCompra] = useState(false);
  const [isCancelandoPedidoCompra, setIsCancelandoPedidoCompra] = useState(false);
  const [isProcessandoSolicitacaoPedidoCompra, setIsProcessandoSolicitacaoPedidoCompra] =
    useState(false);
  const [produtoIdAvaliacaoEmProcesso, setProdutoIdAvaliacaoEmProcesso] = useState<number | null>(
    null,
  );
  const [isCarregandoPedidoVenda, setIsCarregandoPedidoVenda] = useState(false);
  const [isAtualizandoPedidoVenda, setIsAtualizandoPedidoVenda] = useState(false);
  const [isDialogoCancelamentoVendaAberto, setIsDialogoCancelamentoVendaAberto] = useState(false);
  const isBuyerOrdersTab = visaoAtiva === "comprador" && abaAtivaResolvida === "compras";
  const totalProdutosDisponiveis = produtosDaLoja.filter((item) => item.disponivel !== false).length;
  const totalProdutosIndisponiveis = produtosDaLoja.filter((item) => item.disponivel === false).length;
  const produtosDaLojaFiltradosPorStatus =
    filtroDisponibilidadeProdutoLojaAtivo === "disponiveis"
      ? produtosDaLoja.filter((item) => item.disponivel !== false)
      : filtroDisponibilidadeProdutoLojaAtivo === "indisponiveis"
        ? produtosDaLoja.filter((item) => item.disponivel === false)
        : produtosDaLoja;
  const categoriasDaLoja = criarCategoriasDaLoja(produtosDaLojaFiltradosPorStatus);
  const tabContent: PerfilTabContent = {
    ...METADADOS_ABAS[abaAtivaResolvida],
    itens: tabItems[abaAtivaResolvida],
  };
  const pedidosCompraEnriquecidos = pedidosCompraLocais.map((item) =>
    enriquecerPedidoCompraComTratativa(item, solicitacoesPorPedidoCompra),
  );
  const pedidosVendaEnriquecidos = pedidosVendaLocais.map((item) =>
    enriquecerPedidoVendaComSolicitacao(item, solicitacoesPorPedidoVenda),
  );
  const filtrosStatusCompra = criarFiltrosStatusCompra(pedidosCompraEnriquecidos);
  const filtrosStatusVenda = criarFiltrosStatusVenda(pedidosVendaEnriquecidos);
  const itensExibidos =
    isStoreProductsTab && categoriaLojaAtiva !== "todas"
      ? produtosDaLojaFiltradosPorStatus.filter((item) => item.categoriaId === categoriaLojaAtiva)
      : isStoreProductsTab
        ? produtosDaLojaFiltradosPorStatus
      : isStoreSalesTab
        ? pedidosVendaEnriquecidos.filter((item) => {
            if (filtroStatusVendaAtivo === "todos") {
              return true;
            }

            return item.pedido?.statusFluxoKey === filtroStatusVendaAtivo;
          })
        : isBuyerOrdersTab
          ? pedidosCompraEnriquecidos.filter(
              (item) => obterFiltroStatusCompra(item) === filtroStatusCompraAtivo,
            )
          : tabContent.itens;
  const estaFiltrandoCategoria = isStoreProductsTab && categoriaLojaAtiva !== "todas";
  const estaFiltrandoDisponibilidadeLoja =
    isStoreProductsTab && filtroDisponibilidadeProdutoLojaAtivo !== "todos";
  const estaFiltrandoStatusCompra = isBuyerOrdersTab;
  const estaFiltrandoStatusVenda = isStoreSalesTab && filtroStatusVendaAtivo !== "todos";
  const cardAtivo =
    visaoAtiva === "loja"
      ? criarCardLoja(loja, usuario, avatarLojaUrl)
      : criarCardComprador(usuario, podeGerenciarLoja);
  const statsAtivos =
    visaoAtiva === "loja" ? criarStatsLoja(stats) : criarStatsComprador(usuario, stats);
  const heroBadge = visaoAtiva === "loja" ? "Central da loja" : "Central do perfil";
  const heroTitulo = visaoAtiva === "loja" ? loja?.nomeFantasia || "Minha loja" : "Meu perfil";
  const heroDescricao =
    visaoAtiva === "loja"
      ? loja?.descricao?.trim() ||
        "Acompanhe a identidade pública da loja, os indicadores e os itens da vitrine em um painel separado do perfil de comprador."
      : "Acompanhe seus dados de comprador, edite informações pessoais e consulte o histórico de compras em um painel separado da loja.";
  const editandoFotoLoja = avatarDestino === "loja";
  const tituloModalAvatar = editandoFotoLoja ? "Foto da loja" : "Foto do perfil";
  const descricaoModalAvatar = editandoFotoLoja
    ? "Escolha uma imagem do seu computador para representar a loja separadamente do perfil neste navegador."
    : "Escolha uma imagem do seu computador para usar como foto do perfil neste navegador.";
  const altPreviewAvatar = editandoFotoLoja
    ? "Preview da foto da loja"
    : "Preview da foto do perfil";
  const labelRemoverAvatar = editandoFotoLoja ? "Remover foto da loja" : "Remover foto";
  const labelSalvarAvatar = editandoFotoLoja ? "Salvar foto da loja" : "Salvar foto";
  const tituloModalProduto = produtoForm.id ? "Editar produto" : "Adicionar produto";
  const descricaoModalProduto = produtoForm.id
    ? "Atualize os dados do produto selecionado sem sair do painel da loja."
    : "Cadastre um novo produto para publicá-lo na vitrine da loja.";
  const isProcessandoProduto = isSalvandoProduto || isRemovendoProduto;
  const entregaEmEdicao = Boolean(entregaLojaForm.id);
  const tipoEntregaAtualId = Number(entregaLojaForm.tipoEntregaId || 1);
  const tipoEntregaAtualEhRetirada = tipoEntregaAtualId === 1;
  const tituloModalEntregas = "Opcoes de entrega";
  const descricaoModalEntregas =
    "Cadastre, ajuste ou remova as opcoes de entrega e os valores de frete da sua loja.";

  useEffect(() => {
    if (!temLoja && visaoAtiva === "loja") {
      setVisaoAtiva("comprador");
    }
  }, [temLoja, setVisaoAtiva, visaoAtiva]);

  useEffect(() => {
    if (!abasDisponiveis.some((aba) => aba.id === abaAtiva)) {
      setAbaAtiva(abasDisponiveis[0]?.id as PerfilTabId);
    }
  }, [abaAtiva, abasDisponiveis, setAbaAtiva]);

  useEffect(() => {
    setPedidosCompraLocais(tabItems.compras);
  }, [tabItems.compras]);

  useEffect(() => {
    setPedidosVendaLocais(tabItems.vendas);
  }, [tabItems.vendas]);

  useEffect(() => {
    if (!isBuyerOrdersTab) {
      setFiltroStatusCompraAtivo("compras");
      return;
    }

    const pedidosComResumo = tabItems.compras.filter((item) => item.pedido?.pedidoId);

    if (pedidosComResumo.length === 0) {
      setSolicitacoesPorPedidoCompra({});
      setIsCarregandoResumoCompras(false);
      return;
    }

    let isMounted = true;

    setIsCarregandoResumoCompras(true);

    void Promise.all(
      pedidosComResumo.map(async (item) => {
        const pedidoId = item.pedido!.pedidoId;
        const solicitacoes = await listarSolicitacoesCancelamentoPedido(pedidoId).catch(
          () => [],
        );

        return [pedidoId, solicitacoes] as const;
      }),
    )
      .then((resultados) => {
        if (!isMounted) {
          return;
        }

        setSolicitacoesPorPedidoCompra(
          Object.fromEntries(resultados) as Record<
            number,
            SolicitacaoCancelamentoLeituraApiResponse[]
          >,
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsCarregandoResumoCompras(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isBuyerOrdersTab, tabItems.compras]);

  useEffect(() => {
    if (!isStoreSalesTab) {
      setSolicitacoesPedidoVenda([]);
      setSolicitacoesPorPedidoVenda({});
      setIsCarregandoSolicitacoesPedidoVenda(false);
      return;
    }

    let isMounted = true;

    setIsCarregandoSolicitacoesPedidoVenda(true);

    void listarTodasSolicitacoesCancelamentoDaMinhaLoja()
      .then((solicitacoes) => {
        if (!isMounted) {
          return;
        }

        const agrupadas = agruparSolicitacoesPorPedido(solicitacoes);
        setSolicitacoesPorPedidoVenda(agrupadas);

        if (pedidoSelecionado?.contexto === "venda") {
          setSolicitacoesPedidoVenda(agrupadas[pedidoSelecionado.pedidoId] ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSolicitacoesPorPedidoVenda({});
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCarregandoSolicitacoesPedidoVenda(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isStoreSalesTab, tabItems.vendas, pedidoSelecionado?.contexto, pedidoSelecionado?.pedidoId]);

  useEffect(() => {
    if (!isStoreSalesTab) {
      setFiltroStatusVendaAtivo("todos");
      setIsDialogoCancelamentoVendaAberto(false);
    }
  }, [isStoreSalesTab]);

  useEffect(() => {
    if (!isStoreProductsTab) {
      setCategoriaLojaAtiva("todas");
      setCategoriaLojaModoExclusao(false);
      setCategoriaLojaPendenteExclusao(null);
      setFiltroDisponibilidadeProdutoLojaAtivo("todos");
      return;
    }

    if (
      categoriaLojaAtiva !== "todas" &&
      !categoriasDaLoja.some((categoria) => categoria.id === categoriaLojaAtiva)
    ) {
      setCategoriaLojaAtiva("todas");
    }
  }, [
    categoriaLojaAtiva,
    categoriasDaLoja,
    filtroDisponibilidadeProdutoLojaAtivo,
    isStoreProductsTab,
    setCategoriaLojaAtiva,
    setCategoriaLojaModoExclusao,
    setCategoriaLojaPendenteExclusao,
  ]);

  useEffect(() => {
    if (
      categoriaLojaPendenteExclusao &&
      !categoriasDaLoja.some((categoria) => categoria.id === categoriaLojaPendenteExclusao.id)
    ) {
      setCategoriaLojaPendenteExclusao(null);
    }
  }, [categoriaLojaPendenteExclusao, categoriasDaLoja, setCategoriaLojaPendenteExclusao]);

  useEffect(() => {
    setAvatarLojaUrl(resolverAvatarLoja(loja));
  }, [loja, setAvatarLojaUrl]);

  useEffect(() => {
    if (pedidoSelecionado?.contexto !== "compra") {
      return;
    }

    const pedidoAtualizado = pedidosCompraLocais.find(
      (item) => item.pedido?.pedidoId === pedidoSelecionado.pedidoId,
    )?.pedido;

    if (pedidoAtualizado) {
      setPedidoSelecionado(pedidoAtualizado);
    }
  }, [pedidoSelecionado, pedidosCompraLocais]);

  useEffect(() => {
    if (pedidoSelecionado?.contexto !== "venda") {
      return;
    }

    const pedidoAtualizado = pedidosVendaLocais.find(
      (item) => item.pedido?.pedidoId === pedidoSelecionado.pedidoId,
    )?.pedido;

    if (pedidoAtualizado) {
      setPedidoSelecionado(pedidoAtualizado);
    }
  }, [pedidoSelecionado, pedidosVendaLocais]);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const usuarioId = usuario.id;
    let isMounted = true;

    async function carregarTiposLogradouro() {
      try {
        const tipos = await listarTiposLogradouro(usuarioId);

        if (isMounted && tipos.length > 0) {
          setTiposLogradouro(tipos);
        }
      } catch {
        if (isMounted) {
          setTiposLogradouro(TIPOS_LOGRADOURO_FALLBACK);
        }
      }
    }

    void carregarTiposLogradouro();

    return () => {
      isMounted = false;
    };
  }, [setTiposLogradouro, usuario]);

  function fecharModal() {
    setIsDialogoCancelamentoVendaAberto(false);
    setIsCarregandoPedidoCompra(false);
    setIsCarregandoSolicitacoesPedidoCompra(false);
    setIsConfirmandoRecebimentoPedidoCompra(false);
    setIsProcessandoSolicitacaoPedidoCompra(false);
    setIsCarregandoPedidoVenda(false);
    setIsCarregandoSolicitacoesPedidoVenda(false);
    setIsAtualizandoPedidoVenda(false);
    setSolicitacoesPedidoCompra([]);
    setSolicitacoesPedidoVenda([]);
    setPedidoSelecionado(null);
    fecharModalLocal();
  }

  function abrirModalAvatar() {
    if (!usuario) {
      return;
    }

    const editandoFotoLoja = visaoAtiva === "loja" && Boolean(loja);

    setAvatarErroAcao("");
    setAvatarDestino(editandoFotoLoja ? "loja" : "usuario");
    setAvatarPreview(editandoFotoLoja ? avatarLojaUrl : usuario.avatarUrl ?? "");
    setAvatarNomeArquivo("");
    setModalAberto("avatar");
  }

  function abrirModalPerfil() {
    if (!usuario) {
      return;
    }

    const telefonesDeduplicados = deduplicarTelefonesParaFormulario(
      usuario.telefones.map(mapearTelefoneParaFormulario),
      loja?.telefoneId,
    );
    const enderecosDeduplicados = deduplicarEnderecosParaFormulario(
      usuario.enderecos.map(mapearEnderecoParaFormulario),
      loja?.enderecoId,
    );

    setPerfilErroAcao("");
    setPerfilForm({
      nome: usuario.primeiroNome,
      sobrenome: usuario.sobrenome,
      email: usuario.email,
      password: "",
    });
    setTelefonesForm(telefonesDeduplicados.telefones);
    setEnderecosForm(enderecosDeduplicados.enderecos);
    setNovoTelefoneForm(null);
    setNovoEnderecoForm(null);
    setTelefonesRemovidos(telefonesDeduplicados.telefonesDuplicadosIds);
    setEnderecosRemovidos(enderecosDeduplicados.enderecosDuplicadosIds);
    setModalAberto("perfil");
  }

  function abrirModalLoja() {
    if (!usuario) {
      return;
    }

    if (!podeGerenciarLoja) {
      alert("Cadastre um telefone e um endereço principal no perfil antes de criar a loja.");
      return;
    }

    const cpfUsuarioFormatado = obterCpfUsuarioFormatado(usuario.cpf);

    setLojaErroAcao("");
    setLojaForm(
      loja
        ? {
            nomeFantasia: loja.nomeFantasia,
            tipoDocumentoFiscal: String(loja.tipoDocumentoFiscal) as `${TipoDocumentoFiscalLoja}`,
            documentoFiscal: loja.documentoFiscalFormatado || loja.documentoFiscal,
            descricao: loja.descricao ?? "",
            emailContato: loja.emailContato ?? usuario.email,
            ativa: loja.ativa,
            aceitouTermoFiscalResponsabilidade: false,
          }
        : {
            nomeFantasia: usuario.nome,
            tipoDocumentoFiscal: "1",
            documentoFiscal: cpfUsuarioFormatado,
            descricao: "",
            emailContato: usuario.email,
            ativa: true,
            aceitouTermoFiscalResponsabilidade: false,
          },
    );
    setModalAberto("loja");
  }

  function abrirModalProduto(item?: PerfilGridItem) {
    setLojaFeedback(null);
    setProdutoErroAcao("");
    setProdutoConfirmandoExclusao(false);
    setProdutoForm(criarProdutoForm(item));
    setProdutoImagemArquivo(null);
    setModalAberto("produto");
  }

  function sincronizarPedidoCompraLocal(itemAtualizado: PerfilGridItem) {
    setPedidosCompraLocais((pedidosAtuais) =>
      pedidosAtuais.map((item) => atualizarCardPedido(item, itemAtualizado)),
    );
    setPedidoSelecionado(itemAtualizado.pedido ?? null);
  }

  function sincronizarPedidoVendaLocal(itemAtualizado: PerfilGridItem) {
    setPedidosVendaLocais((pedidosAtuais) =>
      pedidosAtuais.map((item) => atualizarCardPedido(item, itemAtualizado)),
    );
    setPedidoSelecionado(itemAtualizado.pedido ?? null);
  }

  async function carregarContextoPedidoCompra(pedidoId: number) {
    const [itemBase, solicitacoes] = await Promise.all([
      buscarDetalhePedidoCompra(pedidoId),
      listarSolicitacoesCancelamentoPedido(pedidoId),
    ]);
    const itemAtualizado = await enriquecerPedidoCompraComAvaliacoes(itemBase);

    if (itemAtualizado?.pedido) {
      sincronizarPedidoCompraLocal(itemAtualizado);
    }

    setSolicitacoesPedidoCompra(solicitacoes);
    setSolicitacoesPorPedidoCompra((estadoAtual) => ({
      ...estadoAtual,
      [pedidoId]: solicitacoes,
    }));
  }

  async function carregarContextoPedidoVenda(pedidoId: number) {
    const [itemAtualizado, solicitacoes] = await Promise.all([
      buscarDetalhePedidoVenda(pedidoId),
      listarTodasSolicitacoesCancelamentoDaMinhaLoja(),
    ]);

    if (itemAtualizado?.pedido) {
      sincronizarPedidoVendaLocal(itemAtualizado);
    }

    const agrupadas = agruparSolicitacoesPorPedido(solicitacoes);
    setSolicitacoesPorPedidoVenda(agrupadas);
    setSolicitacoesPedidoVenda(agrupadas[pedidoId] ?? []);
  }

  async function recarregarContextoPedidoCompra(pedidoId: number) {
    try {
      setIsCarregandoPedidoCompra(true);
      setIsCarregandoSolicitacoesPedidoCompra(true);
      await carregarContextoPedidoCompra(pedidoId);
    } finally {
      setIsCarregandoPedidoCompra(false);
      setIsCarregandoSolicitacoesPedidoCompra(false);
    }
  }

  async function recarregarContextoPedidoVenda(pedidoId: number) {
    try {
      setIsCarregandoPedidoVenda(true);
      setIsCarregandoSolicitacoesPedidoVenda(true);
      await carregarContextoPedidoVenda(pedidoId);
    } finally {
      setIsCarregandoPedidoVenda(false);
      setIsCarregandoSolicitacoesPedidoVenda(false);
    }
  }

  function abrirModalPedidoCompra(item: PerfilGridItem) {
    if (!item.pedido) {
      return;
    }

    setPedidoSelecionado(item.pedido);
    setSolicitacoesPedidoCompra([]);
    setModalAberto("pedido");

    void recarregarContextoPedidoCompra(item.pedido.pedidoId).catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os detalhes atualizados da compra.",
      );
    });
  }

  function abrirModalPedidoVenda(item: PerfilGridItem) {
    if (!item.pedido) {
      return;
    }

    setPedidoSelecionado(item.pedido);
    setSolicitacoesPedidoVenda(solicitacoesPorPedidoVenda[item.pedido.pedidoId] ?? []);
    setIsDialogoCancelamentoVendaAberto(false);
    setModalAberto("pedido");

    void recarregarContextoPedidoVenda(item.pedido.pedidoId).catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os detalhes atualizados da venda.",
      );
    });
  }

  async function handleConfirmarRecebimentoPedido(pedido: PerfilPedidoDetalhe) {
    if (isConfirmandoRecebimentoPedidoCompra || !pedido.podeConfirmarRecebimento) {
      return;
    }

    try {
      setIsConfirmandoRecebimentoPedidoCompra(true);
      const resposta = await confirmarEntregaPedido(pedido.pedidoId);
      await recarregarContextoPedidoCompra(pedido.pedidoId);
      toast.success(resposta.mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel confirmar o recebimento.",
      );
    } finally {
      setIsConfirmandoRecebimentoPedidoCompra(false);
    }
  }

  async function handleCriarSolicitacaoCancelamentoPedido(
    pedido: PerfilPedidoDetalhe,
    dados: Pick<
      CriarSolicitacaoCancelamentoPayload,
      "tipoSolicitacao" | "motivo" | "observacao"
    >,
  ) {
    if (isProcessandoSolicitacaoPedidoCompra || pedido.pedidoMultiloja) {
      return;
    }

    try {
      setIsProcessandoSolicitacaoPedidoCompra(true);
      const resposta = await criarSolicitacaoCancelamento(pedido.pedidoId, {
        tipoSolicitacao: dados.tipoSolicitacao,
        motivo: dados.motivo,
        observacao: dados.observacao?.trim() || undefined,
      });
      await recarregarContextoPedidoCompra(pedido.pedidoId);
      toast.success(resposta.mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir a solicitacao de cancelamento.",
      );
    } finally {
      setIsProcessandoSolicitacaoPedidoCompra(false);
    }
  }

  async function handleCancelarPedidoCompra(pedido: PerfilPedidoDetalhe) {
    if (isCancelandoPedidoCompra || !pedido.podeCancelar) {
      return;
    }

    try {
      setIsCancelandoPedidoCompra(true);
      const resposta = await cancelarPedido(pedido.pedidoId);
      await recarregarContextoPedidoCompra(pedido.pedidoId);
      toast.success(resposta.mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel cancelar este pedido.",
      );
    } finally {
      setIsCancelandoPedidoCompra(false);
    }
  }

  async function handleCancelarSolicitacaoCancelamentoPedido(
    solicitacao: SolicitacaoCancelamentoLeituraApiResponse,
  ) {
    if (isProcessandoSolicitacaoPedidoCompra) {
      return;
    }

    try {
      setIsProcessandoSolicitacaoPedidoCompra(true);
      const resposta = await cancelarSolicitacaoCancelamento(solicitacao.id);
      await recarregarContextoPedidoCompra(solicitacao.pedidoId);
      toast.success(resposta.mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a solicitacao de cancelamento.",
      );
    } finally {
      setIsProcessandoSolicitacaoPedidoCompra(false);
    }
  }

  async function handleSalvarAvaliacaoPedido(
    pedido: PerfilPedidoDetalhe,
    item: PerfilPedidoDetalhe["itens"][number],
    dados: ProdutoAvaliacaoAtualizacaoPayload,
  ) {
    if (
      produtoIdAvaliacaoEmProcesso ||
      (pedido.statusFluxoKey !== "finalizado" && !item.avaliacaoAtual?.id)
    ) {
      return;
    }

    try {
      setProdutoIdAvaliacaoEmProcesso(item.produtoId);

      if (item.avaliacaoAtual?.id) {
        await atualizarAvaliacaoProduto(item.produtoId, item.avaliacaoAtual.id, dados);
        toast.success("Avaliacao atualizada com sucesso.");
      } else {
        await criarAvaliacaoProduto(item.produtoId, {
          pedidoId: pedido.pedidoId,
          ...dados,
        });
        toast.success("Avaliacao enviada com sucesso.");
      }

      await recarregarContextoPedidoCompra(pedido.pedidoId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel salvar a avaliacao.",
      );
    } finally {
      setProdutoIdAvaliacaoEmProcesso(null);
    }
  }

  async function handleBaixarReciboPedido(pedido: PerfilPedidoDetalhe) {
    if (isBaixandoReciboPedidoCompra) {
      return;
    }

    try {
      setIsBaixandoReciboPedidoCompra(true);
      const pdf = await baixarReciboPedidoPdf(pedido.pedidoId);
      baixarBlobComoArquivo(pdf, `recibo-pedido-${pedido.pedidoId}.pdf`);
      toast.success("Recibo em PDF baixado. Abra o arquivo para consultar ou imprimir.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel baixar o recibo deste pedido.",
      );
    } finally {
      setIsBaixandoReciboPedidoCompra(false);
    }
  }

  async function handleAtualizarStatusOperacionalPedidoVenda(
    pedido: PerfilPedidoDetalhe,
    statusVenda: Exclude<LojaAtualizarStatusVendaPermitido, "Cancelada">,
  ) {
    if (isAtualizandoPedidoVenda || !pedidoPodeReceberStatusOperacional(pedido, statusVenda)) {
      return;
    }

    try {
      setIsAtualizandoPedidoVenda(true);
      const { mensagem, item } = await atualizarPedidoVendaStatus(pedido.pedidoId, statusVenda);

      if (item?.pedido) {
        sincronizarPedidoVendaLocal(item);
      }

      toast.success(mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel atualizar o status da venda.",
      );
    } finally {
      setIsAtualizandoPedidoVenda(false);
    }
  }

  async function handleAtualizarSolicitacaoPedidoVenda(
    solicitacao: SolicitacaoCancelamentoLeituraApiResponse,
    status: StatusSolicitacaoCancelamentoApi,
    observacaoAnalise?: string,
  ) {
    if (isAtualizandoPedidoVenda) {
      return;
    }

    try {
      setIsAtualizandoPedidoVenda(true);
      const resposta = await atualizarStatusSolicitacaoCancelamentoDaMinhaLoja(
        solicitacao.id,
        {
          status,
          observacaoAnalise: observacaoAnalise?.trim() || undefined,
        },
      );

      await recarregarContextoPedidoVenda(solicitacao.pedidoId);
      toast.success(resposta.mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar a tratativa deste pedido.",
      );
    } finally {
      setIsAtualizandoPedidoVenda(false);
    }
  }

  function handleAbrirCancelamentoPedidoVenda(pedido: PerfilPedidoDetalhe) {
    if (!pedido.podeCancelar) {
      return;
    }

    setPedidoSelecionado(pedido);
    setIsDialogoCancelamentoVendaAberto(true);
  }

  async function handleConfirmarCancelamentoPedidoVenda() {
    if (
      !pedidoSelecionado ||
      pedidoSelecionado.contexto !== "venda" ||
      isAtualizandoPedidoVenda ||
      !pedidoSelecionado.podeCancelar
    ) {
      return;
    }

    try {
      setIsAtualizandoPedidoVenda(true);
      const { mensagem, item } = await atualizarPedidoVendaStatus(
        pedidoSelecionado.pedidoId,
        "Cancelada",
      );

      if (item?.pedido) {
        sincronizarPedidoVendaLocal(item);
      }

      setIsDialogoCancelamentoVendaAberto(false);
      toast.success(mensagem);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel cancelar a venda.",
      );
    } finally {
      setIsAtualizandoPedidoVenda(false);
    }
  }

  function handleAlternarModoExclusaoCategorias() {
    setCategoriaLojaModoExclusao((modoAtual) => {
      const proximoModo = !modoAtual;

      if (!proximoModo) {
        setCategoriaLojaPendenteExclusao(null);
      }

      return proximoModo;
    });
    setLojaFeedback(null);
  }

  function handleCancelarModoExclusaoCategorias() {
    setCategoriaLojaModoExclusao(false);
    setCategoriaLojaPendenteExclusao(null);
  }

  function handleSolicitarRemocaoCategoriaLoja(categoria: CategoriaLojaOption) {
    if (categoriaLojaRemovendoId) {
      return;
    }

    setCategoriaLojaPendenteExclusao(categoria);
    setLojaFeedback(null);
  }

  async function handleRemoverCategoriaLoja() {
    if (!categoriaLojaPendenteExclusao || categoriaLojaRemovendoId) {
      return;
    }

    const categoria = categoriaLojaPendenteExclusao;
    const produtosDaCategoria = produtosDaLoja.filter((item) => item.categoriaId === categoria.id);

    try {
      setCategoriaLojaRemovendoId(categoria.id);
      setLojaFeedback(null);

      let mensagemSucesso = criarMensagemSucessoExclusaoCategoria(
        categoria,
        produtosDaCategoria.length,
      );

      try {
        const resposta = await removerCategoriaDaLoja(categoria.nome, true);
        const mensagemDaApi = resposta.mensagem?.trim();

        if (mensagemDaApi) {
          mensagemSucesso = mensagemDaApi;
        }
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) {
          throw error;
        }

        for (const item of produtosDaCategoria) {
          if (!item.produtoId) {
            continue;
          }

          await removerProduto(item.produtoId);
          removeStoredProdutoImage(item.produtoId);
        }

        mensagemSucesso = criarMensagemSucessoExclusaoCategoria(
          categoria,
          produtosDaCategoria.length,
        );
      }

      if (categoriaLojaAtiva === categoria.id) {
        setCategoriaLojaAtiva("todas");
      }

      setCategoriaLojaPendenteExclusao(null);
      setCategoriaLojaModoExclusao(false);
      recarregarDados();
      setLojaFeedback({
        tone: "success",
        message: mensagemSucesso,
      });
    } catch (error) {
      setLojaFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Não foi possível excluir a categoria da loja.",
      });
    } finally {
      setCategoriaLojaRemovendoId(null);
    }
  }

  async function abrirModalEntregas() {
    if (!temLoja) {
      return;
    }

    setEntregaErroAcao("");
    setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
    setModalAberto("entregas");
    setIsCarregandoEntregas(true);

    try {
      const opcoes = await listarMinhasEntregasLoja();
      setEntregasLoja(ordenarEntregasLoja(opcoes));
    } catch (error) {
      setEntregaErroAcao(
        error instanceof Error ? error.message : "Não foi possível carregar as entregas da loja.",
      );
    } finally {
      setIsCarregandoEntregas(false);
    }
  }

  function handlePerfilInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    const valorMascarado = name === "telefone" ? normalizarTelefoneParaInput(value) : value;

    setPerfilForm((currentData) => ({
      ...currentData,
      [name]: valorMascarado,
    }));
    setPerfilErroAcao("");
  }

  function handleEntregaInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setEntregaLojaForm((currentData) => {
      const valorMascarado = name === "valorFrete" ? normalizarMoedaParaInput(value) : value;
      const proximoEstado = {
        ...currentData,
        [name]: valorMascarado,
      };

      if (name === "tipoEntregaId") {
        const tipoEntregaId = Number(valorMascarado);
        proximoEstado.nome = obterNomePadraoEntrega(tipoEntregaId);

        if (tipoEntregaId === 1) {
          proximoEstado.valorFrete = "0,00";
        }
      }

      return proximoEstado;
    });
    setEntregaErroAcao("");
  }

  function handleEntregaAtivaChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked } = event.target;

    setEntregaLojaForm((currentData) => ({
      ...currentData,
      ativa: checked,
    }));
    setEntregaErroAcao("");
  }

  function handleEditarEntrega(opcao: LojaEntregaOpcao) {
    setEntregaLojaForm(criarEntregaLojaForm(opcao));
    setEntregaErroAcao("");
  }

  function handleNovaEntrega() {
    setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
    setEntregaErroAcao("");
  }

  function handleCancelarEntrega() {
    setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
    setEntregaErroAcao("");
  }

  async function handleSalvarEntregaLoja(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!temLoja || isSalvandoEntrega) {
      return;
    }

    try {
      setIsSalvandoEntrega(true);
      setEntregaErroAcao("");

      const tipoEntregaId = Number(entregaLojaForm.tipoEntregaId);

      if (!TIPOS_ENTREGA_OPTIONS.some((option) => option.id === tipoEntregaId)) {
        throw new Error("Selecione um tipo de entrega válido.");
      }

      const nomeEntrega = obterNomePadraoEntrega(tipoEntregaId);

      const payload: LojaEntregaMutacaoPayload = {
        tipoEntregaId,
        nome: nomeEntrega,
        valorFrete: normalizarFreteParaApi(entregaLojaForm.valorFrete, tipoEntregaId),
        prazoEntregaDias: normalizarPrazoEntregaParaApi(entregaLojaForm.prazoEntregaDias),
        observacao: entregaLojaForm.observacao.trim() || undefined,
        ativa: entregaLojaForm.ativa,
      };

      const opcaoSalva = entregaLojaForm.id
        ? await atualizarMinhaEntregaLoja(entregaLojaForm.id, payload)
        : await criarMinhaEntregaLoja(payload);

      setEntregasLoja((currentData) =>
        ordenarEntregasLoja(
          entregaLojaForm.id
            ? currentData.map((opcao) => (opcao.id === opcaoSalva.id ? opcaoSalva : opcao))
            : [...currentData, opcaoSalva],
        ),
      );
      setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
      alert(entregaLojaForm.id ? "Opção de entrega atualizada com sucesso!" : "Opção de entrega criada com sucesso!");
    } catch (error) {
      setEntregaErroAcao(
        error instanceof Error ? error.message : "Não foi possível salvar a opção de entrega.",
      );
    } finally {
      setIsSalvandoEntrega(false);
    }
  }

  async function handleRemoverEntregaLoja(opcao: LojaEntregaOpcao) {
    if (entregaRemovendoId || isSalvandoEntrega) {
      return;
    }

    try {
      setEntregaRemovendoId(opcao.id);
      setEntregaErroAcao("");

      await removerMinhaEntregaLoja(opcao.id);

      setEntregasLoja((currentData) => currentData.filter((item) => item.id !== opcao.id));

      if (entregaLojaForm.id === opcao.id) {
        setEntregaLojaForm(LOJA_ENTREGA_FORM_INICIAL);
      }
    } catch (error) {
      setEntregaErroAcao(
        error instanceof Error ? error.message : "Não foi possível remover a opção de entrega.",
      );
    } finally {
      setEntregaRemovendoId(null);
    }
  }

  function handleTelefoneExistenteChange(index: number, value: string) {
    setTelefonesForm((currentData) =>
      currentData.map((telefone, currentIndex) =>
        currentIndex === index
          ? { ...telefone, numero: normalizarTelefoneParaInput(value) }
          : telefone,
      ),
    );
    setPerfilErroAcao("");
  }

  function handleTelefonePrincipalChange(index: number) {
    const proximoEstado = normalizarPrincipalTelefones(
      telefonesForm.map((telefone, currentIndex) => ({
        ...telefone,
        isPrincipal: currentIndex === index,
      })),
      novoTelefoneForm ? { ...novoTelefoneForm, isPrincipal: false } : null,
    );

    setTelefonesForm(proximoEstado.telefones);
    setNovoTelefoneForm(proximoEstado.novoTelefone);
    setPerfilErroAcao("");
  }

  function handleNovoTelefoneChange(value: string) {
    setNovoTelefoneForm((currentData) => ({
      ...(currentData ?? TELEFONE_FORM_INICIAL),
      numero: normalizarTelefoneParaInput(value),
    }));
    setPerfilErroAcao("");
  }

  function handleNovoTelefonePrincipalChange() {
    const proximoEstado = normalizarPrincipalTelefones(telefonesForm, {
      ...(novoTelefoneForm ?? TELEFONE_FORM_INICIAL),
      isPrincipal: true,
    });

    setTelefonesForm(proximoEstado.telefones);
    setNovoTelefoneForm(proximoEstado.novoTelefone);
    setPerfilErroAcao("");
  }

  function handleRemoverTelefone(index: number) {
    const telefoneRemovido = telefonesForm[index];
    const proximoEstado = normalizarPrincipalTelefones(
      telefonesForm.filter((_, currentIndex) => currentIndex !== index),
      novoTelefoneForm,
    );

    if (telefoneRemovido?.id) {
      setTelefonesRemovidos((currentIds) => [...currentIds, telefoneRemovido.id!]);
    }

    setTelefonesForm(proximoEstado.telefones);
    setNovoTelefoneForm(proximoEstado.novoTelefone);
    setPerfilErroAcao("");
  }

  function handleRemoverNovoTelefone() {
    const proximoEstado = normalizarPrincipalTelefones(telefonesForm, null);

    setTelefonesForm(proximoEstado.telefones);
    setNovoTelefoneForm(null);
    setPerfilErroAcao("");
  }

  function handleEnderecoExistenteChange(
    index: number,
    field: keyof PerfilEnderecoFormState,
    value: string,
  ) {
    setEnderecosForm((currentData) =>
      currentData.map((endereco, currentIndex) =>
        currentIndex === index
          ? {
              ...endereco,
              [field]: normalizarValorEnderecoFormulario(field, value),
            }
          : endereco,
      ),
    );
    setPerfilErroAcao("");
  }

  function handleEnderecoPrincipalChange(index: number) {
    const proximoEstado = normalizarPrincipalEnderecos(
      enderecosForm.map((endereco, currentIndex) => ({
        ...endereco,
        isPrincipal: currentIndex === index,
      })),
      novoEnderecoForm ? { ...novoEnderecoForm, isPrincipal: false } : null,
    );

    setEnderecosForm(proximoEstado.enderecos);
    setNovoEnderecoForm(proximoEstado.novoEndereco);
    setPerfilErroAcao("");
  }

  function handleNovoEnderecoChange(
    field: keyof PerfilEnderecoFormState,
    value: string,
  ) {
    setNovoEnderecoForm((currentData) => ({
      ...(currentData ?? ENDERECO_FORM_INICIAL),
      [field]: normalizarValorEnderecoFormulario(field, value),
    }));
    setPerfilErroAcao("");
  }

  function handleNovoEnderecoPrincipalChange() {
    const proximoEstado = normalizarPrincipalEnderecos(enderecosForm, {
      ...(novoEnderecoForm ?? ENDERECO_FORM_INICIAL),
      isPrincipal: true,
    });

    setEnderecosForm(proximoEstado.enderecos);
    setNovoEnderecoForm(proximoEstado.novoEndereco);
    setPerfilErroAcao("");
  }

  function handleAdicionarTelefone() {
    const proximoEstado = normalizarPrincipalTelefones(telefonesForm, {
      ...TELEFONE_FORM_INICIAL,
      isPrincipal: telefonesForm.length === 0,
    });

    setNovoTelefoneForm(proximoEstado.novoTelefone);
    setTelefonesForm(proximoEstado.telefones);
    setPerfilErroAcao("");
  }

  function handleAdicionarEndereco() {
    const proximoEstado = normalizarPrincipalEnderecos(enderecosForm, {
      ...ENDERECO_FORM_INICIAL,
      isPrincipal: enderecosForm.length === 0,
    });

    setNovoEnderecoForm(proximoEstado.novoEndereco);
    setEnderecosForm(proximoEstado.enderecos);
    setPerfilErroAcao("");
  }

  async function handleAvatarSelecionado(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarErroAcao("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setAvatarErroAcao("Escolha uma imagem de até 2 MB.");
      return;
    }

    try {
      const dataUrl = await lerArquivoComoDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarNomeArquivo(file.name);
      setAvatarErroAcao("");
    } catch (error) {
      setAvatarErroAcao(
        error instanceof Error ? error.message : "Não foi possível carregar a imagem.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoverAvatar() {
    setAvatarPreview("");
    setAvatarNomeArquivo("");
    setAvatarErroAcao("");
  }

  async function handleSalvarAvatar() {
    if (!usuario || isSalvandoAvatar) {
      return;
    }

    try {
      setIsSalvandoAvatar(true);
      setAvatarErroAcao("");
      const temNovaImagem = avatarEhDataUrl(avatarPreview);

      if (avatarDestino === "loja") {
        if (!loja) {
          fecharModal();
          return;
        }

        if (temNovaImagem) {
          const lojaAtualizada = await atualizarMinhaLoja(
            criarPayloadAtualizacaoFotoLoja(
              loja,
              avatarPreview,
              avatarNomeArquivo.trim() || undefined,
            ),
          );

          setAvatarLojaUrl(resolverAvatarLoja(lojaAtualizada));
          fecharModal();
          recarregarDados();
          alert("Foto da loja atualizada com sucesso!");
          return;
        }

        if (!avatarPreview.trim()) {
          if (!avatarLojaUrl.trim()) {
            fecharModal();
            return;
          }

          setAvatarErroAcao(
            "A API da loja ainda nao suporta remover a foto de perfil. Se quiser, posso ligar esse fluxo quando o endpoint existir.",
          );
          return;
        }

        fecharModal();
        return;
      }

      if (temNovaImagem) {
        const response = await atualizarFotoPerfil({
          dataUrl: avatarPreview,
          nomeArquivo: avatarNomeArquivo || undefined,
        });

        const usuarioSessao = getStoredUser();
        updateStoredUser({
          nome: usuarioSessao?.nome ?? usuario.nome,
          email: usuarioSessao?.email ?? usuario.email,
          role: usuarioSessao?.role ?? "Usuario",
          avatarUrl: response.fotoPerfil.avatarUrl,
        });
      } else if (!avatarPreview.trim()) {
        if (!usuario.avatarUrl) {
          fecharModal();
          return;
        }

        await removerFotoPerfil();

        const usuarioSessao = getStoredUser();
        updateStoredUser({
          nome: usuarioSessao?.nome ?? usuario.nome,
          email: usuarioSessao?.email ?? usuario.email,
          role: usuarioSessao?.role ?? "Usuario",
          avatarUrl: null,
        });
      } else {
        fecharModal();
        return;
      }

      fecharModal();
      recarregarDados();
      alert(temNovaImagem ? "Foto do perfil atualizada com sucesso!" : "Foto do perfil removida com sucesso!");
    } catch (error) {
      setAvatarErroAcao(
        error instanceof Error ? error.message : "Não foi possível salvar a foto.",
      );
    } finally {
      setIsSalvandoAvatar(false);
    }
  }

  function handleRemoverEndereco(index: number) {
    const enderecoRemovido = enderecosForm[index];
    const proximoEstado = normalizarPrincipalEnderecos(
      enderecosForm.filter((_, currentIndex) => currentIndex !== index),
      novoEnderecoForm,
    );

    if (enderecoRemovido?.id) {
      setEnderecosRemovidos((currentIds) => [...currentIds, enderecoRemovido.id!]);
    }

    setEnderecosForm(proximoEstado.enderecos);
    setNovoEnderecoForm(proximoEstado.novoEndereco);
    setPerfilErroAcao("");
  }

  function handleRemoverNovoEndereco() {
    const proximoEstado = normalizarPrincipalEnderecos(enderecosForm, null);

    setEnderecosForm(proximoEstado.enderecos);
    setNovoEnderecoForm(null);
    setPerfilErroAcao("");
  }

  function handleLojaInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const cpfUsuarioFormatado = obterCpfUsuarioFormatado(usuario?.cpf);
    const target = event.target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setLojaForm((currentData) => ({
        ...currentData,
        [target.name]: target.checked,
      }));
      setLojaErroAcao("");
      return;
    }

    const { name, value } = target;

    const valorMascarado =
      name === "documentoFiscal"
        ? normalizarDocumentoFiscalParaInput(value, lojaForm.tipoDocumentoFiscal)
        : value;

    setLojaForm((currentData) => {
      const proximoEstado = {
        ...currentData,
        [name]: valorMascarado,
      };

      if (name === "tipoDocumentoFiscal") {
        if (!loja && valorMascarado === "1") {
          proximoEstado.documentoFiscal = cpfUsuarioFormatado;
        } else if (
          !loja &&
          valorMascarado === "2" &&
          currentData.documentoFiscal === cpfUsuarioFormatado
        ) {
          proximoEstado.documentoFiscal = "";
        } else {
          proximoEstado.documentoFiscal = normalizarDocumentoFiscalParaInput(
            currentData.documentoFiscal,
            valorMascarado,
          );
        }
      }

      return proximoEstado;
    });
    setLojaErroAcao("");
  }

  function handleLojaAtivaChange(event: ChangeEvent<HTMLInputElement>) {
    setLojaForm((currentData) => ({
      ...currentData,
      ativa: event.target.checked,
    }));
    setLojaErroAcao("");
  }

  function handleProdutoInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    const valorMascarado = name === "preco" ? normalizarMoedaParaInput(value) : value;

    setProdutoForm((currentData) => ({
      ...currentData,
      [name]: valorMascarado,
    }));
    setProdutoConfirmandoExclusao(false);
    setProdutoErroAcao("");
  }

  function handleProdutoDisponivelChange(event: ChangeEvent<HTMLInputElement>) {
    setProdutoForm((currentData) => ({
      ...currentData,
      disponivel: event.target.checked,
    }));
    setProdutoConfirmandoExclusao(false);
    setProdutoErroAcao("");
  }

  async function handleProdutoImagemSelecionada(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProdutoErroAcao("Selecione um arquivo de imagem válido para o produto.");
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
      setProdutoErroAcao("Escolha uma imagem de até 2 MB para o produto.");
      return;
    }

    try {
      const dataUrl = await lerArquivoComoDataUrl(file);
      setProdutoForm((currentData) => ({
        ...currentData,
        imagemUrl: dataUrl,
      }));
      setProdutoImagemArquivo(file);
      setProdutoConfirmandoExclusao(false);
      setProdutoErroAcao("");
    } catch (error) {
      setProdutoErroAcao(
        error instanceof Error ? error.message : "Não foi possível carregar a imagem do produto.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoverImagemProduto() {
    setProdutoForm((currentData) => ({
      ...currentData,
      imagemUrl: "",
    }));
    setProdutoImagemArquivo(null);
    setProdutoConfirmandoExclusao(false);
    setProdutoErroAcao("");
  }

  function handleSolicitarRemocaoProdutoAtual() {
    if (!produtoForm.id || isProcessandoProduto) {
      return;
    }

    setProdutoConfirmandoExclusao(true);
    setProdutoErroAcao("");
    setLojaFeedback(null);
  }

  async function handleRemoverProdutoAtual() {
    if (!produtoForm.id || isProcessandoProduto) {
      return;
    }

    const nomeProduto = produtoForm.nome.trim() || "este produto";

    try {
      setIsRemovendoProduto(true);
      setProdutoErroAcao("");
      setLojaFeedback(null);

      await removerProduto(produtoForm.id);
      removeStoredProdutoImage(produtoForm.id);

      fecharModal();
      setAbaAtiva("produtos");
      recarregarDados();
      setLojaFeedback({
        tone: "success",
        message: `Produto "${nomeProduto}" excluído com sucesso. Ele não aparece mais na vitrine, mas continua salvo no banco.`,
      });
    } catch (error) {
      setProdutoErroAcao(
        error instanceof Error ? error.message : "Não foi possível excluir o produto.",
      );
    } finally {
      setIsRemovendoProduto(false);
    }
  }

  async function handleSalvarProduto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isProcessandoProduto) {
      return;
    }

    try {
      setIsSalvandoProduto(true);
      setProdutoErroAcao("");

      if (!produtoForm.nome.trim()) {
        throw new Error("Informe o nome do produto.");
      }

      if (!produtoForm.categoria.trim()) {
        throw new Error("Informe a categoria do produto.");
      }

      const estoque = Number(produtoForm.estoque);

      if (!Number.isInteger(estoque) || estoque < 0) {
        throw new Error("Informe um estoque válido para o produto.");
      }

      const payload: ProdutoMutacaoPayload = {
        nome: produtoForm.nome.trim(),
        categoria: produtoForm.categoria.trim(),
        preco: normalizarPrecoParaApi(produtoForm.preco),
        estoque,
        disponivel: produtoForm.disponivel,
        descricao: produtoForm.descricao.trim() || undefined,
      };

      const produtoSalvo = produtoForm.id
        ? await atualizarProduto(produtoForm.id, payload)
        : await criarProduto(payload);

      const produtoIdPersistido = produtoSalvo?.id ?? produtoForm.id;

      if (produtoIdPersistido) {
        let imagensSincronizadas = produtoSalvo?.imagens ?? [];
        let imagemPrincipalSincronizada = produtoSalvo?.imagem ?? "";
        let imagemPersistidaPublicamente = false;

        if (produtoImagemArquivo) {
          const midiasPublicas = await enviarMidiasProduto(produtoIdPersistido, [produtoImagemArquivo]);
          const midiasConfirmadas =
            midiasPublicas.length > 0
              ? midiasPublicas
              : await listarMidiasProduto(produtoIdPersistido);

          if (midiasConfirmadas.length === 0) {
            throw new Error(
              "A API salvou os dados do produto, mas não confirmou a imagem pública. Verifique o endpoint de mídias da API.",
            );
          }

          saveStoredProdutoImage(produtoIdPersistido, midiasConfirmadas[0]);
          imagensSincronizadas = midiasConfirmadas;
          imagemPrincipalSincronizada = midiasConfirmadas[0] ?? "";
          imagemPersistidaPublicamente = true;
        }

        if (imagemPersistidaPublicamente) {
          // Mantem a URL publica confirmada pela API.
        } else if (produtoForm.imagemUrl.trim()) {
          imagemPrincipalSincronizada = produtoForm.imagemUrl.trim();
          imagensSincronizadas =
            imagensSincronizadas.length > 0 ? imagensSincronizadas : [imagemPrincipalSincronizada];
          saveStoredProdutoImage(produtoIdPersistido, imagemPrincipalSincronizada);
        } else {
          imagensSincronizadas = [];
          imagemPrincipalSincronizada = "";
          removeStoredProdutoImage(produtoIdPersistido);
        }

        sincronizarProdutoLojaLocal(
          criarProdutoGridItem({
            id: produtoIdPersistido,
            nome: produtoSalvo?.nome ?? payload.nome,
            categoria: produtoSalvo?.categoriaNome ?? payload.categoria,
            preco: produtoSalvo?.preco ?? payload.preco,
            estoque: produtoSalvo?.estoque ?? payload.estoque,
            disponivel: produtoSalvo?.disponivel ?? (payload.disponivel && payload.estoque > 0),
            descricao: produtoSalvo?.descricao ?? payload.descricao,
            imagemUrl: produtoSalvo?.imagem ?? imagemPrincipalSincronizada,
            imagens: produtoSalvo?.imagens ?? imagensSincronizadas,
          }),
        );
      }

      fecharModal();
      setAbaAtiva("produtos");
      recarregarDados();
      alert(produtoForm.id ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
    } catch (error) {
      setProdutoErroAcao(
        error instanceof Error ? error.message : "Não foi possível salvar o produto.",
      );
    } finally {
      setIsSalvandoProduto(false);
    }
  }

  async function handleSalvarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario || isSalvandoPerfil) {
      return;
    }

    try {
      setIsSalvandoPerfil(true);
      setPerfilErroAcao("");

      const payload = {
        nome: perfilForm.nome.trim(),
        sobrenome: perfilForm.sobrenome.trim(),
        email: perfilForm.email.trim().toLowerCase(),
        password: perfilForm.password.trim() || undefined,
      };

      const erroNovoEndereco = obterErroEnderecoInvalido(novoEnderecoForm);

      if (erroNovoEndereco) {
        throw new Error(erroNovoEndereco);
      }

      const totalTelefonesAposSalvar =
        telefonesForm.length + (telefoneTemConteudo(novoTelefoneForm) ? 1 : 0);

      if (totalTelefonesAposSalvar === 0) {
        throw new Error("Mantenha pelo menos um telefone cadastrado no perfil.");
      }

      const telefonesParaValidar = [
        ...telefonesForm,
        ...(telefoneTemConteudo(novoTelefoneForm) ? [novoTelefoneForm!] : []),
      ];

      if (encontrarTelefoneDuplicado(telefonesParaValidar)) {
        throw new Error("Esse número de telefone já está cadastrado no perfil.");
      }

      const telefoneLojaRemovido =
        loja?.telefoneId != null && telefonesRemovidos.includes(loja.telefoneId);
      const enderecoLojaRemovido =
        loja?.enderecoId != null && enderecosRemovidos.includes(loja.enderecoId);
      const telefoneSubstitutoId =
        telefonesForm.find((telefone) => telefone.isPrincipal && telefone.id)?.id ??
        telefonesForm.find((telefone) => telefone.id)?.id;
      const enderecoSubstitutoId =
        enderecosForm.find((endereco) => endereco.isPrincipal && endereco.id)?.id ??
        enderecosForm.find((endereco) => endereco.id)?.id ??
        usuario.enderecoPrincipalId;

      if (telefoneLojaRemovido && !telefoneSubstitutoId) {
        throw new Error(
          "Não á possivel remover o telefone usado pela loja sem manter outro telefone já salvo no perfil.",
        );
      }

      if (enderecoLojaRemovido && !enderecoSubstitutoId) {
        throw new Error(
          "Não foi possível atualizar a loja automaticamente porque nenhum endereço principal válido foi encontrado.",
        );
      }

      if ((telefoneLojaRemovido || enderecoLojaRemovido) && !telefoneSubstitutoId) {
        throw new Error(
          "Nao foi possivel atualizar a loja automaticamente porque nenhum telefone valido foi encontrado.",
        );
      }

      if ((telefoneLojaRemovido || enderecoLojaRemovido) && !enderecoSubstitutoId) {
        throw new Error(
          "Nao foi possivel atualizar a loja automaticamente porque nenhum endereco valido foi encontrado.",
        );
      }

      await atualizarPerfilUsuario(usuario.id, payload);

      await Promise.all(
        telefonesForm
          .filter((telefone) => telefone.id)
          .map((telefone) =>
            atualizarTelefone(
              telefone.id!,
              normalizarTelefoneParaApi(telefone.numero, telefone.isPrincipal),
            ),
          ),
      );

      await Promise.all(
        enderecosForm
          .filter((endereco) => endereco.id)
          .map((endereco) =>
            atualizarEndereco(usuario.id, endereco.id!, {
              cep: normalizarCep(endereco.cep),
              tipoLogradouro: endereco.tipoLogradouro,
              nomeEndereco: endereco.nomeEndereco.trim(),
              numero: endereco.numero.trim(),
              complemento: endereco.complemento.trim() || undefined,
              cidade: endereco.cidade.trim(),
              uf: endereco.uf.trim().toUpperCase(),
              isPrincipal: endereco.isPrincipal,
            }),
          ),
      );

      if (telefoneTemConteudo(novoTelefoneForm)) {
        await criarTelefone(
          normalizarTelefoneParaApi(novoTelefoneForm!.numero, novoTelefoneForm!.isPrincipal),
        );
      }

      if (novoEnderecoForm && enderecoTemConteudo(novoEnderecoForm)) {
        await criarEndereco(usuario.id, {
          cep: normalizarCep(novoEnderecoForm.cep),
          tipoLogradouro: novoEnderecoForm.tipoLogradouro,
          nomeEndereco: novoEnderecoForm.nomeEndereco.trim(),
          numero: novoEnderecoForm.numero.trim(),
          complemento: novoEnderecoForm.complemento.trim() || undefined,
          cidade: novoEnderecoForm.cidade.trim(),
          uf: novoEnderecoForm.uf.trim().toUpperCase(),
          isPrincipal: novoEnderecoForm.isPrincipal,
        });
      }

      if (loja && (telefoneLojaRemovido || enderecoLojaRemovido)) {
        await atualizarMinhaLoja({
          nomeFantasia: loja.nomeFantasia,
          tipoDocumentoFiscal: loja.tipoDocumentoFiscal,
          documentoFiscal: loja.documentoFiscal,
          descricao: loja.descricao ?? undefined,
          emailContato: loja.emailContato ?? undefined,
          usarEnderecoUsuario: true,
          enderecoUsuarioId: enderecoSubstitutoId,
          usarTelefoneUsuario: true,
          telefoneUsuarioId: telefoneSubstitutoId,
          ativa: loja.ativa,
        });
      }

      await Promise.all(telefonesRemovidos.map((telefoneId) => removerTelefone(telefoneId)));
      await Promise.all(
        enderecosRemovidos.map((enderecoId) => removerEndereco(usuario.id, enderecoId)),
      );

      const usuarioSessao = getStoredUser();
      updateStoredUser({
        nome: `${payload.nome} ${payload.sobrenome}`.trim(),
        email: payload.email,
        role: usuarioSessao?.role ?? "Usuario",
        avatarUrl: usuarioSessao?.avatarUrl ?? usuario.avatarUrl ?? null,
      });

      fecharModal();
      recarregarDados();
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      setPerfilErroAcao(
        error instanceof Error ? error.message : "Não foi possível atualizar o perfil.",
      );
    } finally {
      setIsSalvandoPerfil(false);
    }
  }

  async function handleSalvarLoja(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario || isSalvandoLoja) {
      return;
    }

    if (!usuario.enderecoPrincipalId || !usuario.telefonePrincipalId) {
      setLojaErroAcao(
        "Cadastre um telefone e um endereço principal no perfil antes de continuar.",
      );
      return;
    }

    if (!loja && !lojaForm.aceitouTermoFiscalResponsabilidade) {
      setLojaErroAcao(
        "Confirme que voce esta ciente das responsabilidades fiscais antes de abrir a loja.",
      );
      return;
    }

    try {
      setIsSalvandoLoja(true);
      setLojaErroAcao("");

      const payload = {
        nomeFantasia: lojaForm.nomeFantasia.trim(),
        tipoDocumentoFiscal: Number(lojaForm.tipoDocumentoFiscal) as TipoDocumentoFiscalLoja,
        documentoFiscal: lojaForm.documentoFiscal.trim(),
        descricao: lojaForm.descricao.trim() || undefined,
        emailContato: lojaForm.emailContato.trim() || undefined,
        usarEnderecoUsuario: true,
        enderecoUsuarioId: usuario.enderecoPrincipalId,
        usarTelefoneUsuario: true,
        telefoneUsuarioId: usuario.telefonePrincipalId,
        ativa: lojaForm.ativa,
      };

      if (loja) {
        await atualizarMinhaLoja(payload);
      } else {
        await criarMinhaLoja(payload);
      }

      fecharModal();
      recarregarDados();
      alert(loja ? "Loja atualizada com sucesso!" : "Loja criada com sucesso!");
    } catch (error) {
      setLojaErroAcao(obterMensagemErroLoja(error));
    } finally {
      setIsSalvandoLoja(false);
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {/* Apresenta o cabecalho principal da pagina com a mesma linguagem visual escura do projeto. */}
          <Spotlight>
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="space-y-5">
                {temLoja ? (
                  <UserTabs
                    abaAtiva={visaoAtiva}
                    tabs={visoesDisponiveis}
                    onChange={(aba) => setVisaoAtiva(aba as PerfilVisaoId)}
                    withDivider={false}
                  />
                ) : null}

                <div className="space-y-3 pt-1">
                <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                  {heroBadge}
                </span>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  {heroTitulo}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
                  {heroDescricao}
                </p>
              </div>
              </div>
            </section>
          </Spotlight>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-6">
              {/* Decide se a coluna esquerda mostra loading, erro ou os dados do usuario. */}
              {isUsuarioLoading ? (
                <ProfileSection>
                  <ProfileSkeleton lines={4} cardCount={1} />
                </ProfileSection>
              ) : usuarioError ? (
                <ProfileSection>
                  <ProfileFeedback
                    variant="error"
                    title="Erro ao carregar perfil"
                    description={usuarioError}
                  />
                </ProfileSection>
              ) : (
                <UserCard
                  card={cardAtivo}
                  onEditAvatar={abrirModalAvatar}
                  primaryAction={
                    visaoAtiva === "loja"
                      ? {
                          label: "Editar loja",
                          onClick: abrirModalLoja,
                          icon: <Store className="h-4 w-4" />,
                        }
                      : {
                          label: "Editar perfil",
                          onClick: abrirModalPerfil,
                          icon: <User className="h-4 w-4" />,
                        }
                  }
                  secondaryAction={
                    visaoAtiva === "loja"
                      ? {
                          label: "Entregas",
                          onClick: abrirModalEntregas,
                          icon: <Truck className="h-4 w-4" />,
                          variant: "secondary",
                        }
                      : {
                          label: temLoja ? "Editar loja" : "Criar loja",
                          onClick: abrirModalLoja,
                          icon: <Store className="h-4 w-4" />,
                          disabled: !podeGerenciarLoja,
                          variant: "secondary",
                        }
                  }
                />
              )}
            </div>

            <div className="space-y-6">
              {/* Exibe o resumo numerico da conta mesmo quando o usuario ainda nao possui dados completos. */}
              <UserStats
                title={visaoAtiva === "loja" ? "Resumo financeiro" : "Minha atividade"}
                description={
                  visaoAtiva === "loja"
                    ? "Acompanhe as vendas brutas e o valor liquido a receber da loja."
                    : "Resumo rápido da conta de comprador com seus dados principais."
                }
                stats={statsAtivos}
              />

              <ProfileSection title={tabContent.titulo} description={tabContent.descricao}>
                {/* Controla a troca de abas e o recarregamento dinamico do conteudo. */}
                <div className="space-y-5">
                  <div className="space-y-4 border-b border-white/10 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <UserTabs
                        abaAtiva={abaAtivaResolvida}
                        tabs={abasDisponiveis}
                        onChange={(aba) => setAbaAtiva(aba as PerfilTabId)}
                        withDivider={false}
                        className="flex-1"
                      />

                      {isStoreProductsTab ? (
                        <button
                          type="button"
                          onClick={() => abrirModalProduto()}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 transition hover:border-yellow-400/50 hover:bg-yellow-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
                          aria-label="Adicionar produto"
                          title="Adicionar produto"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      ) : null}
                    </div>

                    {isStoreProductsTab ? (
                      <SecaoProdutosLoja
                        categoriaLojaAtiva={categoriaLojaAtiva}
                        categoriaLojaModoExclusao={categoriaLojaModoExclusao}
                        categoriaLojaPendenteExclusao={categoriaLojaPendenteExclusao}
                        categoriaLojaRemovendoId={categoriaLojaRemovendoId}
                        categoriasDaLoja={categoriasDaLoja}
                        lojaFeedback={lojaFeedback}
                        statusProdutoAtivo={filtroDisponibilidadeProdutoLojaAtivo}
                        totalProdutosDisponiveis={totalProdutosDisponiveis}
                        totalProdutosIndisponiveis={totalProdutosIndisponiveis}
                        totalProdutosLoja={produtosDaLoja.length}
                        onAlternarModoExclusaoCategorias={handleAlternarModoExclusaoCategorias}
                        onCancelarModoExclusaoCategorias={handleCancelarModoExclusaoCategorias}
                        onConfirmarRemocaoCategoria={() => void handleRemoverCategoriaLoja()}
                        onLimparCategoriaPendenteExclusao={() =>
                          setCategoriaLojaPendenteExclusao(null)
                        }
                        onSelecionarCategoria={setCategoriaLojaAtiva}
                        onSelecionarStatusProduto={setFiltroDisponibilidadeProdutoLojaAtivo}
                        onSolicitarRemocaoCategoriaLoja={handleSolicitarRemocaoCategoriaLoja}
                      />
                    ) : null}

                    {isStoreSalesTab ? (
                      <StatusVendasTabs
                        filtros={filtrosStatusVenda}
                        filtroAtivo={filtroStatusVendaAtivo}
                        onChange={setFiltroStatusVendaAtivo}
                      />
                    ) : null}

                    {isBuyerOrdersTab ? (
                      <StatusComprasTabs
                        filtros={filtrosStatusCompra}
                        filtroAtivo={filtroStatusCompraAtivo}
                        isCarregando={isCarregandoResumoCompras}
                        onChange={setFiltroStatusCompraAtivo}
                      />
                    ) : null}
                  </div>

                  {isConteudoLoading ? (
                    <ProfileSkeleton />
                  ) : conteudoError ? (
                    <ProfileFeedback
                      variant="error"
                      title="Erro ao carregar conteudo"
                      description={conteudoError}
                    />
                  ) : itensExibidos.length === 0 ? (
                    <ProfileFeedback
                      variant="empty"
                      title={
                        estaFiltrandoCategoria
                          ? "Nenhum produto nessa categoria"
                          : estaFiltrandoDisponibilidadeLoja
                            ? filtroDisponibilidadeProdutoLojaAtivo === "disponiveis"
                              ? "Nenhum produto disponivel"
                              : "Nenhum produto pausado"
                          : estaFiltrandoStatusCompra
                            ? filtroStatusCompraAtivo === "cancelado"
                              ? "Nenhum pedido cancelado"
                              : filtroStatusCompraAtivo === "devolucao"
                                ? "Nenhuma devolucao ou troca encontrada"
                                : filtroStatusCompraAtivo === "finalizado"
                                  ? "Nenhum pedido finalizado"
                                  : "Nenhuma compra em andamento"
                            : estaFiltrandoStatusVenda
                              ? `Nenhum pedido em ${ROTULO_STATUS_VENDA[filtroStatusVendaAtivo as PerfilPedidoStatusFluxo]}`
                              : tabContent.vazioTitulo
                      }
                      description={
                        estaFiltrandoCategoria
                          ? "Selecione outra categoria ou adicione um novo produto para preencher essa seção."
                          : estaFiltrandoDisponibilidadeLoja
                            ? filtroDisponibilidadeProdutoLojaAtivo === "disponiveis"
                              ? "Quando houver itens publicados neste filtro, eles aparecerao aqui."
                              : "Quando voce pausar produtos da vitrine, eles continuarao listados aqui para reativacao."
                          : estaFiltrandoStatusCompra
                            ? filtroStatusCompraAtivo === "cancelado"
                              ? "Quando um pedido for cancelado ou entrar em tratativa de cancelamento, ele aparecera aqui."
                              : filtroStatusCompraAtivo === "devolucao"
                                ? "Quando uma compra receber tratativa de devolucao ou troca, ela aparecera aqui."
                                : filtroStatusCompraAtivo === "finalizado"
                                  ? "Quando uma compra for concluida sem cancelamento, devolucao ou troca, ela aparecera aqui."
                                  : "Quando houver compras ainda em andamento, elas aparecerao aqui."
                            : estaFiltrandoStatusVenda
                              ? "Quando houver pedidos nessa etapa do fluxo, eles vao aparecer aqui com os produtos do pedido e as acoes do vendedor."
                              : tabContent.vazioDescricao
                      }
                    />
                  ) : (
                    <ProductGrid
                      itens={itensExibidos}
                      onItemClick={
                        isStoreProductsTab
                          ? abrirModalProduto
                          : isStoreSalesTab
                            ? abrirModalPedidoVenda
                          : isBuyerOrdersTab
                            ? abrirModalPedidoCompra
                            : undefined
                      }
                      clickHint={
                        isStoreSalesTab
                          ? "Clique para gerenciar pedido"
                          : isBuyerOrdersTab
                            ? "Clique para ver detalhes"
                            : "Clique para editar"
                      }
                    />
                  )}
                </div>
              </ProfileSection>
            </div>
          </div>
        </div>
      </div>

      <ModalAvatarPerfil
        altPreviewAvatar={altPreviewAvatar}
        avatarErroAcao={avatarErroAcao}
        avatarPreview={avatarPreview}
        descricao={descricaoModalAvatar}
        editandoFotoLoja={editandoFotoLoja}
        isOpen={modalAberto === "avatar"}
        isSalvandoAvatar={isSalvandoAvatar}
        labelRemoverAvatar={labelRemoverAvatar}
        labelSalvarAvatar={labelSalvarAvatar}
        onClose={fecharModal}
        onRemoverAvatar={handleRemoverAvatar}
        onSalvarAvatar={handleSalvarAvatar}
        onSelecionarAvatar={handleAvatarSelecionado}
        titulo={tituloModalAvatar}
      />

      <ModalPerfilUsuario
        enderecosForm={enderecosForm}
        isOpen={modalAberto === "perfil"}
        isSalvandoPerfil={isSalvandoPerfil}
        novoEnderecoForm={novoEnderecoForm}
        novoTelefoneForm={novoTelefoneForm}
        onAdicionarEndereco={handleAdicionarEndereco}
        onAdicionarTelefone={handleAdicionarTelefone}
        onChangeEnderecoExistente={handleEnderecoExistenteChange}
        onChangeNovoEndereco={handleNovoEnderecoChange}
        onChangeNovoTelefone={handleNovoTelefoneChange}
        onChangePerfilInput={handlePerfilInputChange}
        onChangeTelefoneExistente={handleTelefoneExistenteChange}
        onClose={fecharModal}
        onRemoverEndereco={handleRemoverEndereco}
        onRemoverNovoEndereco={handleRemoverNovoEndereco}
        onRemoverNovoTelefone={handleRemoverNovoTelefone}
        onRemoverTelefone={handleRemoverTelefone}
        onSubmit={handleSalvarPerfil}
        onToggleEnderecoPrincipal={handleEnderecoPrincipalChange}
        onToggleNovoEnderecoPrincipal={handleNovoEnderecoPrincipalChange}
        onToggleNovoTelefonePrincipal={handleNovoTelefonePrincipalChange}
        onToggleTelefonePrincipal={handleTelefonePrincipalChange}
        perfilErroAcao={perfilErroAcao}
        perfilForm={perfilForm}
        telefonesForm={telefonesForm}
        tiposLogradouro={tiposLogradouro}
      />

      <ModalEntregasLoja
        descricao={descricaoModalEntregas}
        entregaEmEdicao={entregaEmEdicao}
        entregaErroAcao={entregaErroAcao}
        entregaLojaForm={entregaLojaForm}
        entregaRemovendoId={entregaRemovendoId}
        entregasLoja={entregasLoja}
        handleCancelarEntrega={handleCancelarEntrega}
        handleEditarEntrega={handleEditarEntrega}
        handleNovaEntrega={handleNovaEntrega}
        handleRemoverEntregaLoja={(opcao) => {
          void handleRemoverEntregaLoja(opcao);
        }}
        isCarregandoEntregas={isCarregandoEntregas}
        isOpen={modalAberto === "entregas"}
        isSalvandoEntrega={isSalvandoEntrega}
        onChangeEntregaInput={handleEntregaInputChange}
        onClose={fecharModal}
        onSubmit={handleSalvarEntregaLoja}
        onToggleEntregaAtiva={handleEntregaAtivaChange}
        tipoEntregaAtualEhRetirada={tipoEntregaAtualEhRetirada}
        titulo={tituloModalEntregas}
      />

      <ModalPedidoCompra
        key={`pedido-compra-${pedidoSelecionado?.pedidoId ?? "novo"}-${
          modalAberto === "pedido" && pedidoSelecionado?.contexto === "compra" ? "open" : "closed"
        }`}
        descricao="Veja os itens comprados, a entrega e as opcoes de acompanhamento deste pedido."
        isOpen={modalAberto === "pedido" && pedidoSelecionado?.contexto === "compra"}
        isCarregandoPedido={isCarregandoPedidoCompra}
        isCarregandoSolicitacoes={isCarregandoSolicitacoesPedidoCompra}
        isConfirmandoRecebimento={isConfirmandoRecebimentoPedidoCompra}
        isBaixandoRecibo={isBaixandoReciboPedidoCompra}
        isProcessandoSolicitacao={isProcessandoSolicitacaoPedidoCompra}
        isCancelandoPedido={isCancelandoPedidoCompra}
        isSalvandoAvaliacao={produtoIdAvaliacaoEmProcesso !== null}
        produtoIdAvaliacaoEmProcesso={produtoIdAvaliacaoEmProcesso}
        pedido={pedidoSelecionado?.contexto === "compra" ? pedidoSelecionado : null}
        solicitacoesCancelamento={solicitacoesPedidoCompra}
        onBaixarRecibo={handleBaixarReciboPedido}
        onCancelarPedido={handleCancelarPedidoCompra}
        onClose={fecharModal}
        onConfirmarRecebimento={handleConfirmarRecebimentoPedido}
        onCriarSolicitacaoCancelamento={handleCriarSolicitacaoCancelamentoPedido}
        onCancelarSolicitacaoCancelamento={handleCancelarSolicitacaoCancelamentoPedido}
        onSalvarAvaliacao={handleSalvarAvaliacaoPedido}
      />

      <ModalPedidoVenda
        descricao="Abra o pedido para revisar os itens vendidos, consultar o status real da venda e acionar as mudancas permitidas pelo backend."
        isOpen={modalAberto === "pedido" && pedidoSelecionado?.contexto === "venda"}
        isCarregandoPedido={isCarregandoPedidoVenda}
        isCarregandoSolicitacoes={isCarregandoSolicitacoesPedidoVenda}
        isAtualizandoPedido={isAtualizandoPedidoVenda}
        pedido={pedidoSelecionado?.contexto === "venda" ? pedidoSelecionado : null}
        solicitacoesCancelamento={solicitacoesPedidoVenda}
        onAtualizarStatus={handleAtualizarStatusOperacionalPedidoVenda}
        onAtualizarSolicitacao={handleAtualizarSolicitacaoPedidoVenda}
        onCancelarPedido={handleAbrirCancelamentoPedidoVenda}
        onClose={fecharModal}
      />

      <DialogoCancelarPedidoVenda
        isOpen={isDialogoCancelamentoVendaAberto}
        isProcessando={isAtualizandoPedidoVenda}
        onClose={() => setIsDialogoCancelamentoVendaAberto(false)}
        onConfirm={handleConfirmarCancelamentoPedidoVenda}
        pedido={pedidoSelecionado?.contexto === "venda" ? pedidoSelecionado : null}
      />

      <ModalProdutoLoja
        descricao={descricaoModalProduto}
        isOpen={modalAberto === "produto"}
        isProcessandoProduto={isProcessandoProduto}
        isRemovendoProduto={isRemovendoProduto}
        isSalvandoProduto={isSalvandoProduto}
        onChangeProdutoInput={handleProdutoInputChange}
        onClose={fecharModal}
        onConfirmarRemocaoProdutoAtual={() => void handleRemoverProdutoAtual()}
        onRemoverImagemProduto={handleRemoverImagemProduto}
        onSelecionarImagemProduto={handleProdutoImagemSelecionada}
        onSolicitarRemocaoProdutoAtual={handleSolicitarRemocaoProdutoAtual}
        onSubmit={handleSalvarProduto}
        onToggleProdutoDisponivel={handleProdutoDisponivelChange}
        produtoConfirmandoExclusao={produtoConfirmandoExclusao}
        produtoErroAcao={produtoErroAcao}
        produtoForm={produtoForm}
        titulo={tituloModalProduto}
        voltarConfirmacaoExclusao={() => setProdutoConfirmandoExclusao(false)}
      />

      <ModalLojaPerfil
        descricao="Use seus dados principais de endereço e telefone para liberar a loja rapidamente."
        isOpen={modalAberto === "loja"}
        isSalvandoLoja={isSalvandoLoja}
        lojaErroAcao={lojaErroAcao}
        lojaForm={lojaForm}
        onChangeLojaInput={handleLojaInputChange}
        onClose={fecharModal}
        onSubmit={handleSalvarLoja}
        onToggleLojaAtiva={handleLojaAtivaChange}
        temLoja={temLoja}
        titulo={temLoja ? "Editar loja" : "Criar loja"}
      />
    </PageLayout>
  );
}
