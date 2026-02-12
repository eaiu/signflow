const TOKEN_KEY = 'signflow_api_token'

export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setApiToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function isAuthenticated() {
  return Boolean(getApiToken())
}

export function clearApiToken() {
  localStorage.removeItem(TOKEN_KEY)
}
