import { apiRequest } from "../http/apiClient";
import { saveSession, type SessionUser } from "./session";

export type LoginResponse = {
  mensagem: string;
  token: string;
  tokenExpiraEm: string;
  usuario: SessionUser;
};

export type RegistrarUsuarioPayload = {
  cpf: string;
  nome: string;
  sobrenome: string;
  email: string;
  password: string;
  confirmPassword: string;
  aceitouTermos: boolean;
  telefones: Array<{
    ddd: string;
    numero: string;
    isPrincipal?: boolean;
  }>;
  enderecos?: Array<{
    cep: string;
    tipoLogradouro: string;
    nomeEndereco: string;
    numero: string;
    complemento?: string;
    cidade: string;
    uf: string;
    isPrincipal?: boolean;
  }>;
};

export type RegistrarUsuarioResponse = {
  mensagem: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    emailConfirmado: boolean;
  };
};

export type ConfirmacaoEmailResponse = {
  mensagem: string;
};

export async function loginUsuario(email: string, senha: string) {
  const data = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: {
      email: email,
      password: senha,
    },
  });

  saveSession(data);
  return data;
}

export async function registrarUsuario(payload: RegistrarUsuarioPayload) {
  return apiRequest<RegistrarUsuarioResponse>("/api/usuario/registrar", {
    method: "POST",
    body: payload,
  });
}

export async function confirmarEmail(token: string) {
  const query = new URLSearchParams({ token }).toString();

  return apiRequest<ConfirmacaoEmailResponse>(`/api/auth/confirmar-email?${query}`, {
    method: "GET",
  });
}

export async function reenviarConfirmacaoEmail(email: string) {
  return apiRequest<ConfirmacaoEmailResponse>("/api/auth/reenviar-confirmacao-email", {
    method: "POST",
    body: {
      email,
    },
  });
}
