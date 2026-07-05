<template>
  <Teleport to="body">
    <div v-if="uiStore.authVisible" class="auth-modal" role="dialog" aria-modal="true">
      <div class="auth-panel">
        <header class="auth-panel__header">
          <div>
            <h2>{{ title }}</h2>
            <p>{{ subtitle }}</p>
          </div>
          <button type="button" class="auth-close" @click="close">Close</button>
        </header>

        <div v-if="uiStore.authMode !== 'googleInvite'" class="auth-tabs">
          <button
            type="button"
            :class="{ active: uiStore.authMode === 'login' }"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            :class="{ active: uiStore.authMode === 'register' }"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <template v-if="uiStore.authMode === 'googleInvite'">
            <label>
              邀请码
              <input v-model.trim="form.inviteCode" autocomplete="one-time-code" placeholder="请输入邀请码">
            </label>
          </template>

          <template v-else>
            <label>
              邮箱
              <input v-model.trim="form.email" autocomplete="email" inputmode="email" placeholder="name@example.com">
            </label>

            <label>
              密码
              <input
                v-model="form.password"
                :type="passwordVisible ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
              >
            </label>

            <label v-if="isRegister">
              邮箱验证码
              <div class="code-row">
                <input v-model.trim="form.verificationCode" autocomplete="one-time-code" placeholder="验证码">
                <button type="button" :disabled="sendCodeDisabled" @click="sendRegisterEmailCode">
                  {{ emailCodeCooldown > 0 ? `${emailCodeCooldown}s` : '发送' }}
                </button>
              </div>
            </label>

            <label v-if="isRegister">
              邀请码
              <input v-model.trim="form.inviteCode" autocomplete="off" placeholder="可选">
            </label>

            <label class="checkbox-row">
              <input v-model="passwordVisible" type="checkbox">
              显示密码
            </label>
          </template>

          <div v-if="shouldShowHumanVerificationLoading" class="auth-note">
            正在检查人机验证...
          </div>

          <div v-show="shouldShowTurnstile" ref="turnstileContainerRef" class="turnstile-box" />

          <p v-if="formError" class="auth-error">{{ formError }}</p>

          <button class="auth-submit" type="submit" :disabled="authStore.loading">
            {{ authStore.loading ? '处理中...' : primaryText }}
          </button>
        </form>

        <div v-if="googleClientId && uiStore.authMode !== 'googleInvite'" class="google-area">
          <div class="divider">或</div>
          <div ref="googleButtonRef" class="google-button" />
        </div>

        <button v-if="uiStore.authMode === 'googleInvite'" class="text-button" type="button" @click="switchMode(googleInviteReturnMode)">
          返回{{ googleInviteReturnMode === 'register' ? '注册' : '登录' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useGooglePromptLogin } from '~/composables/auth/useGooglePromptLogin'
import { useHumanVerification } from '~/composables/auth/useHumanVerification'
import { getApiErrorMessage } from '~/core/api'
import { AUTH_PASSWORD_RULE_TEXT, isAuthPasswordValid } from '~/features/auth/password-policy'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_CODE_COOLDOWN_SECONDS = 60

const authStore = useAuthStore()
const uiStore = useUiStore()
const runtimeConfig = useRuntimeConfig()
const { authVisible, authMode } = storeToRefs(uiStore)

const form = reactive({
  email: '',
  password: '',
  verificationCode: '',
  inviteCode: ''
})
const formError = ref('')
const passwordVisible = ref(false)
const sendingEmailCode = ref(false)
const emailCodeCooldown = ref(0)
const emailCodeRequested = ref(false)
const pendingGoogleIdToken = ref('')
const googleInviteReturnMode = ref('login')
const googleButtonRef = ref(null)

const googleClientId = computed(() => runtimeConfig.public.googleClientId || '')
const googleRegisterInviteCodeRequired = computed(() => runtimeConfig.public.googleInviteCodeRequired !== false)
const isRegister = computed(() => authMode.value === 'register')
const title = computed(() => {
  if (authMode.value === 'register') return '注册账号'
  if (authMode.value === 'googleInvite') return '填写邀请码'
  return '登录账号'
})
const subtitle = computed(() => {
  if (authMode.value === 'register') return '注册后可继续观看、收藏和解锁剧集'
  if (authMode.value === 'googleInvite') return 'Google 注册需要先绑定邀请码'
  return '登录后可继续观看、收藏和解锁剧集'
})
const primaryText = computed(() => {
  if (authMode.value === 'register') return '注册'
  if (authMode.value === 'googleInvite') return '继续'
  return '登录'
})
const sendCodeDisabled = computed(() => (
  sendingEmailCode.value ||
  emailCodeCooldown.value > 0 ||
  !form.email
))

const {
  turnstileContainerRef,
  shouldShowTurnstile,
  shouldShowHumanVerificationLoading,
  checkHumanVerification,
  ensureTurnstileReady,
  getVerifiedTurnstileToken,
  resetTurnstile,
  destroyTurnstile
} = useHumanVerification()

const { pause: pauseEmailCodeCooldown, resume: resumeEmailCodeCooldown } = useIntervalFn(() => {
  emailCodeCooldown.value = Math.max(emailCodeCooldown.value - 1, 0)
  if (emailCodeCooldown.value === 0) pauseEmailCodeCooldown()
}, 1000, { immediate: false })

const showFormError = (message) => {
  formError.value = message
  uiStore.toast(message, 'error')
}

const validateEmail = () => {
  if (!form.email) {
    showFormError('请输入邮箱')
    return false
  }
  if (!EMAIL_PATTERN.test(form.email)) {
    showFormError('邮箱格式不正确')
    return false
  }
  formError.value = ''
  return true
}

const validateAuthForm = () => {
  if (!validateEmail()) return false
  if (!form.password) {
    showFormError('请输入密码')
    return false
  }
  if (isRegister.value && !isAuthPasswordValid(form.password)) {
    showFormError(AUTH_PASSWORD_RULE_TEXT)
    return false
  }
  if (isRegister.value && !form.verificationCode) {
    showFormError('请输入邮箱验证码')
    return false
  }
  formError.value = ''
  return true
}

const startEmailCodeCooldown = () => {
  pauseEmailCodeCooldown()
  emailCodeCooldown.value = EMAIL_CODE_COOLDOWN_SECONDS
  resumeEmailCodeCooldown()
}

const resetEmailCodeCooldown = () => {
  pauseEmailCodeCooldown()
  emailCodeCooldown.value = 0
}

const resetAuthForm = () => {
  form.email = ''
  form.password = ''
  form.verificationCode = ''
  form.inviteCode = ''
  formError.value = ''
  passwordVisible.value = false
  sendingEmailCode.value = false
  emailCodeRequested.value = false
  pendingGoogleIdToken.value = ''
  googleInviteReturnMode.value = 'login'
  resetEmailCodeCooldown()
}

const close = () => {
  uiStore.closeAuth()
}

const switchMode = (mode) => {
  if (authMode.value === 'googleInvite' && mode !== 'googleInvite') {
    pendingGoogleIdToken.value = ''
  }
  uiStore.switchAuthMode(mode)
  formError.value = ''
  nextTick(() => {
    if (mode !== 'googleInvite') void queueGoogleButtonRender()
  })
}

const completeGoogleAuth = async (response, options = {}) => {
  try {
    await authStore.googleLogin(response, { inviteCode: options.inviteCode || undefined })
    pendingGoogleIdToken.value = ''
    uiStore.toast(googleInviteReturnMode.value === 'register' ? '注册成功' : '登录成功', 'success')
    uiStore.closeAuth()
  } catch (error) {
    uiStore.toast(getApiErrorMessage(error, '认证失败'), 'error')
  }
}

const handleGoogleSuccess = async (response) => {
  const idToken = response?.credential || response?.idToken || ''
  if (!idToken) return

  const isGoogleRegister = authMode.value === 'register'
  googleInviteReturnMode.value = isGoogleRegister ? 'register' : 'login'
  formError.value = ''

  if (!isGoogleRegister || !googleRegisterInviteCodeRequired.value) {
    await completeGoogleAuth({ credential: idToken })
    return
  }

  pendingGoogleIdToken.value = idToken
  form.inviteCode = ''
  switchMode('googleInvite')
}

const { renderGoogleButton } = useGooglePromptLogin({
  clientId: googleClientId.value,
  buttonRef: googleButtonRef,
  buttonWidth: () => googleButtonRef.value?.getBoundingClientRect?.().width,
  onSuccess: handleGoogleSuccess,
  onError: (error) => {
    if (import.meta.dev) console.warn('Google Identity Services load failed', error)
  }
})

const queueGoogleButtonRender = async () => {
  if (!import.meta.client || authMode.value === 'googleInvite') return
  await nextTick()
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
  })
  await renderGoogleButton()
}

