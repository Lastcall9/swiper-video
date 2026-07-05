const GOOGLE_GSI_SCRIPT_ID = 'google-gsi-script'
const GOOGLE_GSI_READY_MS = 4_000
export const GOOGLE_BUTTON_WIDTH = 280
export const GOOGLE_BUTTON_HEIGHT = 40
const GOOGLE_BUTTON_MIN_MEASURED_WIDTH = 240

let googleScriptLoadPromise = null
let googleInitializedClientId = ''

export const useGooglePromptLogin = (options) => {
  const { clientId, buttonRef, buttonWidth, onSuccess, onError } = options
  const ready = ref(false)

  const waitForGoogleGlobal = () => {
    if (window.google?.accounts?.id) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const startAt = Date.now()
      const tick = () => {
        if (window.google?.accounts?.id) {
          resolve()
          return
        }
        if (Date.now() - startAt > GOOGLE_GSI_READY_MS) {
          reject(new Error('Google Identity Services ready timeout'))
          return
        }
        window.setTimeout(tick, 100)
      }
      tick()
    })
  }

  const injectGoogleScript = () => new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = GOOGLE_GSI_SCRIPT_ID
    script.async = true
    script.defer = true
    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', () => reject(new Error('Google Identity Services load failed')), { once: true })
    script.src = 'https://accounts.google.com/gsi/client'
    document.head.appendChild(script)
  })

  const ensureGoogleScript = async () => {
    if (!import.meta.client || !clientId) return
    if (window.google?.accounts?.id) return

    if (!googleScriptLoadPromise) {
      googleScriptLoadPromise = (async () => {
        if (!document.getElementById(GOOGLE_GSI_SCRIPT_ID)) {
          await injectGoogleScript()
        }
        await waitForGoogleGlobal()
      })().catch((error) => {
        googleScriptLoadPromise = null
        throw error
      })
    }

    await googleScriptLoadPromise
  }

  const resolveGoogleButtonWidth = (buttonElement) => {
    const measuredWidth = Math.floor(
      buttonWidth() || buttonElement.getBoundingClientRect().width || GOOGLE_BUTTON_WIDTH
    )

    if (!measuredWidth || measuredWidth < GOOGLE_BUTTON_MIN_MEASURED_WIDTH) {
      return GOOGLE_BUTTON_WIDTH
    }

    return Math.min(400, measuredWidth)
  }

  const syncGoogleButtonLayout = (buttonElement, width) => {
    const widthPx = `${width}px`
    const heightPx = `${GOOGLE_BUTTON_HEIGHT}px`

    buttonElement.style.width = widthPx
    buttonElement.style.height = heightPx

    const wrapper = buttonElement.firstElementChild
    if (wrapper instanceof HTMLElement) {
      wrapper.style.position = 'relative'
      wrapper.style.display = 'block'
      wrapper.style.width = widthPx
      wrapper.style.height = heightPx
      wrapper.style.overflow = 'hidden'
    }

    buttonElement.querySelectorAll('iframe').forEach((node) => {
      if (!(node instanceof HTMLIFrameElement)) return
      node.style.display = 'block'
      node.style.width = widthPx
      node.style.height = heightPx
      node.style.margin = '0'
      node.style.border = '0'
    })
  }

  const queueGoogleButtonLayoutSync = (buttonElement, width) => {
    syncGoogleButtonLayout(buttonElement, width)
    window.requestAnimationFrame(() => {
      syncGoogleButtonLayout(buttonElement, width)
    })
  }

  const renderGoogleButton = async () => {
    if (!import.meta.client || !clientId || !buttonRef.value) return

    const buttonElement = buttonRef.value
    try {
      await ensureGoogleScript()
      if (!window.google?.accounts?.id || buttonRef.value !== buttonElement) return

      if (googleInitializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onSuccess?.(response)
        })
        googleInitializedClientId = clientId
      }

      const width = resolveGoogleButtonWidth(buttonElement)
      buttonElement.innerHTML = ''
      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        width,
        text: 'continue_with'
      })
      queueGoogleButtonLayoutSync(buttonElement, width)
      ready.value = true
    } catch (error) {
      ready.value = false
      onError?.(error)
    }
  }

  return {
    ready,
    renderGoogleButton
  }
}
