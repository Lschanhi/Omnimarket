import { apiRequest } from "../http/apiClient";

export type LojaPublicaResumo = {
  id?: number;
  nomeFantasia?: string | null;
  fotoPerfilUrl?: string | null;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  descricao?: string | null;
  cidade?: string | null;
  uf?: string | null;
  mediaAvaliacao?: number | null;
  totalAvaliacoes?: number | null;
  totalVisualizacoes?: number | null;
  totalProdutosAtivos?: number | null;
  ativa?: boolean | null;
};

const lojaPublicaCache = new Map<number, Promise<LojaPublicaResumo | null>>();

type ObterLojaPublicaOptions = {
  registrarVisualizacao?: boolean;
};

export function limparCacheLojaPublica(lojaId?: number | null) {
  if (!lojaId || !Number.isFinite(lojaId) || lojaId <= 0) {
    lojaPublicaCache.clear();
    return;
  }

  lojaPublicaCache.delete(lojaId);
}

function normalizarLojaPublica(response: unknown): LojaPublicaResumo | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const loja = response as Record<string, unknown>;
  const fotoPerfilUrl =
    typeof loja.fotoPerfilUrl === "string"
      ? loja.fotoPerfilUrl
      : typeof loja.FotoPerfilUrl === "string"
        ? loja.FotoPerfilUrl
        : null;
  const avatarUrl =
    typeof loja.avatarUrl === "string"
      ? loja.avatarUrl
      : typeof loja.AvatarUrl === "string"
        ? loja.AvatarUrl
        : fotoPerfilUrl;
  const logoUrl =
    typeof loja.logoUrl === "string"
      ? loja.logoUrl
      : typeof loja.LogoUrl === "string"
        ? loja.LogoUrl
        : fotoPerfilUrl;

  return {
    id:
      typeof loja.id === "number"
        ? loja.id
        : typeof loja.Id === "number"
          ? loja.Id
          : undefined,
    nomeFantasia:
      typeof loja.nomeFantasia === "string"
        ? loja.nomeFantasia
        : typeof loja.NomeFantasia === "string"
          ? loja.NomeFantasia
          : null,
    fotoPerfilUrl,
    avatarUrl,
    logoUrl,
    descricao:
      typeof loja.descricao === "string"
        ? loja.descricao
        : typeof loja.Descricao === "string"
          ? loja.Descricao
          : null,
    cidade:
      typeof loja.cidade === "string"
        ? loja.cidade
        : typeof loja.Cidade === "string"
          ? loja.Cidade
          : null,
    uf:
      typeof loja.uf === "string"
        ? loja.uf
        : typeof loja.Uf === "string"
          ? loja.Uf
          : null,
    mediaAvaliacao:
      typeof loja.mediaAvaliacao === "number"
        ? loja.mediaAvaliacao
        : typeof loja.MediaAvaliacao === "number"
          ? loja.MediaAvaliacao
          : null,
    totalAvaliacoes:
      typeof loja.totalAvaliacoes === "number"
        ? loja.totalAvaliacoes
        : typeof loja.TotalAvaliacoes === "number"
          ? loja.TotalAvaliacoes
          : null,
    totalVisualizacoes:
      typeof loja.totalVisualizacoes === "number"
        ? loja.totalVisualizacoes
        : typeof loja.TotalVisualizacoes === "number"
          ? loja.TotalVisualizacoes
          : null,
    totalProdutosAtivos:
      typeof loja.totalProdutosAtivos === "number"
        ? loja.totalProdutosAtivos
        : typeof loja.TotalProdutosAtivos === "number"
          ? loja.TotalProdutosAtivos
          : null,
    ativa:
      typeof loja.ativa === "boolean"
        ? loja.ativa
        : typeof loja.Ativa === "boolean"
          ? loja.Ativa
          : null,
  };
}

function normalizarListaLojasPublicas(response: unknown) {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(normalizarLojaPublica).filter(Boolean) as LojaPublicaResumo[];
}

export async function obterLojaPublica(
  lojaId?: number | null,
  options: ObterLojaPublicaOptions = {},
) {
  if (!lojaId || !Number.isFinite(lojaId) || lojaId <= 0) {
    return null;
  }

  const registrarVisualizacao = options.registrarVisualizacao === true;
  const cacheHit = registrarVisualizacao ? null : lojaPublicaCache.get(lojaId);

  if (cacheHit) {
    return cacheHit;
  }

  const query = registrarVisualizacao ? "?registrarVisualizacao=true" : "";
  const request = apiRequest<LojaPublicaResumo>(`/api/lojas/${lojaId}${query}`)
    .then(normalizarLojaPublica)
    .catch(() => null);

  lojaPublicaCache.set(lojaId, request);
  return request;
}

export async function listarLojasEmDestaque(take = 10) {
  const response = await apiRequest<LojaPublicaResumo[]>(`/api/lojas/destaques?take=${take}`);
  return normalizarListaLojasPublicas(response);
}
