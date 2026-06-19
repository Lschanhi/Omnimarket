import { apiRequest } from "../http/apiClient";
import type {
  ProdutoAvaliacaoAtualizacaoPayload,
  ProdutoAvaliacaoCriacaoPayload,
  ProdutoAvaliacaoLeitura,
  ProdutoAvaliacaoListagemResponse,
} from "../../types/avaliacao";

type PaginacaoAvaliacoesParams = {
  page?: number;
  pageSize?: number;
};

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

function normalizarAvaliacao(valor: unknown): ProdutoAvaliacaoLeitura | null {
  const avaliacao = lerObjeto(valor);

  if (!avaliacao) {
    return null;
  }

  const id = lerNumero(avaliacao.id ?? avaliacao.Id, 0);
  const produtoId = lerNumero(avaliacao.produtoId ?? avaliacao.ProdutoId, 0);
  const pedidoId = lerNumero(avaliacao.pedidoId ?? avaliacao.PedidoId, 0);

  if (!id || !produtoId || !pedidoId) {
    return null;
  }

  return {
    id,
    produtoId,
    nomeProduto: lerTexto(avaliacao.nomeProduto ?? avaliacao.NomeProduto),
    lojaId: lerNumero(avaliacao.lojaId ?? avaliacao.LojaId, 0),
    nomeLoja: lerTexto(avaliacao.nomeLoja ?? avaliacao.NomeLoja),
    pedidoId,
    usuarioId: lerNumero(avaliacao.usuarioId ?? avaliacao.UsuarioId, 0),
    nomeComprador: lerTexto(avaliacao.nomeComprador ?? avaliacao.NomeComprador, "Cliente"),
    notaProduto: lerNumero(avaliacao.notaProduto ?? avaliacao.NotaProduto, 0),
    notaLoja: lerNumero(avaliacao.notaLoja ?? avaliacao.NotaLoja, 0),
    titulo: lerTexto(avaliacao.titulo ?? avaliacao.Titulo, "") || null,
    comentario: lerTexto(avaliacao.comentario ?? avaliacao.Comentario, "") || null,
    compraVerificada: lerBoolean(
      avaliacao.compraVerificada ?? avaliacao.CompraVerificada,
      false,
    ),
    recomendaProduto: lerBoolean(
      avaliacao.recomendaProduto ?? avaliacao.RecomendaProduto,
      false,
    ),
    dtCriacao: lerTexto(avaliacao.dtCriacao ?? avaliacao.DtCriacao),
    dtAtualizacao:
      lerTexto(avaliacao.dtAtualizacao ?? avaliacao.DtAtualizacao, "") || null,
  };
}

function normalizarListaAvaliacoes(valor: unknown): ProdutoAvaliacaoListagemResponse {
  if (Array.isArray(valor)) {
    const items = valor
      .map(normalizarAvaliacao)
      .filter((item): item is ProdutoAvaliacaoLeitura => Boolean(item));

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
        .map(normalizarAvaliacao)
        .filter((item): item is ProdutoAvaliacaoLeitura => Boolean(item))
    : [];

  return {
    items,
    total: lerNumero(resposta.total ?? resposta.Total, items.length),
    page: lerNumero(resposta.page ?? resposta.Page, 1),
    pageSize: lerNumero(resposta.pageSize ?? resposta.PageSize, items.length),
  };
}

function normalizarAvaliacaoUnica(valor: unknown) {
  const resposta = lerObjeto(valor);

  return normalizarAvaliacao(resposta?.data ?? resposta?.Data ?? resposta);
}

function criarQueryString(params?: PaginacaoAvaliacoesParams) {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function listarAvaliacoesProduto(
  produtoId: number,
  params?: PaginacaoAvaliacoesParams,
) {
  const resposta = await apiRequest<unknown>(
    `/api/produtos/${produtoId}/avaliacoes${criarQueryString(params)}`,
  );

  return normalizarListaAvaliacoes(resposta);
}

export async function listarAvaliacoesLoja(lojaId: number, params?: PaginacaoAvaliacoesParams) {
  const resposta = await apiRequest<unknown>(
    `/api/lojas/${lojaId}/avaliacoes${criarQueryString(params)}`,
  );

  return normalizarListaAvaliacoes(resposta);
}

export async function criarAvaliacaoProduto(
  produtoId: number,
  payload: ProdutoAvaliacaoCriacaoPayload,
) {
  const resposta = await apiRequest<unknown>(`/api/produtos/${produtoId}/avaliacoes`, {
    method: "POST",
    authenticated: true,
    body: payload,
  });

  const avaliacao = normalizarAvaliacaoUnica(resposta);

  if (!avaliacao) {
    throw new Error("A API retornou uma avaliacao invalida ao salvar o produto.");
  }

  return avaliacao;
}

export async function atualizarAvaliacaoProduto(
  produtoId: number,
  avaliacaoId: number,
  payload: ProdutoAvaliacaoAtualizacaoPayload,
) {
  const resposta = await apiRequest<unknown>(
    `/api/produtos/${produtoId}/avaliacoes/${avaliacaoId}`,
    {
      method: "PUT",
      authenticated: true,
      body: payload,
    },
  );

  const avaliacao = normalizarAvaliacaoUnica(resposta);

  if (!avaliacao) {
    throw new Error("A API retornou uma avaliacao invalida ao atualizar o produto.");
  }

  return avaliacao;
}

export async function buscarAvaliacaoProdutoDoPedido(produtoId: number, pedidoId: number) {
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const resposta = await listarAvaliacoesProduto(produtoId, {
      page,
      pageSize: 50,
    });

    const avaliacaoEncontrada =
      resposta.items.find((avaliacao) => avaliacao.pedidoId === pedidoId) ?? null;

    if (avaliacaoEncontrada) {
      return avaliacaoEncontrada;
    }

    if (resposta.items.length === 0) {
      break;
    }

    totalPages = Math.max(1, Math.ceil(resposta.total / Math.max(resposta.pageSize, 1)));
    page += 1;
  }

  return null;
}
