import { useLocalStorage } from '@vueuse/core'

const TOKEN_STORAGE_KEY = 'short_drama_access_token'
const TOKEN_EXPIRES_STORAGE_KEY = 'short_drama_access_token_expires_at'

export const decodeJwtPayload = (token) => {
  if (!token) return null
  const segment = token.split('.')[1]
  if (!segment) return null

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const binary = atob(padded)
    const json = decodeURIComponent(
      binary
        .split('')
        .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useTokenState = () => {
  const accessToken = useLocalStorage(TOKEN_STORAGE_KEY, '')
  const accessTokenExpiresAt = useLocalStorage(TOKEN_EXPIRES_STORAGE_KEY, 0)

  const restoreToken = () => {
    // useLocalStorage keeps state synchronized automatically on the client.
  }

  const setToken = (token, expiresAt) => {
    accessToken.value = token || ''
    accessTokenExpiresAt.value = Number(expiresAt || 0)
  }

  const clearToken = () => {
    setToken('', 0)
  }

  const isTokenExpired = computed(() => {
    if (!accessToken.value) return true
    if (!accessTokenExpiresAt.value) return false
    return Date.now() >= Number(accessTokenExpiresAt.value) - 30_000
  })

  return {
    accessToken,
    accessTokenExpiresAt,
    isTokenExpired,
    restoreToken,
    setToken,
    clearToken
  }
}
