export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

function isValidationErrors(detail: unknown): detail is ValidationErrorItem[] {
  return (
    Array.isArray(detail) &&
    detail.every((item) => typeof item === 'object' && item !== null && 'msg' in item)
  );
}

function buildErrorMessage(status: number, detail: unknown): string {
  if (typeof detail === 'string') return detail;

  if (isValidationErrors(detail)) {
    return detail.map((item) => item.msg).join('. ');
  }

  if (typeof detail === 'object' && detail !== null && 'reason' in detail) {
    return String((detail as { reason: unknown }).reason);
  }

  return `Ошибка запроса (${status})`;
}

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
};

export async function apiFetch<TResponse>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { body, headers, params, ...init } = options;

  const url = new URL(`${API_URL}${endpoint}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const isRawBody =
    typeof body === 'string' ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob;

  let requestBody: BodyInit | undefined;
  if (body === undefined) {
    requestBody = undefined;
  } else if (isRawBody) {
    requestBody = body as BodyInit;
  } else {
    requestBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        // FormData сам ставит boundary, URLSearchParams — свой Content-Type
        ...(isRawBody ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: requestBody,
    });
  } catch {
    throw new ApiError(0, null, 'Не удалось связаться с сервером');
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail ?? data;
    throw new ApiError(response.status, detail, buildErrorMessage(response.status, detail));
  }

  return data as TResponse;
}

export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
