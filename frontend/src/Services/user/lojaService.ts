import { apiRequest } from "../http/apiClient";
import type {
  MotivoSolicitacaoCancelamentoApi,
  SolicitacaoCancelamentoLeituraApiResponse,
  StatusSolicitacaoCancelamentoApi,
} from "../pedidos/pedidoService";

export type TipoDocumentoFiscalLoja = 1 | 2;

export type LojaGestaoApiResponse = {
  id: number;
  usuarioId: number;
  nomeFantasia: string;
  slug?: string | null;
  fotoPerfilUrl?: string | null;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  tipoDocumentoFiscal: TipoDocumentoFiscalLoja;
  documentoFiscal: string;
  documentoFiscalFormatado: string;
  descricao?: string | null;
  emailContato?: string | null;
  enderecoId?: number | null;
  cep?: string | null;
  cidade?: string | null;
  uf?: string | null;
  nomeEndereco?: string | null;
  numeroEndereco?: string | null;
  complementoEndereco?: string | null;
  telefoneId?: number | null;
  numeroTelefone?: string | null;
  tipoTelefone?: string | null;
  ativa: boolean;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  dtCriacao: string;
  dtAtualizacao?: string | null;
};

export type LojaMutacaoPayload = {
  nomeFantasia: string;
  tipoDocumentoFiscal: TipoDocumentoFiscalLoja;
  documentoFiscal: string;
  descricao?: string;
  emailContato?: string;
  fotoPerfilDataUrl?: string;
  fotoPerfilNomeArquivo?: string;
  usarEnderecoUsuario: boolean;
  enderecoUsuarioId?: number;
  usarTelefoneUsuario: boolean;
  telefoneUsuarioId?: number;
  ativa: boolean;
};

export type LojaPedidoStatusPedidoApi =
  | "Pendente"
  | "Pago"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export type LojaPedidoStatusVendaApi =
  | "Criada"
  | "Pendente"
  | "Paga"
  | "EmSeparacao"
  | "Pronto"
  | "Enviada"
  | "Concluida"
  | "Cancelada";

export type LojaPedidoItemLeituraApiResponse = {
  id: number;
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
};

export type LojaPedidoLeituraApiResponse = {
  pedidoId: number;
  vendaId?: number | null;
  lojaId: number;
  nomeLoja: string;
  clienteId: number;
  nomeCliente: string;
  emailCliente: string;
  statusPedido: LojaPedidoStatusPedidoApi;
  statusVenda?: LojaPedidoStatusVendaApi | null;
  tipoEntrega: string;
  valorTotalPedido: number;
  valorTotalLoja: number;
  quantidadeItens: number;
  dataPedido: string;
  observacao: string;
  tipoLogradouroEntrega: string;
  nomeEnderecoEntrega: string;
  numeroEntrega: string;
  complementoEntrega?: string | null;
  cepEntrega: string;
  cidadeEntrega: string;
  ufEntrega: string;
  pedidoMultiloja: boolean;
  possuiSolicitacaoCancelamentoAtiva?: boolean;
  podeAceitar: boolean;
  podeCancelar: boolean;
  podeMarcarComoPronto: boolean;
  podeMarcarComoEnviado: boolean;
  itens: LojaPedidoItemLeituraApiResponse[];
};

