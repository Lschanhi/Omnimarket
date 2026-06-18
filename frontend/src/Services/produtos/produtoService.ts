import type { HomeProduct } from "../../types/home";
import { API_BASE_URL, apiRequest } from "../http/apiClient";
import { getStoredProdutoImage } from "./produtoImageStorage";
import { getStoredLojaAvatar } from "../user/lojaAvatarStorage";
import { obterLojaPublica } from "../user/lojaPublicaService";

type ProdutoApiResponse = {
  id: number;
  nome: string;
  categoria: string;
  sku?: string;
  preco: number;
  estoque: number;
  disponivel?: boolean | string | number | null;
  statusPublicacao?: string | null;
  descricao?: string | null;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
  totalVisualizacoes?: number;
  lojaId: number;
  nomeLoja: string;
  slugLoja: string;
  imagem?: string | null;
  Imagem?: string | null;
  imagemUrl?: string | null;
  ImagemUrl?: string | null;
  imagemPrincipal?: string | null;
  ImagemPrincipal?: string | null;
  fotoUrl?: string | null;
  FotoUrl?: string | null;
  thumbUrl?: string | null;
  thumbnailUrl?: string | null;
  avatarLojaUrl?: string | null;
  lojaAvatarUrl?: string | null;
  fotoPerfilLojaUrl?: string | null;
  lojaFotoPerfilUrl?: string | null;
  logoLojaUrl?: string | null;
  lojaLogoUrl?: string | null;
  loja?: {
    id?: number;
    nomeFantasia?: string | null;
    fotoPerfilUrl?: string | null;
    avatarUrl?: string | null;
    logoUrl?: string | null;
  } | null;
  imagens?: string[] | null;
  midias?: ProdutoMidiaApiItem[] | null;
};

type ProdutoMutacaoApiResponse =
  | ProdutoApiResponse
  | {
      mensagem?: string;
      produto?: ProdutoApiResponse | null;
      data?: ProdutoApiResponse | null;
    }
  | null
  | undefined;

export type ProdutoMutacaoPayload = {
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  disponivel: boolean;
  descricao?: string;
  imagens?: string[];
};

export type CategoriaExclusaoResposta = {
  categoria: string;
  totalProdutosEncontrados: number;
  totalProdutosDesativados: number;
  requerConfirmacao: boolean;
  mensagem: string;
};

type ProdutoMidiaApiItem =
  | string
  | {
      id?: number;
      url?: string | null;
      Url?: string | null;
      arquivoUrl?: string | null;
      ArquivoUrl?: string | null;
      midiaUrl?: string | null;
      MidiaUrl?: string | null;
      blobUrl?: string | null;
      BlobUrl?: string | null;
      caminho?: string | null;
      Caminho?: string | null;
      src?: string | null;
      Src?: string | null;
      arquivo?: {
        url?: string | null;
      } | null;
    };

type ProdutoMidiaApiResponse =
  | ProdutoMidiaApiItem[]
  | {
      midias?: ProdutoMidiaApiItem[] | null;
      Midias?: ProdutoMidiaApiItem[] | null;
      data?: ProdutoMidiaApiItem[] | null;
      itens?: ProdutoMidiaApiItem[] | null;
    }
  | null
  | undefined;

type ObterProdutoOptions = {
  registrarVisualizacao?: boolean;
};

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarDisponibilidadeProduto(
  disponivel: ProdutoApiResponse["disponivel"],
  statusPublicacao?: string | null,
) {
  if (typeof disponivel === "boolean") {
    return disponivel;
  }

  if (typeof disponivel === "number") {
    return disponivel !== 0;
  }

  if (typeof disponivel === "string") {
    const valorNormalizado = normalizarTexto(disponivel.trim());

    if (!valorNormalizado) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "nao",
        "inativo",
        "indisponivel",
        "despublicado",
        "removido",
        "excluido",
      ].includes(valorNormalizado)
    ) {
      return false;
    }

    if (
      [
        "true",
        "1",
        "sim",
        "ativo",
        "disponivel",
        "publicado",
      ].includes(valorNormalizado)
    ) {
      return true;
    }
  }

  const statusNormalizado = normalizarTexto(statusPublicacao?.trim() ?? "");

  if (!statusNormalizado) {
    return true;
  }

  if (
    [
      "inativo",
      "indisponivel",
      "despublicado",
      "removido",
      "excluido",
      "pausado",
    ].includes(statusNormalizado)
  ) {
    return false;
  }

  return true;
}

