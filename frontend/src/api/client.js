import { clearApiToken, getApiToken } from './auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getApiToken()
  if (token) headers['X-API-Token'] = token
  return headers
}

function appendTokenParam(path) {
  const token = getApiToken()
  const fullPath = path.startsWith('/') ? path : `/${path}`
  if (!token) return `${API_BASE}${fullPath}`
  const separator = fullPath.includes('?') ? '&' : '?'
  return `${API_BASE}${fullPath}${separator}api_token=${encodeURIComponent(token)}`
}

async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return true
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }
  const detail = await res.text()
  const error = new Error(detail || 'Request failed')
  error.status = res.status
  if (res.status === 401) {
    clearApiToken()
  }
  throw error
}

export async function apiGet(path) {
  const res = await fetch(appendTokenParam(path), { headers: buildHeaders() })
  return handleResponse(res)
}

export async function apiPost(path, payload) {
  const res = await fetch(appendTokenParam(path), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

export async function apiPatch(path, payload) {
  const res = await fetch(appendTokenParam(path), {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

export async function apiDelete(path) {
  const res = await fetch(appendTokenParam(path), { method: 'DELETE', headers: buildHeaders() })
  return handleResponse(res)
}

export function createLogStream(runId, onMessage, onError) {
  const url = new URL(`${API_BASE}/logs/stream`, window.location.origin)
  const token = getApiToken()
  if (token) url.searchParams.set('api_token', token)
  if (runId) url.searchParams.set('run_id', runId)
  const eventSource = new EventSource(url)
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'heartbeat') return
      onMessage(data)
    } catch (err) {
      console.error('SSE parse error', err)
    }
  }
  eventSource.onerror = () => {
    if (onError) onError()
  }
  return () => eventSource.close()
}
