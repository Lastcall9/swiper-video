<template>
  <Teleport to="body">
    <div class="toast-host">
      <div
        v-for="item in uiStore.toasts"
        :key="item.id"
        class="toast"
        :class="`toast--${item.variant}`"
      >
        {{ item.message }}
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '~/stores/ui'

const uiStore = useUiStore()
</script>

<style scoped lang="scss">
.toast-host {
  position: fixed;
  left: 50%;
  top: max(18px, env(safe-area-inset-top));
  z-index: 2000;
  display: grid;
  width: min(320px, calc(100vw - 32px));
  gap: 8px;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(18, 18, 18, 0.92);
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.28);
}

.toast--success {
  background: rgba(20, 118, 75, 0.94);
}

.toast--error {
  background: rgba(174, 40, 40, 0.94);
}
</style>
