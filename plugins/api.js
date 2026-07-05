import { useTokenState } from '~/core/api'

const RATE_LIMIT_STATUS = 429
const DEFAULT_RATE_LIMIT_MESSAGE = 'Too many requests. Please try again later.'

const resolveTokenPayload = (res) => {
  if (!res) return { token: '', expiresAt: 0 }

  return {
    token: res.accessToken?.token || res.accessToken || '',
    expiresAt: Date.parse(res.accessToken?.expiration || '') || Number(res.accessTokenExpirationUtc || 0) * 1000
  }
}

const resolveErrorStatus = (error) => Number(
  error?.status ||
  error?.statusCode ||
  error?.response?.status ||
  error?.data?.status ||
  error?.data?.statusCode ||
  0
)

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl || undefined
  const { accessToken, setToken, clearToken } = useTokenState()
  let refreshAccessTokenPromise = null
  let authExpiredNotified = false

  const notifyAuthExpiredOnce = () => {
    if (!import.meta.client || authExpiredNotified) return
    authExpiredNotified = true
    window.dispatchEvent(new CustomEvent('short-drama:auth-expired'))
  }

  const decorateRateLimitError = (error) => {
    const errorData = error?.data || {}
    error.data = {
      ...errorData,
      code: 'rate_limited',
      message: errorData.message || DEFAULT_RATE_LIMIT_MESSAGE
    }
    error.message = error.data.message
    return error
  }

  const performRequest = async (url, options, headers) => {
    try {
      return await $fetch(url, {
        baseURL,
        credentials: 'include',
        ...options,
        headers
      })
    } catch (error) {
      if (resolveErrorStatus(error) === RATE_LIMIT_STATUS) throw decorateRateLimitError(error)
      throw error
    }
  }

  const refreshAccessToken = () => {
    if (!refreshAccessTokenPromise) {
      refreshAccessTokenPromise = (async () => {
        const res = await performRequest('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        }, new Headers())
        const tokenPayload = resolveTokenPayload(res)
        if (!tokenPayload.token) throw new Error('Refresh token failed')
        setToken(tokenPayload.token, tokenPayload.expiresAt)
        authExpiredNotified = false
        return tokenPayload.token
      })().finally(() => {
        refreshAccessTokenPromise = null
      })
    }
    return refreshAccessTokenPromise
  }

  const apiFetch = async (url, options = {}, meta = {}) => {
    const headers = new Headers(options.headers || {})
    if (meta.auth !== false && accessToken.value) {
      headers.set('Authorization', `Bearer ${accessToken.value}`)
    }

    try {
      return await performRequest(url, options, headers)
    } catch (error) {
      const status = resolveErrorStatus(error)
      if (status === RATE_LIMIT_STATUS) throw error
      if (status !== 401 || meta.retry === false || meta.auth === false) throw error

      let nextToken = ''
      try {
        nextToken = await refreshAccessToken()
      } catch (refreshError) {
        clearToken()
        notifyAuthExpiredOnce()
        throw refreshError
      }

      const retryHeaders = new Headers(options.headers || {})
      retryHeaders.set('Authorization', `Bearer ${nextToken}`)
      return await performRequest(url, options, retryHeaders)
    }
  }

  return {
    provide: {
      apiFetch
    }
  }
})
