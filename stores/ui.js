import { acceptHMRUpdate, defineStore } from 'pinia'

let toastId = 0

export const useUiStore = defineStore('ui', () => {
  const authVisible = ref(false)
  const authMode = ref('login')
  const toasts = ref([])

  const openAuth = (mode = 'login') => {
    authMode.value = mode
    authVisible.value = true
  }

  const closeAuth = () => {
    authVisible.value = false
  }

  const switchAuthMode = (mode) => {
    authMode.value = mode
  }

  const toast = (message, variant = 'info') => {
    if (!import.meta.client) return

    const id = ++toastId
    toasts.value.push({ id, message, variant })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((item) => item.id !== id)
    }, 2600)
  }

  return {
    authVisible,
    authMode,
    toasts,
    openAuth,
    closeAuth,
    switchAuthMode,
    toast
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUiStore, import.meta.hot))
}
