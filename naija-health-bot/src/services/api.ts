/**
 * Central API client. Keep fetch logic out of screens (systemprompt §7).
 * Base URL comes from env — never hardcode secrets.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL when the backend is ready.'
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new ApiError('Unable to reach 9ja Health services.', response.status);
  }

  return (await response.json()) as T;
}
