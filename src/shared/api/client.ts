export const BASE_URL = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
  }
}

// A generic return type alone cannot validate JSON. Every caller supplies a guard.
export async function fetchJson<T>(
  path: string,
  validate: (value: unknown) => value is T,
  options?: RequestInit,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<T> {
  let response: Response
  try {
    response = await fetcher(`${BASE_URL}${path}`, options)
  } catch (cause) {
    // Status 0 means no HTTP response was received (including aborted requests).
    throw new ApiError('The API request could not reach the server.', 0, { cause })
  }
  if (!response.ok)
    throw new ApiError(`API request failed (HTTP ${response.status}).`, response.status)

  let value: unknown
  try {
    value = await response.json()
  } catch (cause) {
    throw new ApiError('The API response could not be read as JSON.', response.status, { cause })
  }
  if (!validate(value))
    throw new ApiError('The API response has an invalid format.', response.status)
  return value
}