const sendRegisterEmailCode = async () => {
  if (sendingEmailCode.value || emailCodeCooldown.value > 0) return
  if (!validateEmail()) return

  const verifiedToken = getVerifiedTurnstileToken()
  if (verifiedToken === null) return

  sendingEmailCode.value = true
  try {
    await authStore.sendEmailCode(form.email, {
      resend: emailCodeRequested.value,
      turnstileToken: verifiedToken
    })
    emailCodeRequested.value = true
    startEmailCodeCooldown()
    uiStore.toast('验证码已发送', 'success')
    resetTurnstile()
  } catch (error) {
    uiStore.toast(getApiErrorMessage(error, '验证码发送失败'), 'error')
    resetTurnstile()
  } finally {
    sendingEmailCode.value = false
  }
}

const submitGoogleInvite = async () => {
  if (!form.inviteCode) {
    showFormError('请输入邀请码')
    return
  }
  if (!pendingGoogleIdToken.value) {
    switchMode(googleInviteReturnMode.value || 'login')
    return
  }

  await completeGoogleAuth({ credential: pendingGoogleIdToken.value }, { inviteCode: form.inviteCode })
}

const submit = async () => {
  if (authMode.value === 'googleInvite') {
    await submitGoogleInvite()
    return
  }

  if (!validateAuthForm()) return

  const verifiedToken = isRegister.value ? '' : getVerifiedTurnstileToken()
  if (verifiedToken === null) return

  try {
    if (isRegister.value) {
      await authStore.register({ ...form })
      uiStore.toast('注册成功', 'success')
      uiStore.closeAuth()
      return
    }

    await authStore.login({
      ...form,
      turnstileToken: verifiedToken
    })
    uiStore.toast('登录成功', 'success')
    uiStore.closeAuth()
  } catch (error) {
    uiStore.toast(getApiErrorMessage(error, '认证失败'), 'error')
    resetTurnstile()
  }
}

