import { acceptHMRUpdate, defineStore } from 'pinia'
import { decodeJwtPayload, useAccountApi, useAuthApi, useTokenState } from '~/core/api'

const resolveTokenPayload = (res) => {
  if (!res) return { token: '', expiresAt: 0 }

  return {
    token: res.accessToken?.token || res.accessToken || '',
    expiresAt: Date.parse(res.accessToken?.expiration || '') || Number(res.accessTokenExpirationUtc || 0) * 1000
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef(null)
  const loading = ref(false)
  const sessionRestoring = ref(true)
  const error = ref('')
  const { accessToken, isTokenExpired, restoreToken, setToken, clearToken } = useTokenState()

  const isAuthenticated = computed(() => Boolean(accessToken.value) && !isTokenExpired.value)
  const tokenPayload = computed(() => decodeJwtPayload(accessToken.value))
  const userLabel = computed(() => (
    user.value?.name ||
    user.value?.email ||
    user.value?.accountName ||
    tokenPayload.value?.email ||
    tokenPayload.value?.name ||
    '已登录用户'
  ))

  const restoreSession = async () => {
    sessionRestoring.value = true
    try {
      restoreToken()

      if (isAuthenticated.value) {
        const profile = await fetchUserProfile()
        if (!profile) clearSession()
        return profile
      }

      if (accessToken.value && isTokenExpired.value) {
        return await refreshSession()
      }

      clearSession()
      return null
    } finally {
      sessionRestoring.value = false
    }
  }

  const refreshSession = async () => {
    try {
      const res = await useAuthApi().refreshToken()
      const tokenPayload = resolveTokenPayload(res)
      if (!tokenPayload.token) throw new Error('Refresh token failed')
      setToken(tokenPayload.token, tokenPayload.expiresAt)
      return await fetchUserProfile()
    } catch {
      clearSession()
      return null
    }
  }

  const fetchUserProfile = async () => {
    try {
      user.value = await useAccountApi().getUserProfile()
      return user.value
    } catch {
      user.value = null
      return null
    }
  }

  const login = async (payload) => {
    loading.value = true
    error.value = ''

    try {
      const res = await useAuthApi().login({
        accountName: payload.accountName || payload.email,
        password: payload.password,
        trustDevice: true
      })
      const tokenPayload = resolveTokenPayload(res)
      setToken(tokenPayload.token, tokenPayload.expiresAt)
      await fetchUserProfile()
      return res
    } catch (err) {
      error.value = err?.data?.message || err?.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (payload) => {
    loading.value = true
    error.value = ''

    try {
      const res = await useAuthApi().registerWithEmail({
        email: payload.email,
        password: payload.password,
        verificationCode: payload.verificationCode,
        inviteCode: payload.inviteCode || undefined
      })
      const tokenPayload = resolveTokenPayload(res)
      setToken(tokenPayload.token, tokenPayload.expiresAt)
      await fetchUserProfile()
      return res
    } catch (err) {
      error.value = err?.data?.message || err?.message || '注册失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const sendEmailCode = (email, options = {}) => useAuthApi().sendEmailCode({
    email,
    resend: Boolean(options.resend),
    turnstileToken: options.turnstileToken || undefined
  })

  const requestPasswordReset = async (email, options = {}) => {
    loading.value = true
    error.value = ''

    try {
      return await useAuthApi().requestPasswordReset({
        email,
        turnstileToken: options.turnstileToken || ''
      })
    } catch (err) {
      error.value = err?.data?.message || err?.message || '发送重置链接失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const confirmPasswordReset = async (payload) => {
    loading.value = true
    error.value = ''

    try {
      return await useAuthApi().confirmPasswordReset({
        token: payload.token,
        newPassword: payload.newPassword,
        turnstileToken: payload.turnstileToken || ''
      })
    } catch (err) {
      error.value = err?.data?.message || err?.message || '重置密码失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const googleLogin = async (response, payload = {}) => {
    loading.value = true
    error.value = ''

    try {
      const res = await useAuthApi().loginWithGoogle({
        idToken: response?.credential || response?.idToken || '',
        inviteCode: payload.inviteCode || undefined
      })
      const tokenPayload = resolveTokenPayload(res)
      setToken(tokenPayload.token, tokenPayload.expiresAt)
      await fetchUserProfile()
      return res
    } catch (err) {
      error.value = err?.data?.message || err?.message || 'Google 登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkHumanVerificationRequired = async (payload) => {
    const res = await useAuthApi().humanVerificationRequired(payload)
    return res.required
  }

  const clearSession = () => {
    clearToken()
    user.value = null
    error.value = ''
    sessionRestoring.value = false
  }

  const logout = async () => {
    try {
      await useAuthApi().logout()
    } catch {
      // 本地退出优先，接口失败也清空本地登录态。
    }
    clearSession()
  }

  return {
    user,
    loading,
    sessionRestoring,
    error,
    accessToken,
    isAuthenticated,
    userLabel,
    restoreSession,
    refreshSession,
    fetchUserProfile,
    login,
    register,
    sendEmailCode,
    requestPasswordReset,
    confirmPasswordReset,
    googleLogin,
    checkHumanVerificationRequired,
    clearSession,
    logout
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
