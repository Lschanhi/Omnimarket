import { apiRequest } from "../http/apiClient";

type LojaEntregaOpcaoApiResponse = {
  id: number;
  lojaId: number;
  tipoEntrega: string;
  nome: string;
  valorFrete: number;
  prazoEntregaDias: number;
  observacao?: string | null;
  ativa: boolean;
  resumoCobertura: string;
  dataCriacao: string;
  dataAtualizacao?: string | null;
};

export type LojaEntregaFiltro = {
  cep?: string;
  cidade?: string;
  uf?: string;
};

export type TipoEntregaOption = {
  id: number;
  label: string;
};

export type LojaEntregaOpcao = LojaEntregaOpcaoApiResponse & {
  tipoEntregaId: number | null;
};

export type LojaEntregaMutacaoPayload = {
  tipoEntregaId: number;
  nome: string;
  valorFrete: number;
  prazoEntregaDias: number;
  observacao?: string;
  ativa: boolean;
};

export const TIPOS_ENTREGA_OPTIONS: TipoEntregaOption[] = [
  { id: 1, label: "Retirada" },
  { id: 2, label: "Entrega local" },
  { id: 3, label: "Correios" },
  { id: 4, label: "Motoboy" },
];

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolverTipoEntregaId(tipoEntrega: string) {
  const tipo = TIPOS_ENTREGA_OPTIONS.find(
    (option) => normalizarTexto(option.label) === normalizarTexto(tipoEntrega),
  );

  return tipo?.id ?? null;
}

function mapearOpcaoEntrega(opcao: LojaEntregaOpcaoApiResponse): LojaEntregaOpcao {
  return {
    ...opcao,
    valorFrete: Number(opcao.valorFrete ?? 0),
    prazoEntregaDias: Number(opcao.prazoEntregaDias ?? 0),
    tipoEntregaId: resolverTipoEntregaId(opcao.tipoEntrega),
  };
}

export async function listarEntregasPublicasLoja(lojaId: number, filtro?: LojaEntregaFiltro) {
  const params = new URLSearchParams();

  if (filtro?.cep?.trim()) {
    params.set("cep", filtro.cep.trim());
  }

  if (filtro?.cidade?.trim()) {
    params.set("cidade", filtro.cidade.trim());
  }

  if (filtro?.uf?.trim()) {
    params.set("uf", filtro.uf.trim().toUpperCase());
  }

  const query = params.toString();
  const rota = query
    ? `/api/lojas/${lojaId}/entregas?${query}`
    : `/api/lojas/${lojaId}/entregas`;

  const opcoes = await apiRequest<LojaEntregaOpcaoApiResponse[]>(rota);

  return opcoes.map(mapearOpcaoEntrega);
}

export async function listarMinhasEntregasLoja() {
  const opcoes = await apiRequest<LojaEntregaOpcaoApiResponse[]>("/api/lojas/minha/entregas", {
    authenticated: true,
  });

  return opcoes.map(mapearOpcaoEntrega);
}

export async function criarMinhaEntregaLoja(payload: LojaEntregaMutacaoPayload) {
  const opcao = await apiRequest<LojaEntregaOpcaoApiResponse>("/api/lojas/minha/entregas", {
    method: "POST",
    authenticated: true,
    body: payload,
  });

  return mapearOpcaoEntrega(opcao);
}

export async function atualizarMinhaEntregaLoja(
  entregaId: number,
  payload: LojaEntregaMutacaoPayload,
) {
  const opcao = await apiRequest<LojaEntregaOpcaoApiResponse>(
    `/api/lojas/minha/entregas/${entregaId}`,
    {
      method: "PUT",
      authenticated: true,
      body: payload,
    },
  );

  return mapearOpcaoEntrega(opcao);
}

export async function removerMinhaEntregaLoja(entregaId: number) {
  return apiRequest<{ mensagem: string }>(`/api/lojas/minha/entregas/${entregaId}`, {
    method: "DELETE",
    authenticated: true,
  });
}