export type LojaSolicitacaoCancelamentoListagemApiResponse = {
  items: SolicitacaoCancelamentoLeituraApiResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type LojaPedidoListagemApiResponse = {
  items: LojaPedidoLeituraApiResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type LojaPedidosListagemParams = {
  busca?: string;
  statusPedido?: LojaPedidoStatusPedidoApi;
  statusVenda?: LojaPedidoStatusVendaApi;
  page?: number;
  pageSize?: number;
};

export type LojaAtualizarStatusVendaPermitido = Extract<
  LojaPedidoStatusVendaApi,
  "EmSeparacao" | "Pronto" | "Enviada" | "Cancelada"
>;

export type LojaAtualizarStatusPedidoPayload = {
  statusVenda: LojaAtualizarStatusVendaPermitido;
};

export type LojaAtualizarStatusPedidoResponse = {
  mensagem: string;
  pedido: LojaPedidoLeituraApiResponse;
};

type LojaPedidoStatusFluxoCompat =
  | "pendente"
  | "em-separacao"
  | "pronto"
  | "enviado"
  | "finalizado"
  | "cancelado";

function lerObjeto(valor: unknown) {
  return valor && typeof valor === "object" ? (valor as Record<string, unknown>) : null;
}

function lerTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" ? valor : fallback;
}

function lerNumero(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

function lerBoolean(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function normalizarStatusSolicitacaoCancelamento(
  valor: unknown,
): StatusSolicitacaoCancelamentoApi {
  switch (valor) {
    case "EmAnalise":
      return "EmAnalise";
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

function normalizarMotivoSolicitacaoCancelamento(
  valor: unknown,
): MotivoSolicitacaoCancelamentoApi {
  switch (valor) {
    case "Arrependimento":
      return "Arrependimento";
    case "AtrasoEntrega":
      return "AtrasoEntrega";
    case "ProdutoComDefeito":
      return "ProdutoComDefeito";
    case "ProdutoIncorreto":
      return "ProdutoIncorreto";
    case "EntregaNaoRecebida":
      return "EntregaNaoRecebida";
    case "Outro":
    default:
      return "Outro";
  }
}

function normalizarLojaGestao(valor: unknown): LojaGestaoApiResponse {
  const loja = lerObjeto(valor);

  if (!loja) {
    throw new Error("A API retornou uma resposta invalida para a loja.");
  }

  const id = lerNumero(loja.id ?? loja.Id, 0);
  const usuarioId = lerNumero(loja.usuarioId ?? loja.UsuarioId, 0);

  if (!id || !usuarioId) {
    throw new Error("A API retornou uma resposta invalida para a loja.");
  }

  const fotoPerfilUrl =
    lerTexto(loja.fotoPerfilUrl ?? loja.FotoPerfilUrl, "").trim() || null;
  const avatarUrl =
    lerTexto(loja.avatarUrl ?? loja.AvatarUrl, "").trim() || fotoPerfilUrl;
  const logoUrl =
    lerTexto(loja.logoUrl ?? loja.LogoUrl, "").trim() || fotoPerfilUrl;
  const documentoFiscal = lerTexto(loja.documentoFiscal ?? loja.DocumentoFiscal, "");

  return {
    id,
    usuarioId,
    nomeFantasia: lerTexto(loja.nomeFantasia ?? loja.NomeFantasia),
    slug: lerTexto(loja.slug ?? loja.Slug, "").trim() || null,
    fotoPerfilUrl,
    avatarUrl,
    logoUrl,
    tipoDocumentoFiscal: lerNumero(
      loja.tipoDocumentoFiscal ?? loja.TipoDocumentoFiscal,
      1,
    ) as TipoDocumentoFiscalLoja,
    documentoFiscal,
    documentoFiscalFormatado:
      lerTexto(
        loja.documentoFiscalFormatado ?? loja.DocumentoFiscalFormatado,
        documentoFiscal,
      ).trim() || documentoFiscal,
    descricao: lerTexto(loja.descricao ?? loja.Descricao, "").trim() || null,
    emailContato: lerTexto(loja.emailContato ?? loja.EmailContato, "").trim() || null,
    enderecoId: lerNumero(loja.enderecoId ?? loja.EnderecoId, 0) || null,
    cep: lerTexto(loja.cep ?? loja.Cep, "").trim() || null,
    cidade: lerTexto(loja.cidade ?? loja.Cidade, "").trim() || null,
    uf: lerTexto(loja.uf ?? loja.Uf, "").trim() || null,
    nomeEndereco: lerTexto(loja.nomeEndereco ?? loja.NomeEndereco, "").trim() || null,
    numeroEndereco:
      lerTexto(loja.numeroEndereco ?? loja.NumeroEndereco, "").trim() || null,
    complementoEndereco:
      lerTexto(loja.complementoEndereco ?? loja.ComplementoEndereco, "").trim() || null,
    telefoneId: lerNumero(loja.telefoneId ?? loja.TelefoneId, 0) || null,
    numeroTelefone:
      lerTexto(loja.numeroTelefone ?? loja.NumeroTelefone, "").trim() || null,
    tipoTelefone: lerTexto(loja.tipoTelefone ?? loja.TipoTelefone, "").trim() || null,
    ativa: lerBoolean(loja.ativa ?? loja.Ativa, false),
    mediaAvaliacao: lerNumero(loja.mediaAvaliacao ?? loja.MediaAvaliacao, 0),
    totalAvaliacoes: lerNumero(loja.totalAvaliacoes ?? loja.TotalAvaliacoes, 0),
    dtCriacao: lerTexto(loja.dtCriacao ?? loja.DtCriacao),
    dtAtualizacao: lerTexto(loja.dtAtualizacao ?? loja.DtAtualizacao, "").trim() || null,
  };
}

function normalizarTextoChave(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .toLowerCase();
}

function normalizarStatusPedido(valor: unknown): LojaPedidoStatusPedidoApi {
  if (typeof valor === "number") {
    switch (valor) {
      case 2:
        return "Pago";
      case 3:
        return "Enviado";
      case 4:
        return "Entregue";
      case 5:
        return "Cancelado";
      case 1:
      default:
        return "Pendente";
    }
  }

  switch (valor) {
    case "Pago":
      return "Pago";
    case "Enviado":
      return "Enviado";
    case "Entregue":
      return "Entregue";
    case "Cancelado":
      return "Cancelado";
    case "Pendente":
    default:
      return "Pendente";
  }
}

function normalizarStatusVenda(valor: unknown): LojaPedidoStatusVendaApi | null {
  if (valor == null) {
    return null;
  }

  if (typeof valor === "number") {
    switch (valor) {
      case 7:
        return "Cancelada";
      case 6:
        return "Concluida";
      case 5:
        return "Enviada";
      case 4:
        return "Pronto";
      case 3:
        return "EmSeparacao";
      case 2:
        return "Pendente";
      case 1:
        return "Criada";
      default:
        return null;
    }
  }

  if (typeof valor !== "string") {
    return null;
  }

  switch (normalizarTextoChave(valor)) {
    case "criada":
      return "Criada";
    case "pendente":
    case "paga":
    case "pago":
    case "aprovada":
    case "aprovado":
      return "Pendente";
    case "emseparacao":
    case "separacao":
    case "separando":
    case "processando":
    case "empreparacao":
      return "EmSeparacao";
    case "pronto":
    case "pronta":
    case "prontoparaenvio":
    case "prontopararetirada":
    case "embalado":
      return "Pronto";
    case "enviada":
    case "enviado":
    case "emtransito":
    case "saiuparaentrega":
    case "despachado":
      return "Enviada";
    case "concluida":
    case "concluido":
    case "entregue":
    case "recebido":
    case "retirado":
      return "Concluida";
    case "cancelada":
    case "cancelado":
      return "Cancelada";
    default:
      return null;
  }
}

function inferirFluxoOperacionalPedidoLoja(
  statusPedido: LojaPedidoStatusPedidoApi,
  statusVenda?: LojaPedidoStatusVendaApi | null,
): LojaPedidoStatusFluxoCompat {
  if (statusPedido === "Cancelado" || statusVenda === "Cancelada") {
    return "cancelado";
  }

  if (statusPedido === "Entregue" || statusVenda === "Concluida") {
    return "finalizado";
  }

  if (statusPedido === "Enviado" || statusVenda === "Enviada") {
    return "enviado";
  }

  if (statusVenda === "Pronto") {
    return "pronto";
  }

  if (statusVenda === "EmSeparacao") {
    return "em-separacao";
  }

  return "pendente";
}

function normalizarPermissoesPedidoLoja(
  statusPedido: LojaPedidoStatusPedidoApi,
  statusVenda: LojaPedidoStatusVendaApi | null | undefined,
  podeAceitar: boolean,
  podeMarcarComoPronto: boolean,
  podeMarcarComoEnviado: boolean,
) {
  if (podeAceitar || podeMarcarComoPronto || !podeMarcarComoEnviado) {
    return {
      podeAceitar,
      podeMarcarComoPronto,
      podeMarcarComoEnviado,
    };
  }

  const fluxo = inferirFluxoOperacionalPedidoLoja(statusPedido, statusVenda);

  if (fluxo === "pendente") {
    return {
      podeAceitar: true,
      podeMarcarComoPronto: false,
      podeMarcarComoEnviado: false,
    };
  }

  if (fluxo === "em-separacao") {
    return {
      podeAceitar: false,
      podeMarcarComoPronto: true,
      podeMarcarComoEnviado: false,
    };
  }

  return {
    podeAceitar,
    podeMarcarComoPronto,
    podeMarcarComoEnviado,
  };
}

function normalizarItemPedidoLoja(valor: unknown): LojaPedidoItemLeituraApiResponse | null {
  const item = lerObjeto(valor);

  if (!item) {
    return null;
  }

  const produtoId = lerNumero(item.produtoId ?? item.ProdutoId, 0);
  const id = lerNumero(item.id ?? item.Id, 0);

  if (!id || !produtoId) {
    return null;
  }

  return {
    id,
    produtoId,
    nomeProduto: lerTexto(item.nomeProduto ?? item.NomeProduto, "Produto"),
    quantidade: lerNumero(item.quantidade ?? item.Quantidade, 0),
    precoUnitario: lerNumero(item.precoUnitario ?? item.PrecoUnitario, 0),
    valorTotal: lerNumero(item.valorTotal ?? item.ValorTotal, 0),
  };
}

function normalizarPedidoLoja(valor: unknown): LojaPedidoLeituraApiResponse | null {
  const pedido = lerObjeto(valor);

  if (!pedido) {
    return null;
  }

  const pedidoId = lerNumero(pedido.pedidoId ?? pedido.PedidoId, 0);
  const lojaId = lerNumero(pedido.lojaId ?? pedido.LojaId, 0);

  if (!pedidoId || !lojaId) {
    return null;
  }

  const itensBrutos = pedido.itens ?? pedido.Itens;
  const itens = Array.isArray(itensBrutos)
    ? itensBrutos.map(normalizarItemPedidoLoja).filter((item): item is LojaPedidoItemLeituraApiResponse => Boolean(item))
    : [];
  const statusPedido = normalizarStatusPedido(pedido.statusPedido ?? pedido.StatusPedido);
  const statusVenda = normalizarStatusVenda(pedido.statusVenda ?? pedido.StatusVenda);
  const permissoes = normalizarPermissoesPedidoLoja(
    statusPedido,
    statusVenda,
    lerBoolean(pedido.podeAceitar ?? pedido.PodeAceitar, false),
    lerBoolean(pedido.podeMarcarComoPronto ?? pedido.PodeMarcarComoPronto, false),
    lerBoolean(pedido.podeMarcarComoEnviado ?? pedido.PodeMarcarComoEnviado, false),
  );

  return {
    pedidoId,
    vendaId: lerNumero(pedido.vendaId ?? pedido.VendaId, 0) || null,
    lojaId,
    nomeLoja: lerTexto(pedido.nomeLoja ?? pedido.NomeLoja),
    clienteId: lerNumero(pedido.clienteId ?? pedido.ClienteId, 0),
    nomeCliente: lerTexto(pedido.nomeCliente ?? pedido.NomeCliente),
    emailCliente: lerTexto(pedido.emailCliente ?? pedido.EmailCliente),
    statusPedido,
    statusVenda,
    tipoEntrega: lerTexto(pedido.tipoEntrega ?? pedido.TipoEntrega),
    valorTotalPedido: lerNumero(pedido.valorTotalPedido ?? pedido.ValorTotalPedido, 0),
    valorTotalLoja: lerNumero(pedido.valorTotalLoja ?? pedido.ValorTotalLoja, 0),
    quantidadeItens: lerNumero(pedido.quantidadeItens ?? pedido.QuantidadeItens, itens.length),
    dataPedido: lerTexto(pedido.dataPedido ?? pedido.DataPedido),
    observacao: lerTexto(pedido.observacao ?? pedido.Observacao),
    tipoLogradouroEntrega: lerTexto(pedido.tipoLogradouroEntrega ?? pedido.TipoLogradouroEntrega),
    nomeEnderecoEntrega: lerTexto(pedido.nomeEnderecoEntrega ?? pedido.NomeEnderecoEntrega),
    numeroEntrega: lerTexto(pedido.numeroEntrega ?? pedido.NumeroEntrega),
    complementoEntrega: lerTexto(
      pedido.complementoEntrega ?? pedido.ComplementoEntrega,
      "",
    ) || null,
    cepEntrega: lerTexto(pedido.cepEntrega ?? pedido.CepEntrega),
    cidadeEntrega: lerTexto(pedido.cidadeEntrega ?? pedido.CidadeEntrega),
    ufEntrega: lerTexto(pedido.ufEntrega ?? pedido.UfEntrega),
    pedidoMultiloja: lerBoolean(pedido.pedidoMultiloja ?? pedido.PedidoMultiloja, false),
    possuiSolicitacaoCancelamentoAtiva: lerBoolean(
      pedido.possuiSolicitacaoCancelamentoAtiva ??
        pedido.PossuiSolicitacaoCancelamentoAtiva,
      false,
    ),
    podeAceitar: permissoes.podeAceitar,
    podeCancelar: lerBoolean(pedido.podeCancelar ?? pedido.PodeCancelar, false),
    podeMarcarComoPronto: permissoes.podeMarcarComoPronto,
    podeMarcarComoEnviado: permissoes.podeMarcarComoEnviado,
    itens,
  };
}

function normalizarRespostaListaPedidosLoja(valor: unknown): LojaPedidoListagemApiResponse {
  if (Array.isArray(valor)) {
    const items = valor
      .map(normalizarPedidoLoja)
      .filter((pedido): pedido is LojaPedidoLeituraApiResponse => Boolean(pedido));

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    };
  }

  const resposta = lerObjeto(valor);

  if (!resposta) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 0,
    };
  }

  const itemsBrutos = resposta.items ?? resposta.Items;
  const items = Array.isArray(itemsBrutos)
    ? itemsBrutos
        .map(normalizarPedidoLoja)
        .filter((pedido): pedido is LojaPedidoLeituraApiResponse => Boolean(pedido))
    : [];

  return {
    items,
    total: lerNumero(resposta.total ?? resposta.Total, items.length),
    page: lerNumero(resposta.page ?? resposta.Page, 1),
    pageSize: lerNumero(resposta.pageSize ?? resposta.PageSize, items.length),
  };
}

function normalizarRespostaAtualizacaoPedidoLoja(valor: unknown): LojaAtualizarStatusPedidoResponse {
  const resposta = lerObjeto(valor);
  const pedido = normalizarPedidoLoja(
    resposta?.pedido ?? resposta?.Pedido ?? resposta?.data ?? resposta?.Data,
  );

  if (!pedido) {
    throw new Error("A API retornou uma resposta invalida ao atualizar o status da venda.");
  }

  return {
    mensagem: lerTexto(
      resposta?.mensagem ?? resposta?.Mensagem,
      "Status da venda atualizado com sucesso.",
    ),
    pedido,
  };
}

function normalizarSolicitacaoCancelamentoLoja(
  valor: unknown,
): SolicitacaoCancelamentoLeituraApiResponse | null {
  const solicitacao = lerObjeto(valor);

  if (!solicitacao) {
    return null;
  }

  const id = lerNumero(solicitacao.id ?? solicitacao.Id, 0);
  const pedidoId = lerNumero(solicitacao.pedidoId ?? solicitacao.PedidoId, 0);

  if (!id || !pedidoId) {
    return null;
  }

  return {
    id,
    pedidoId,
    vendaId: lerNumero(solicitacao.vendaId ?? solicitacao.VendaId, 0),
    clienteId: lerNumero(solicitacao.clienteId ?? solicitacao.ClienteId, 0),
    nomeCliente: lerTexto(solicitacao.nomeCliente ?? solicitacao.NomeCliente),
    emailCliente: lerTexto(solicitacao.emailCliente ?? solicitacao.EmailCliente),
    vendedorId: lerNumero(solicitacao.vendedorId ?? solicitacao.VendedorId, 0),
    lojaId: lerNumero(solicitacao.lojaId ?? solicitacao.LojaId, 0),
    nomeLoja: lerTexto(solicitacao.nomeLoja ?? solicitacao.NomeLoja),
    statusPedidoAtual: lerTexto(
      solicitacao.statusPedidoAtual ?? solicitacao.StatusPedidoAtual,
    ),
    statusVendaAtual: lerTexto(
      solicitacao.statusVendaAtual ?? solicitacao.StatusVendaAtual,
    ),
    statusPedidoOrigem: lerTexto(
      solicitacao.statusPedidoOrigem ?? solicitacao.StatusPedidoOrigem,
    ),
    statusVendaOrigem: lerTexto(
      solicitacao.statusVendaOrigem ?? solicitacao.StatusVendaOrigem,
    ),
    motivo: normalizarMotivoSolicitacaoCancelamento(
      solicitacao.motivo ?? solicitacao.Motivo,
    ),
    status: normalizarStatusSolicitacaoCancelamento(
      solicitacao.status ?? solicitacao.Status,
    ),
    observacao: lerTexto(solicitacao.observacao ?? solicitacao.Observacao),
    observacaoAnalise:
      lerTexto(
        solicitacao.observacaoAnalise ?? solicitacao.ObservacaoAnalise,
        "",
      ) || null,
    dataCriacao: lerTexto(solicitacao.dataCriacao ?? solicitacao.DataCriacao),
    dataAtualizacao:
      lerTexto(
        solicitacao.dataAtualizacao ?? solicitacao.DataAtualizacao,
        "",
      ) || null,
    dataAnalise:
      lerTexto(solicitacao.dataAnalise ?? solicitacao.DataAnalise, "") || null,
    dataConclusao:
      lerTexto(solicitacao.dataConclusao ?? solicitacao.DataConclusao, "") || null,
    podeCancelarPeloSolicitante: lerBoolean(
      solicitacao.podeCancelarPeloSolicitante ??
        solicitacao.PodeCancelarPeloSolicitante,
      false,
    ),
    podeColocarEmAnalise: lerBoolean(
      solicitacao.podeColocarEmAnalise ?? solicitacao.PodeColocarEmAnalise,
      false,
    ),
    podeAprovar: lerBoolean(solicitacao.podeAprovar ?? solicitacao.PodeAprovar, false),
    podeRecusar: lerBoolean(solicitacao.podeRecusar ?? solicitacao.PodeRecusar, false),
    podeConcluir: lerBoolean(solicitacao.podeConcluir ?? solicitacao.PodeConcluir, false),
  };
}

function normalizarRespostaListaSolicitacoesCancelamentoLoja(
  valor: unknown,
): LojaSolicitacaoCancelamentoListagemApiResponse {
  if (Array.isArray(valor)) {
    const items = valor
      .map(normalizarSolicitacaoCancelamentoLoja)
      .filter((item): item is SolicitacaoCancelamentoLeituraApiResponse => Boolean(item));

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    };
  }

  const resposta = lerObjeto(valor);

  if (!resposta) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 0,
    };
  }

  const itemsBrutos = resposta.items ?? resposta.Items;
  const items = Array.isArray(itemsBrutos)
    ? itemsBrutos
        .map(normalizarSolicitacaoCancelamentoLoja)
        .filter((item): item is SolicitacaoCancelamentoLeituraApiResponse => Boolean(item))
    : [];

  return {
    items,
    total: lerNumero(resposta.total ?? resposta.Total, items.length),
    page: lerNumero(resposta.page ?? resposta.Page, 1),
    pageSize: lerNumero(resposta.pageSize ?? resposta.PageSize, items.length),
  };
}

