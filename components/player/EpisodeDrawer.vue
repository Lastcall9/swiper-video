<template>
  <div class="drawer-mask" @click.self="emit('close')">
    <section class="episode-drawer" aria-label="选集">
      <header class="episode-drawer__header">
        <strong>选集</strong>
        <button type="button" aria-label="关闭选集" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" class="stroke-icon" />
          </svg>
        </button>
      </header>

      <div class="episode-grid">
        <button
          v-for="(item, index) in episodes"
          :key="item.id"
          type="button"
          :class="{
            active: item.id === activeEpisodeId,
            locked: item.locked && !item.unlocked
          }"
          @click="emit('select', item)"
        >
          <span>{{ index + 1 }}</span>
          <svg v-if="item.locked && !item.unlocked" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10V8a5 5 0 0 1 10 0v2" class="stroke-icon" />
            <path d="M6 10h12v10H6z" class="stroke-icon" />
          </svg>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  episodes: {
    type: Array,
    default: () => []
  },
  activeEpisodeId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'select'])
</script>

<style scoped lang="scss">
.drawer-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.4);
}

.episode-drawer {
  width: 100%;
  max-height: min(56dvh, 460px);
  box-sizing: border-box;
  overflow: auto;
  border-radius: 8px 8px 0 0;
  padding: 16px 16px max(22px, env(safe-area-inset-bottom));
  background: rgba(18, 18, 18, 0.96);
  color: #fff;
  backdrop-filter: blur(18px);
}

.episode-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.episode-drawer__header strong {
  font-size: 17px;
}

.episode-drawer__header button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.episode-drawer svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.stroke-icon {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.episode-grid button {
  position: relative;
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 15px;
}

.episode-grid button.active {
  border-color: #fff;
  background: #fff;
  color: #050505;
}

.episode-grid button.locked {
  color: rgba(255, 255, 255, 0.52);
}

.episode-grid button svg {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 13px;
  height: 13px;
}

@media (max-width: 360px) {
  .episode-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
