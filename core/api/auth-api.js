import { useApiClient } from './http'

export const useAuthApi = () => {
  const api = useApiClient()

  return {
    loginWithGoogle: (payload) => api('/api/auth/google/login', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    }, { auth: false }),

    humanVerificationRequired: (payload) => api('/api/auth/human-verification/required', {
      method: 'POST',
      body: payload
    }, { auth: false }),

    sendEmailCode: (payload) => api('/api/auth/email/register/code', {
      method: 'POST',
      body: payload
    }, { auth: false }),

    requestPasswordReset: (payload) => api('/api/auth/email/password/reset/request', {
      method: 'POST',
      body: payload
    }, { auth: false }),

    confirmPasswordReset: (payload) => api('/api/auth/email/password/reset/confirm', {
      method: 'POST',
      body: payload
    }, { auth: false }),

    registerWithEmail: (payload) => api('/api/auth/email/register', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    }, { auth: false }),

    login: (payload) => api('/api/auth/email/login', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    }, { auth: false }),

    refreshToken: () => api('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    }, { auth: false, retry: false }),

    logout: () => api('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }, { retry: false })
  }
}
