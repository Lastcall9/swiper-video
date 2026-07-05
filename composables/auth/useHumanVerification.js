import { useTurnstileScript } from '~/composables/auth/useTurnstileScript'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

const TURNSTILE_NORMAL_MIN_WIDTH = 300

export const useHumanVerification = () => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  const runtimeConfig = useRuntimeConfig()
  const checkingHumanVerification = ref(false)
  const hasCheckedHumanVerification = ref(false)
  const requiresHumanVerification = ref(false)
  const turnstile = useTurnstileScript()
  const { turnstileToken, isVerified, turnstileContainerRef, renderTurnstile, resetTurnstile, destroyTurnstile } = turnstile

  const apiBaseUrl = computed(() => runtimeConfig.public.apiBaseUrl || '')
  const turnstileSiteKey = computed(() => runtimeConfig.public.turnstileSiteKey || '')
  const hasTurnstileSiteKey = computed(() => Boolean(turnstileSiteKey.value))
  const isWaitingHumanVerificationCheck = computed(() => (
    checkingHumanVerification.value || !hasCheckedHumanVerification.value
  ))
  const shouldShowTurnstile = computed(() => (
    hasCheckedHumanVerification.value &&
    requiresHumanVerification.value &&
    hasTurnstileSiteKey.value
  ))
  const shouldShowHumanVerificationLoading = computed(() => (
    checkingHumanVerification.value && !shouldShowTurnstile.value
  ))
  const hasValidTurnstileToken = computed(() => isVerified.value && Boolean(turnstileToken.value))

  const buildHumanVerificationPayload = () => {
    if (!import.meta.client) return {}
    const nav = window.navigator || {}
    return {
      screenWidth: window.innerWidth || 0,
      screenHeight: window.innerHeight || 0,
      lang: nav.language || '',
      timeZoneOffset: new Date().getTimezoneOffset(),
      touchable: Number(nav.maxTouchPoints || 0) > 0,
      pixelRatio: window.devicePixelRatio || 1,
      memory: nav.deviceMemory || 0,
      cores: nav.hardwareConcurrency || 0
    }
  }

  const resolveHumanVerificationRequired = async () => {
    if (!apiBaseUrl.value) return false

    try {
      return await authStore.checkHumanVerificationRequired(buildHumanVerificationPayload())
    } catch (error) {
      if (import.meta.dev) console.warn('human verification check failed, fallback to site-key policy', error)
      return hasTurnstileSiteKey.value
    }
  }

  const applyHumanVerificationRequirement = (required) => {
    requiresHumanVerification.value = required
    if (!required) {
      isVerified.value = true
    }
  }

  const resolveTurnstileSize = () => {
    if (!import.meta.client) return 'normal'
    const containerWidth = turnstileContainerRef.value?.getBoundingClientRect?.().width || window.innerWidth
    return containerWidth < TURNSTILE_NORMAL_MIN_WIDTH ? 'compact' : 'normal'
  }

  const checkHumanVerification = async () => {
    if (!import.meta.client || hasCheckedHumanVerification.value) return

    checkingHumanVerification.value = true
    try {
      const required = await resolveHumanVerificationRequired()
      applyHumanVerificationRequirement(required)
    } finally {
      hasCheckedHumanVerification.value = true
      checkingHumanVerification.value = false
    }
  }

  const ensureTurnstileReady = async () => {
    if (!shouldShowTurnstile.value) return
    await nextTick()
    await renderTurnstile(turnstileSiteKey.value, { size: resolveTurnstileSize() })
  }

  const getVerifiedTurnstileToken = () => {
    if (isWaitingHumanVerificationCheck.value) {
      uiStore.toast('正在检查人机验证，请稍后', 'info')
      return null
    }
    if (!requiresHumanVerification.value) return ''
    if (!hasTurnstileSiteKey.value) {
      uiStore.toast('人机验证配置缺失', 'error')
      return null
    }
    if (hasValidTurnstileToken.value) return turnstileToken.value
    uiStore.toast('请先完成人机验证', 'error')
    return null
  }

  return {
    turnstileContainerRef,
    shouldShowTurnstile,
    shouldShowHumanVerificationLoading,
    checkHumanVerification,
    ensureTurnstileReady,
    getVerifiedTurnstileToken,
    resetTurnstile,
    destroyTurnstile
  }
}