export async function obterMinhaLoja() {
  const resposta = await apiRequest<unknown>("/api/lojas/minha", {
    authenticated: true,
  });

  return normalizarLojaGestao(resposta);
}

export async function criarMinhaLoja(payload: LojaMutacaoPayload) {
  const resposta = await apiRequest<unknown>("/api/lojas/minha", {
    method: "POST",
    authenticated: true,
    body: payload,
  });

  return normalizarLojaGestao(resposta);
}

export async function atualizarMinhaLoja(payload: LojaMutacaoPayload) {
  const resposta = await apiRequest<unknown>("/api/lojas/minha", {
    method: "PUT",
    authenticated: true,
    body: payload,
  });

  return normalizarLojaGestao(resposta);
}

export async function listarPedidosDaMinhaLoja(params: LojaPedidosListagemParams = {}) {
  const query = new URLSearchParams();

  if (params.busca?.trim()) {
    query.set("busca", params.busca.trim());
  }

  if (params.statusPedido) {
    query.set("statusPedido", params.statusPedido);
  }

  if (params.statusVenda) {
    query.set("statusVenda", params.statusVenda);
  }

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const path = query.size > 0 ? `/api/lojas/minha/pedidos?${query.toString()}` : "/api/lojas/minha/pedidos";

  const resposta = await apiRequest<unknown>(path, {
    authenticated: true,
  });

  return normalizarRespostaListaPedidosLoja(resposta);
}

