import type { ChatResponse } from './types'

const configuredBase = import.meta.env.VITE_API_URL?.trim()
export const API_BASE = configuredBase
  ? configuredBase.replace(/\/$/, '')
  : '/api'

export class ApiError extends Error {
  status?: number
  requestId?: string

  constructor(
    message: string,
    options?: { status?: number; requestId?: string },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.requestId = options?.requestId
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get('X-Request-ID') ?? undefined
  const unavailable = [502, 503, 504].includes(response.status)
  let message = unavailable
    ? 'The assistant API is unavailable. Make sure FastAPI is running on port 8002.'
    : `The assistant returned an error (${response.status}).`

  try {
    const body = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>
      message?: string
    }

    if (typeof body.detail === 'string') {
      message = body.detail
    } else if (Array.isArray(body.detail)) {
      message =
        body.detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(', ') || message
    } else if (typeof body.message === 'string') {
      message = body.message
    }
  } catch {
    // Keep the status-based fallback when the response is not JSON.
  }

  return new ApiError(message, { status: response.status, requestId })
}

export async function sendChat(
  query: string,
  threadId: string,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 180_000)

  const forwardAbort = () => controller.abort()
  signal?.addEventListener('abort', forwardAbort)

  try {
    const response = await fetch(`${API_BASE}/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, thread_id: threadId }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw await parseError(response)
    }

    return (await response.json()) as ChatResponse
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        'The request took too long. The assistant may still be processing it — wait a moment, then check your bag.',
      )
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        'Could not reach the assistant. Make sure the FastAPI server is running on port 8002.',
      )
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Something unexpected happened.',
    )
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}
