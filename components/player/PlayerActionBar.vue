<template>
  <div class="right-actions">
    <button class="action" type="button" :aria-label="episode.favorite ? '取消收藏' : '收藏'" @click.stop="emit('favorite')">
      <span class="action__icon" :class="{ 'action__icon--active': episode.favorite }">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.35-9.4-8.7C.74 8.94 2.9 5 6.75 5 8.95 5 10.48 6.18 12 8c1.52-1.82 3.05-3 5.25-3 3.85 0 6.01 3.94 4.15 7.3C19 16.65 12 21 12 21z" />
        </svg>
      </span>
    </button>

    <button class="action" type="button" :aria-label="muted ? '开启声音' : '静音'" @click.stop="emit('toggle-muted')">
      <span class="action__icon">
        <svg v-if="muted" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="m17 9 4 4m0-4-4 4" class="stroke-icon" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7M18.8 6.2a8.2 8.2 0 0 1 0 11.6" class="stroke-icon" />
        </svg>
      </span>
    </button>

    <button class="action" type="button" aria-label="播放速度" @click.stop="emit('toggle-panel', 'rate')">
      <span class="action__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 15a7 7 0 1 1 14 0" class="stroke-icon" />
          <path d="m12 15 4-4" class="stroke-icon" />
          <path d="M8 19h8" class="stroke-icon" />
        </svg>
      </span>
    </button>

    <button class="action" type="button" aria-label="清晰度" @click.stop="emit('toggle-panel', 'quality')">
      <span class="action__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14v10H5z" class="stroke-icon" />
          <path d="M8 10h2v4H8zm6 0h2a2 2 0 0 1 0 4h-2z" />
        </svg>
      </span>
    </button>

    <button class="action" type="button" aria-label="选集" @click.stop="emit('open-episode-drawer')">
      <span class="action__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14M5 12h14M5 18h14" class="stroke-icon" />
        </svg>
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  episode: {
    type: Object,
    required: true
  },
  muted: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['favorite', 'toggle-muted', 'toggle-panel', 'open-episode-drawer'])
</script>

<style scoped lang="scss">
.right-actions {
  position: absolute;
  right: 14px;
  bottom: 112px;
  display: grid;
  gap: 14px;
  z-index: 3;
}

.action {
  width: 52px;
  height: 52px;
  border: 0;
  background: transparent;
  color: #fff;
  display: grid;
  padding: 0;
  place-items: center;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.75);
}

.action__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action__icon--active {
  color: #ff3b5c;
}

.action__icon svg {
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

@media (max-width: 360px) {
  .right-actions {
    right: 10px;
  }
}
</style>
