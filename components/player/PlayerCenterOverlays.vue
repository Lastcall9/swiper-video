<template>
  <button v-if="!playing" class="play-hint" type="button" aria-label="播放" @click.stop="emit('toggle-play')">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  </button>

  <div v-if="likePulseVisible" class="like-pulse" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M12 21s-7-4.35-9.4-8.7C.74 8.94 2.9 5 6.75 5 8.95 5 10.48 6.18 12 8c1.52-1.82 3.05-3 5.25-3 3.85 0 6.01 3.94 4.15 7.3C19 16.65 12 21 12 21z" />
    </svg>
  </div>

  <div v-if="longPressing" class="speed-toast">2x</div>

  <div class="bottom-info">
    <h1>{{ episode.title }}</h1>
    <p>{{ episode.desc }}</p>
  </div>
</template>

<script setup>
defineProps({
  episode: {
    type: Object,
    required: true
  },
  playing: {
    type: Boolean,
    default: false
  },
  likePulseVisible: {
    type: Boolean,
    default: false
  },
  longPressing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-play'])
</script>

<style scoped lang="scss">
.play-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 72px;
  height: 72px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.play-hint svg {
  width: 34px;
  height: 34px;
  fill: currentColor;
}

.like-pulse {
  position: absolute;
  left: 50%;
  top: 48%;
  z-index: 7;
  color: #ff3b5c;
  filter: drop-shadow(0 8px 26px rgba(0, 0, 0, 0.45));
  transform: translate(-50%, -50%);
  animation: like-pulse 0.62s ease-out both;
  pointer-events: none;
}

.like-pulse svg {
  width: 118px;
  height: 118px;
  fill: currentColor;
}

.speed-toast {
  position: absolute;
  left: 50%;
  top: 17%;
  z-index: 7;
  border-radius: 999px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  transform: translateX(-50%);
  pointer-events: none;
}

@keyframes like-pulse {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.55) rotate(-10deg);
  }

  22% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1) rotate(-10deg);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -68%) scale(1) rotate(-10deg);
  }
}

.bottom-info {
  position: absolute;
  left: 18px;
  right: 90px;
  bottom: 34px;
  z-index: 3;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
}

.bottom-info h1 {
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.2;
}

.bottom-info p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}
</style>
