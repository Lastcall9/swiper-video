const TURNSTILE_SCRIPT_ID = 'turnstile-script'
const TURNSTILE_API_READY_MS = 20_000

let turnstileScriptLoadPromise = null

export const useTurnstileScript = () => {
  const turnstileToken = ref('')
  const isVerified = ref(false)
  const turnstileContainerRef = ref(null)
  const widgetId = ref(null)

  const clearVerifiedState = () => {
    turnstileToken.value = ''
    isVerified.value = false
  }

  const waitForTurnstileGlobal = () => {
    if (window.turnstile) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const startAt = Date.now()
      const tick = () => {
        if (window.turnstile) {
          resolve()
          return
        }
        if (Date.now() - startAt > TURNSTILE_API_READY_MS) {
          reject(new Error('Turnstile API ready timeout'))
          return
        }
        window.setTimeout(tick, 50)
      }
      tick()
    })
  }

  const injectTurnstileScript = () => new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile script load failed')), { once: true })
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    document.head.appendChild(script)
  })

  const ensureTurnstileScript = async () => {
    if (!import.meta.client) return
    if (window.turnstile) return

    if (!turnstileScriptLoadPromise) {
      turnstileScriptLoadPromise = (async () => {
        if (!document.getElementById(TURNSTILE_SCRIPT_ID)) {
          await injectTurnstileScript()
        }
        await waitForTurnstileGlobal()
      })().catch((error) => {
        turnstileScriptLoadPromise = null
        throw error
      })
    }

    await turnstileScriptLoadPromise
  }

  const renderTurnstile = async (siteKey, options = {}) => {
    if (!import.meta.client || !siteKey || !turnstileContainerRef.value) return

    await ensureTurnstileScript()
    const turnstile = window.turnstile
    if (!turnstile || !turnstileContainerRef.value) return

    if (widgetId.value && turnstile.remove) {
      turnstile.remove(widgetId.value)
      widgetId.value = null
    }

    clearVerifiedState()
    widgetId.value = turnstile.render(turnstileContainerRef.value, {
      sitekey: siteKey,
      size: options.size || 'normal',
      callback: (token) => {
        turnstileToken.value = token
        isVerified.value = true
      },
      'error-callback': clearVerifiedState,
      'expired-callback': clearVerifiedState
    })
  }

  const resetTurnstile = () => {
    if (import.meta.client && window.turnstile && widgetId.value) {
      window.turnstile.reset(widgetId.value)
    }
    clearVerifiedState()
  }

  const destroyTurnstile = () => {
    if (import.meta.client && window.turnstile && widgetId.value && window.turnstile.remove) {
      window.turnstile.remove(widgetId.value)
    }
    widgetId.value = null
    clearVerifiedState()
  }

  onBeforeUnmount(destroyTurnstile)

  return {
    turnstileToken,
    isVerified,
    turnstileContainerRef,
    renderTurnstile,
    resetTurnstile,
    destroyTurnstile
  }
}