watch(authVisible, async (visible) => {
  if (!visible) {
    destroyTurnstile()
    resetAuthForm()
    return
  }

  await checkHumanVerification()
  await ensureTurnstileReady()
  await queueGoogleButtonRender()
}, { flush: 'post' })

watch(authMode, async () => {
  await ensureTurnstileReady()
  await queueGoogleButtonRender()
}, { flush: 'post' })

onBeforeUnmount(() => {
  resetEmailCodeCooldown()
})
</script>

<style scoped lang="scss">
.auth-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.68);
}

.auth-panel {
  width: min(390px, 100%);
  max-height: min(720px, calc(100dvh - 36px));
  overflow: auto;
  border-radius: 8px;
  padding: 18px;
  background: #101010;
  color: #fff;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}

.auth-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.68);
    font-size: 13px;
    line-height: 1.5;
  }
}

.auth-close,
.text-button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.auth-tabs {
  button {
    height: 42px;
    border: 0;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;

    &.active {
      background: #fff;
      color: #070707;
    }
  }
}

.auth-form {
  display: grid;
  gap: 12px;
}

.auth-form {
  label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.74);
  }

  input {
    height: 42px;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 6px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    outline: none;
  }
}

.auth-submit,
.code-row button {
  height: 42px;
  border: 0;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.auth-submit {
  background: #fff;
  color: #070707;
}

.code-row {
  display: grid;
  grid-template-columns: 1fr 88px;
  gap: 8px;
}

.checkbox-row {
  display: flex !important;
  align-items: center;
  gap: 8px;
}

.checkbox-row {
  input {
    width: 16px;
    height: 16px;
  }
}

.auth-note,
.auth-error {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.auth-note {
  color: rgba(255, 255, 255, 0.68);
}

.auth-error {
  color: #ff8b8b;
}

.turnstile-box {
  min-height: 0;
}

.google-area {
  margin-top: 16px;
}

.divider {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
  text-align: center;
}

.google-button {
  display: grid;
  min-height: 40px;
  place-items: center;
}

.text-button {
  margin-top: 14px;
  width: 100%;
}
</style>
