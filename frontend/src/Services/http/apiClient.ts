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

    return sanitizedPayload || fallback;
  }

  if (payload && typeof payload === "object") {
    const data = payload as {
      mensagem?: string;
      message?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };

    if (data.mensagem) {
      return data.mensagem;
    }

    if (data.message) {
      return data.message;
    }

    if (data.title) {
      return data.title;
    }

    if (data.errors) {
      const firstErrorGroup = Object.values(data.errors)[0];
      const firstError = firstErrorGroup?.[0];

      if (firstError) {
        return firstError;
      }
    }
  }

  return fallback;
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

  const payload = await parseResponse(response);

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
