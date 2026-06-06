import { apiRequest } from "../http/apiClient";

export type EnderecoApiResponse = {
  id: number;
  tipoLogradouro: string;
  nomeEndereco: string;
  numero: string;
  complemento?: string | null;
  cep: string;
  cidade: string;
  uf: string;
  isPrincipal: boolean;
  ativo: boolean;
};

export type EnderecoPayload = {
  cep: string;
  tipoLogradouro: string;
  nomeEndereco: string;
  numero: string;
  complemento?: string;
  cidade: string;
  uf: string;
  isPrincipal?: boolean;
};

export type TipoLogradouroOption = {
  codigo: string;
  descricao: string;
};

export const TIPOS_LOGRADOURO_FALLBACK: TipoLogradouroOption[] = [
  { codigo: "Rua", descricao: "Rua (R)" },
  { codigo: "Avenida", descricao: "Avenida (AV)" },
  { codigo: "Travessa", descricao: "Travessa (TV)" },
  { codigo: "Alameda", descricao: "Alameda (AL)" },
  { codigo: "Praca", descricao: "Praca (PC)" },
  { codigo: "Estrada", descricao: "Estrada (EST)" },
  { codigo: "Rodovia", descricao: "Rodovia (ROD)" },
  { codigo: "Viela", descricao: "Viela (VLA)" },
  { codigo: "Vila", descricao: "Vila (VL)" },
  { codigo: "Largo", descricao: "Largo (LRG)" },
  { codigo: "Ladeira", descricao: "Ladeira (LD)" },
  { codigo: "Conjunto", descricao: "Conjunto (CJ)" },
  { codigo: "Quadra", descricao: "Quadra (Q)" },
  { codigo: "Beco", descricao: "Beco (BC)" },
];

export async function listarEnderecos(usuarioId: number, incluirInativos = false) {
  const query = incluirInativos ? "?incluirInativos=true" : "";

  return apiRequest<EnderecoApiResponse[]>(
    `/api/usuarios/${usuarioId}/enderecos${query}`,
    {
      authenticated: true,
    },
  );
}

export async function criarEndereco(usuarioId: number, payload: EnderecoPayload) {
  return apiRequest<EnderecoApiResponse>(`/api/usuarios/${usuarioId}/enderecos`, {
    method: "POST",
    authenticated: true,
    body: payload,
  });
}

export async function atualizarEndereco(
  usuarioId: number,
  enderecoId: number,
  payload: EnderecoPayload,
) {
  return apiRequest<EnderecoApiResponse>(
    `/api/usuarios/${usuarioId}/enderecos/${enderecoId}`,
    {
      method: "PUT",
      authenticated: true,
      body: payload,
    },
  );
}

export async function listarTiposLogradouro(usuarioId: number) {
  return apiRequest<TipoLogradouroOption[]>(
    `/api/usuarios/${usuarioId}/enderecos/tipos-logradouro`,
    {
      authenticated: true,
    },
  );
}

export async function removerEndereco(usuarioId: number, enderecoId: number) {
  return apiRequest<{ mensagem: string }>(
    `/api/usuarios/${usuarioId}/enderecos/${enderecoId}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}
