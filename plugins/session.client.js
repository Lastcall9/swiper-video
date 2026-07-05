import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  authStore.restoreSession()

  window.addEventListener('short-drama:auth-expired', () => {
    uiStore.toast('登录已过期，请重新登录', 'error')
    uiStore.openAuth('login')
  })
})
