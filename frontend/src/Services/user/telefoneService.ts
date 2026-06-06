import { apiRequest } from "../http/apiClient";
import { formatarTelefone } from "../../utils/masks";

export type TelefoneApiResponse = {
  id: number;
  numero: string;
  isPrincipal: boolean;
};

export type TelefonePayload = {
  ddd: string;
  numero: string;
  isPrincipal?: boolean;
};

function extrairTelefoneNacional(telefone: string) {
  const digitsOnly = telefone.replace(/\D/g, "");

  if (digitsOnly.startsWith("55") && digitsOnly.length >= 12) {
    return digitsOnly.slice(2);
  }

  return digitsOnly;
}

export function formatarTelefoneParaExibicao(telefone: string) {
  const telefoneNacional = extrairTelefoneNacional(telefone);

  if (telefoneNacional.length < 10) {
    return telefone;
  }

  return formatarTelefone(telefoneNacional);
}

export function normalizarTelefoneParaApi(
  telefone: string,
  isPrincipal?: boolean,
): TelefonePayload {
  const digitsOnly = extrairTelefoneNacional(telefone);

  if (digitsOnly.length < 10) {
    throw new Error("Informe um telefone com DDD valido.");
  }

  return {
    ddd: digitsOnly.slice(0, 2),
    numero: digitsOnly.slice(2, 11),
    isPrincipal,
  };
}

export async function listarTelefones() {
  return apiRequest<TelefoneApiResponse[]>("/api/telefones", {
    authenticated: true,
  });
}

export async function criarTelefone(payload: TelefonePayload) {
  return apiRequest<{ mensagem: string }>("/api/telefones", {
    method: "POST",
    authenticated: true,
    body: payload,
  });
}

export async function atualizarTelefone(telefoneId: number, payload: TelefonePayload) {
  return apiRequest<{ mensagem: string }>(`/api/telefones/${telefoneId}`, {
    method: "PUT",
    authenticated: true,
    body: payload,
  });
}

export async function removerTelefone(telefoneId: number) {
  return apiRequest<{ mensagem: string }>(`/api/telefones/${telefoneId}`, {
    method: "DELETE",
    authenticated: true,
  });
}
