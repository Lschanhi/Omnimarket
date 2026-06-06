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
  }>;
};

export type RegistrarUsuarioResponse = {
  mensagem: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
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
