import { clearSession, getAuthToken } from "../auth/session";

const DEFAULT_API_BASE_URL = "https://omnimarket-api.azurewebsites.net";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | FormData | null | Record<string, unknown> | unknown[];
  authenticated?: boolean;
};

const API_MESSAGE_KEYS = new Set(["mensagem", "message", "title"]);

const API_FIELD_LABELS: Record<string, string> = {
  cpf: "CPF",
  nome: "nome",
  sobrenome: "sobrenome",
  email: "e-mail",
  password: "senha",
  confirmpassword: "confirmacao de senha",
  aceitoutermos: "aceite dos termos",
  telefones: "telefones",
  ddd: "DDD",
  numero: "numero",
  numeroe164: "telefone",
  datanascimento: "data de nascimento",
  tipologradouro: "tipo de logradouro",
  nomeendereco: "nome do endereco",
  complemento: "complemento",
  cep: "CEP",
  cidade: "cidade",
  uf: "UF",
  enderecoid: "endereco",
  tipoentregaid: "tipo de entrega",
  produtoid: "produto",
  quantidade: "quantidade",
  tipodocumentofiscal: "tipo de documento fiscal",
  documentofiscal: "documento fiscal",
  nomefantasia: "nome fantasia",
  emailcontato: "e-mail de contato",
  descricao: "descricao",
  preco: "preco",
  estoque: "estoque",
  valorfrete: "valor do frete",
  prazoentregadias: "prazo de entrega",
  observacao: "observacao",
  itens: "itens",
};

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function buildHeaders(headers?: HeadersInit, authenticated?: boolean) {
  const finalHeaders = new Headers(headers);

  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  if (authenticated) {
    const token = getAuthToken();

    if (!token) {
      throw new ApiError("Faca login para continuar.", 401);
    }

    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  return finalHeaders;
}

function formatApiFieldLabel(fieldPath?: string) {
  if (!fieldPath) {
    return "campo";
  }

  const lastPathSegment = fieldPath
    .replace(/^\$\./, "")
    .split(".")
    .filter(Boolean)
    .at(-1);

  const fieldName = (lastPathSegment ?? fieldPath).replace(/\[\d+\]/g, "");
  const normalizedFieldName = fieldName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const mappedFieldLabel = API_FIELD_LABELS[normalizedFieldName];

  if (mappedFieldLabel) {
    return mappedFieldLabel;
  }

  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function translateApiMessage(message: string, fieldPath?: string) {
  const sanitizedMessage = message.trim();

  if (!sanitizedMessage) {
    return message;
  }

  if (/^One or more validation errors occurred\.?$/i.test(sanitizedMessage)) {
    return "Um ou mais erros de validacao ocorreram.";
  }

  if (/^A non-empty request body is required\.?$/i.test(sanitizedMessage)) {
    return "Envie os dados obrigatorios da requisicao.";
  }

  if (/^An error occurred while processing your request\.?$/i.test(sanitizedMessage)) {
    return "Ocorreu um erro ao processar a sua solicitacao.";
  }

  if (/^Unauthorized\.?$/i.test(sanitizedMessage)) {
    return "Voce nao tem autorizacao para executar esta acao.";
  }

  if (/^The JSON value could not be converted to /i.test(sanitizedMessage)) {
    return "Nao foi possivel interpretar os dados enviados. Revise os campos informados.";
  }

  const requiredFieldMatch = sanitizedMessage.match(/^The (.+?) field is required\.?$/i);

  if (requiredFieldMatch) {
    return `O campo ${formatApiFieldLabel(fieldPath ?? requiredFieldMatch[1])} e obrigatorio.`;
  }

  const invalidEmailMatch = sanitizedMessage.match(
    /^The (.+?) field is not a valid e-?mail address\.?$/i,
  );

  if (invalidEmailMatch) {
    return `Informe um ${formatApiFieldLabel(fieldPath ?? invalidEmailMatch[1])} valido.`;
  }

  const invalidValueMatch = sanitizedMessage.match(/^The value '.*' is not valid for (.+?)\.?$/i);

  if (invalidValueMatch) {
    return `O valor informado para ${formatApiFieldLabel(fieldPath ?? invalidValueMatch[1])} nao e valido.`;
  }

  if (/^The value '.*' is not valid\.?$/i.test(sanitizedMessage)) {
    return `O valor informado para ${formatApiFieldLabel(fieldPath)} nao e valido.`;
  }

  const minArrayLengthMatch = sanitizedMessage.match(
    /^The field (.+?) must be a string or array type with a minimum length of '(\d+)'\.?$/i,
  );

  if (minArrayLengthMatch) {
    return `O campo ${formatApiFieldLabel(fieldPath ?? minArrayLengthMatch[1])} deve ter no minimo ${minArrayLengthMatch[2]} item(ns) ou caractere(s).`;
  }

  const stringLengthRangeMatch = sanitizedMessage.match(
    /^The field (.+?) must be a string with a minimum length of '?(\d+)'? and a maximum length of '?(\d+)'?\.?$/i,
  );

  if (stringLengthRangeMatch) {
    return `O campo ${formatApiFieldLabel(fieldPath ?? stringLengthRangeMatch[1])} deve ter entre ${stringLengthRangeMatch[2]} e ${stringLengthRangeMatch[3]} caracteres.`;
  }

  const maxLengthMatch = sanitizedMessage.match(
    /^The field (.+?) must be a string with a maximum length of '?(\d+)'?\.?$/i,
  );

  if (maxLengthMatch) {
    return `O campo ${formatApiFieldLabel(fieldPath ?? maxLengthMatch[1])} deve ter no maximo ${maxLengthMatch[2]} caracteres.`;
  }

  const minLengthMatch = sanitizedMessage.match(
    /^The field (.+?) must be a string with a minimum length of '?(\d+)'?\.?$/i,
  );

  if (minLengthMatch) {
    return `O campo ${formatApiFieldLabel(fieldPath ?? minLengthMatch[1])} deve ter no minimo ${minLengthMatch[2]} caracteres.`;
  }

  return sanitizedMessage;
}

function normalizeApiErrors(
  errors: Record<string, string[] | string | undefined>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(errors).map(([fieldPath, messages]) => {
      const normalizedMessages = Array.isArray(messages) ? messages : [messages];

      return [
        fieldPath,
        normalizedMessages
          .filter((message): message is string => typeof message === "string" && Boolean(message))
          .map((message) => translateApiMessage(message, fieldPath)),
      ];
    }),
  );
}

function normalizeApiPayloadMessages(payload: unknown): unknown {
  if (typeof payload === "string") {
    return translateApiMessage(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeApiPayloadMessages(item));
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const data = payload as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (key === "errors" && value && typeof value === "object" && !Array.isArray(value)) {
        return [key, normalizeApiErrors(value as Record<string, string[] | string | undefined>)];
      }

      if (API_MESSAGE_KEYS.has(key) && typeof value === "string") {
        return [key, translateApiMessage(value)];
      }

      if (value && typeof value === "object") {
        return [key, normalizeApiPayloadMessages(value)];
      }

      return [key, value];
    }),
  );
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    const sanitizedPayload = payload
      .split(/\s+at Microsoft\./i)[0]
      .split(/\s+at System\./i)[0]
      .split(/\s+HEADERS\s*=+/i)[0]
      .trim();

    return translateApiMessage(sanitizedPayload) || translateApiMessage(fallback);
  }

  if (payload && typeof payload === "object") {
    const data = payload as {
      mensagem?: string;
      message?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };

    if (data.errors) {
      const [fieldPath, firstErrorGroup] = Object.entries(data.errors)[0] ?? [];
      const firstError = firstErrorGroup?.[0];

      if (firstError) {
        return translateApiMessage(firstError, fieldPath);
      }
    }

    if (data.mensagem) {
      return translateApiMessage(data.mensagem);
    }

    if (data.message) {
      return translateApiMessage(data.message);
    }

    if (data.title) {
      return translateApiMessage(data.title);
    }
  }

  return translateApiMessage(fallback);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, authenticated = false, headers, ...requestInit } = options;
  const finalHeaders = buildHeaders(headers, authenticated);
  const requestBody =
    body instanceof FormData || typeof body === "string" || body == null
      ? body
      : JSON.stringify(body);

  if (
    requestBody != null &&
    !(requestBody instanceof FormData) &&
    !finalHeaders.has("Content-Type")
  ) {
    finalHeaders.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...requestInit,
      headers: finalHeaders,
      body: requestBody ?? undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha de rede ao acessar a API.";

    throw new ApiError(
      `Nao foi possivel conectar a API em ${API_BASE_URL}. Verifique se a URL esta correta, se a aplicacao do Azure esta publicada e se o CORS permite a origem atual. Detalhe: ${message}`,
      0,
      error,
    );
  }

  const payload = normalizeApiPayloadMessages(await parseResponse(response));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }

    throw new ApiError(
      extractErrorMessage(payload, `A requisicao falhou com status ${response.status}.`),
      response.status,
      payload,
    );
  }

  return payload as T;
}