function criarCategoriaId(categoria: string) {
  return normalizarTexto(categoria)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "geral";
}

export function criarImagemPlaceholder(label: string) {
  const titulo = label.trim().slice(0, 22) || "OmniMarket";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <circle cx="650" cy="140" r="110" fill="rgba(255,255,255,0.08)" />
      <circle cx="180" cy="470" r="150" fill="rgba(0,0,0,0.18)" />
      <text x="60" y="315" fill="#ffffff" font-family="Arial, sans-serif" font-size="46" font-weight="700">
        ${titulo}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isProdutoApiResponse(value: unknown): value is ProdutoApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const produto = value as Partial<ProdutoApiResponse>;

  return (
    typeof produto.id === "number" &&
    typeof produto.nome === "string" &&
    typeof produto.categoria === "string"
  );
}

function extrairProdutoDaResposta(response: ProdutoMutacaoApiResponse) {
  if (isProdutoApiResponse(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return null;
  }

  if (isProdutoApiResponse(response.produto)) {
    return response.produto;
  }

  if (isProdutoApiResponse(response.data)) {
    return response.data;
  }

  return null;
}

function extrairUrlMidia(midia: ProdutoMidiaApiItem) {
  if (typeof midia === "string") {
    return resolverUrlImagemProduto(midia);
  }

  if (!midia || typeof midia !== "object") {
    return "";
  }

  const candidatos = [
    midia.url,
    midia.Url,
    midia.arquivoUrl,
    midia.ArquivoUrl,
    midia.midiaUrl,
    midia.MidiaUrl,
    midia.blobUrl,
    midia.BlobUrl,
    midia.caminho,
    midia.Caminho,
    midia.src,
    midia.Src,
    midia.arquivo?.url,
  ];

  const url =
    candidatos.find((valor) => typeof valor === "string" && valor.trim())?.trim() ?? "";

  return resolverUrlImagemProduto(url);
}

function resolverUrlImagemProduto(url: string | null | undefined) {
  const valor = url?.trim() ?? "";

  if (!valor) {
    return "";
  }

  if (/^(?:https?:|data:|blob:)/i.test(valor)) {
    return valor;
  }

  const caminhoNormalizado = valor.startsWith("/") ? valor : `/${valor}`;
  return `${API_BASE_URL}${caminhoNormalizado}`;
}

function normalizarImagensProduto(imagens: Array<string | null | undefined> | null | undefined) {
  return Array.isArray(imagens)
    ? imagens.map((imagem) => resolverUrlImagemProduto(imagem)).filter(Boolean)
    : [];
}

function combinarImagensProduto(...grupos: string[][]) {
  return Array.from(new Set(grupos.flat().filter(Boolean)));
}

function normalizarMidias(response: ProdutoMidiaApiResponse) {
  const itens = Array.isArray(response)
    ? response
    : response?.midias ?? response?.Midias ?? response?.data ?? response?.itens ?? [];

  return itens.map(extrairUrlMidia).filter(Boolean);
}

function extrairImagemPrincipalProduto(
  produto: Pick<
    ProdutoApiResponse,
    | "imagem"
    | "Imagem"
    | "imagemUrl"
    | "ImagemUrl"
    | "imagemPrincipal"
    | "ImagemPrincipal"
    | "fotoUrl"
    | "FotoUrl"
    | "thumbUrl"
    | "thumbnailUrl"
  >,
) {
  const candidatos = [
    produto.imagem,
    produto.Imagem,
    produto.imagemUrl,
    produto.ImagemUrl,
    produto.imagemPrincipal,
    produto.ImagemPrincipal,
    produto.fotoUrl,
    produto.FotoUrl,
    produto.thumbUrl,
    produto.thumbnailUrl,
  ];

  return candidatos
    .map((valor) => resolverUrlImagemProduto(valor))
    .find((valor) => typeof valor === "string" && valor.trim().length > 0)
    ?? "";
}

function extrairImagensProduto(
  produto: Pick<
    ProdutoApiResponse,
    | "imagens"
    | "midias"
    | "imagem"
    | "Imagem"
    | "imagemUrl"
    | "ImagemUrl"
    | "imagemPrincipal"
    | "ImagemPrincipal"
    | "fotoUrl"
    | "FotoUrl"
    | "thumbUrl"
    | "thumbnailUrl"
  >,
) {
  const imagemPrincipalDeclarada = extrairImagemPrincipalProduto(produto);

  return combinarImagensProduto(
    imagemPrincipalDeclarada ? [imagemPrincipalDeclarada] : [],
    normalizarImagensProduto(produto.imagens),
    normalizarMidias(produto.midias ?? []),
  );
}

function extrairAvatarLoja(produto: ProdutoApiResponse) {
  const avatarSalvoLocalmente = getStoredLojaAvatar(produto.lojaId);
  const candidatos = [
    produto.avatarLojaUrl,
    produto.lojaAvatarUrl,
    produto.fotoPerfilLojaUrl,
    produto.lojaFotoPerfilUrl,
    produto.logoLojaUrl,
    produto.lojaLogoUrl,
    produto.loja?.fotoPerfilUrl,
    produto.loja?.avatarUrl,
    produto.loja?.logoUrl,
    avatarSalvoLocalmente,
  ];

  const url =
    candidatos.find((valor) => typeof valor === "string" && valor.trim().length > 0)?.trim() ??
    "";

  return resolverUrlImagemProduto(url);
}

async function enriquecerProdutoComLojaPublica(produto: ProdutoApiResponse) {
  if (extrairAvatarLoja(produto) || !produto.lojaId) {
    return produto;
  }

  const lojaPublica = await obterLojaPublica(produto.lojaId);

  if (!lojaPublica) {
    return produto;
  }

  return {
    ...produto,
    loja: {
      id: lojaPublica.id ?? produto.loja?.id,
      nomeFantasia: lojaPublica.nomeFantasia ?? produto.loja?.nomeFantasia ?? produto.nomeLoja,
      fotoPerfilUrl: lojaPublica.fotoPerfilUrl ?? produto.loja?.fotoPerfilUrl ?? null,
      avatarUrl: lojaPublica.avatarUrl ?? produto.loja?.avatarUrl ?? null,
      logoUrl: lojaPublica.logoUrl ?? produto.loja?.logoUrl ?? null,
    },
  };
}

export async function listarMidiasProduto(produtoId: number) {
  const response = await apiRequest<ProdutoMidiaApiResponse>(`/api/produtos/${produtoId}/midias`);
  return normalizarMidias(response);
}

export async function enviarMidiasProduto(produtoId: number, arquivos: File[]) {
  const formData = new FormData();

  arquivos.forEach((arquivo) => {
    formData.append("arquivos", arquivo);
  });

  const response = await apiRequest<ProdutoMidiaApiResponse>(`/api/produtos/${produtoId}/midias`, {
    method: "POST",
    authenticated: true,
    body: formData,
  });

  return normalizarMidias(response);
}

function mapearProduto(produto: ProdutoApiResponse): HomeProduct {
  const imagens = extrairImagensProduto(produto);
  const imagemSalvaLocalmente = getStoredProdutoImage(produto.id);
  const imagemPrincipal =
    imagens[0] ?? imagemSalvaLocalmente ?? criarImagemPlaceholder(produto.nome);
  const lojaAvatarUrl = extrairAvatarLoja(produto);

  return {
    id: produto.id,
    nome: produto.nome,
    preco: Number(produto.preco),
    avaliacao: Number(produto.mediaAvaliacao ?? 0),
    categoriaId: criarCategoriaId(produto.categoria),
    categoriaNome: produto.categoria,
    imagem: imagemPrincipal,
    imagens: imagens.length > 0 ? imagens : [imagemPrincipal],
    destaque:
      produto.totalAvaliacoes > 0
        ? `${produto.totalAvaliacoes} avaliacoes`
        : produto.nomeLoja,
    descricao: produto.descricao ?? "",
    sku: produto.sku,
    estoque: produto.estoque,
    disponivel: normalizarDisponibilidadeProduto(
      produto.disponivel,
      produto.statusPublicacao,
    ),
    lojaId: produto.lojaId,
    lojaNome: produto.loja?.nomeFantasia?.trim() || produto.nomeLoja,
    lojaAvatarUrl: lojaAvatarUrl || undefined,
    slugLoja: produto.slugLoja,
    totalAvaliacoes: produto.totalAvaliacoes,
    totalVisualizacoes: produto.totalVisualizacoes ?? 0,
  };
}

async function normalizarProdutosDaApi(produtos: ProdutoApiResponse[]) {
  const produtosComMidia = await Promise.all(
    produtos.map(async (produto) => {
      const imagens = extrairImagensProduto(produto);

      if (imagens.length > 0) {
        return {
          ...produto,
          imagens,
          midias: produto.midias ?? null,
        };
      }

      const midias = await listarMidiasProduto(produto.id).catch(() => []);
      return {
        ...produto,
        imagens: midias,
        midias: produto.midias ?? null,
      };
    }),
  );

  const produtosEnriquecidos = await Promise.all(
    produtosComMidia.map(enriquecerProdutoComLojaPublica),
  );

  return produtosEnriquecidos.map(mapearProduto);
}

export async function listarProdutos() {
  const produtos = await apiRequest<ProdutoApiResponse[]>("/api/produto");
  return normalizarProdutosDaApi(produtos);
}

export async function listarMeusProdutos() {
  const produtos = await apiRequest<ProdutoApiResponse[]>("/api/produto/meus", {
    authenticated: true,
  });
  return normalizarProdutosDaApi(produtos);
}

export async function listarProdutosEmDestaque(take = 10) {
  const produtos = await apiRequest<ProdutoApiResponse[]>(`/api/produto/destaques?take=${take}`);
  return normalizarProdutosDaApi(produtos);
}

export async function obterProdutoPorId(id: number, options: ObterProdutoOptions = {}) {
  const query = options.registrarVisualizacao ? "?registrarVisualizacao=true" : "";
  const produto = await apiRequest<ProdutoApiResponse>(`/api/produto/${id}${query}`);
  const imagens = extrairImagensProduto(produto);
  const produtoComMidia =
    imagens.length > 0
      ? {
          ...produto,
          imagens,
          midias: produto.midias ?? null,
        }
      : {
          ...produto,
          imagens: await listarMidiasProduto(id).catch(() => []),
          midias: produto.midias ?? null,
        };

  const produtoEnriquecido = await enriquecerProdutoComLojaPublica(produtoComMidia);
  return mapearProduto(produtoEnriquecido);
}

export async function criarProduto(payload: ProdutoMutacaoPayload) {
  const response = await apiRequest<ProdutoMutacaoApiResponse>("/api/produto", {
    method: "POST",
    authenticated: true,
    body: payload,
  });

  const produto = extrairProdutoDaResposta(response);
  return produto ? mapearProduto(produto) : null;
}

export async function atualizarProduto(id: number, payload: ProdutoMutacaoPayload) {
  const response = await apiRequest<ProdutoMutacaoApiResponse>(`/api/produto/${id}`, {
    method: "PUT",
    authenticated: true,
    body: payload,
  });

  const produto = extrairProdutoDaResposta(response);
  return produto ? mapearProduto(produto) : null;
}

export async function removerProduto(id: number) {
  await apiRequest<void>(`/api/produto/${id}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export async function removerCategoriaDaLoja(
  nomeCategoria: string,
  confirmarExclusaoProdutos = false,
) {
  const query = new URLSearchParams({
    nomeCategoria,
    confirmarExclusaoProdutos: String(confirmarExclusaoProdutos),
  });

  return apiRequest<CategoriaExclusaoResposta>(`/api/produto/categoria?${query.toString()}`, {
    method: "DELETE",
    authenticated: true,
  });
}