export async function listarTodosPedidosDaMinhaLoja(
  params: Omit<LojaPedidosListagemParams, "page"> = {},
) {
  const pageSize = params.pageSize ?? 100;
  let page = 1;
  let totalColetado = 0;
  const pedidos: LojaPedidoLeituraApiResponse[] = [];

  while (true) {
    const resposta = await listarPedidosDaMinhaLoja({
      ...params,
      page,
      pageSize,
    });

    pedidos.push(...resposta.items);
    totalColetado += resposta.items.length;

    if (resposta.items.length === 0 || totalColetado >= resposta.total) {
      return pedidos;
    }

    page += 1;
  }
}

export async function listarSolicitacoesCancelamentoDaMinhaLoja(params: {
  page?: number;
  pageSize?: number;
} = {}) {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const path =
    query.size > 0
      ? `/api/lojas/minha/solicitacoes-cancelamento?${query.toString()}`
      : "/api/lojas/minha/solicitacoes-cancelamento";

  const resposta = await apiRequest<unknown>(path, {
    authenticated: true,
  });

  return normalizarRespostaListaSolicitacoesCancelamentoLoja(resposta);
}

export async function listarTodasSolicitacoesCancelamentoDaMinhaLoja(pageSize = 100) {
  let page = 1;
  let totalColetado = 0;
  const solicitacoes: SolicitacaoCancelamentoLeituraApiResponse[] = [];

  while (true) {
    const resposta = await listarSolicitacoesCancelamentoDaMinhaLoja({
      page,
      pageSize,
    });

    solicitacoes.push(...resposta.items);
    totalColetado += resposta.items.length;

    if (resposta.items.length === 0 || totalColetado >= resposta.total) {
      return solicitacoes;
    }

    page += 1;
  }
}

export async function buscarPedidoDaMinhaLoja(pedidoId: number) {
  const resposta = await apiRequest<unknown>(`/api/lojas/minha/pedidos/${pedidoId}`, {
    authenticated: true,
  });

  const pedido = normalizarPedidoLoja(resposta);

  if (!pedido) {
    throw new Error("A API retornou um pedido invalido para a loja.");
  }

  return pedido;
}

export async function atualizarStatusPedidoDaMinhaLoja(
  pedidoId: number,
  payload: LojaAtualizarStatusPedidoPayload,
) {
  const resposta = await apiRequest<unknown>(
    `/api/lojas/minha/pedidos/${pedidoId}/status`,
    {
      method: "PUT",
      authenticated: true,
      body: payload,
    },
  );

  return normalizarRespostaAtualizacaoPedidoLoja(resposta);
}
