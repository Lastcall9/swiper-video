<template>
  <div class="auth-status">
    <template v-if="authStore.isAuthenticated">
      <span class="auth-status__name">{{ authStore.userLabel }}</span>
      <button type="button" @click="logout">退出</button>
    </template>

    <template v-else>
      <button type="button" @click="uiStore.openAuth('login')">登录</button>
      <button type="button" @click="uiStore.openAuth('register')">注册</button>
    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

const authStore = useAuthStore()
const uiStore = useUiStore()

const logout = async () => {
  await authStore.logout()
  uiStore.toast('已退出登录', 'success')
}
</script>

<style scoped lang="scss">
.auth-status {
  position: fixed;
  left: 14px;
  top: max(14px, env(safe-area-inset-top));
  z-index: 20;
  display: flex;
  max-width: calc(100vw - 28px);
  align-items: center;
  gap: 8px;
}

.auth-status button,
.auth-status__name {
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 13px;
  backdrop-filter: blur(12px);
}

.auth-status__name {
  display: inline-flex;
  max-width: 160px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
