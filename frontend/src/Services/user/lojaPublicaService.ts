import { apiRequest } from "../http/apiClient";

export type LojaPublicaResumo = {
  id?: number;
  nomeFantasia?: string | null;
  fotoPerfilUrl?: string | null;
  avatarUrl?: string | null;
  logoUrl?: string | null;
};

const lojaPublicaCache = new Map<number, Promise<LojaPublicaResumo | null>>();

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
  };
}

export async function obterLojaPublica(lojaId?: number | null) {
  if (!lojaId || !Number.isFinite(lojaId) || lojaId <= 0) {
    return null;
  }

  const cacheHit = lojaPublicaCache.get(lojaId);

  if (cacheHit) {
    return cacheHit;
  }

  const request = apiRequest<LojaPublicaResumo>(`/api/lojas/${lojaId}`)
    .then(normalizarLojaPublica)
    .catch(() => null);

  lojaPublicaCache.set(lojaId, request);
  return request;
}
