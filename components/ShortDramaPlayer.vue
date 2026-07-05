<template>
  <section class="player">
    <div ref="playerEl" class="player__stage" @click="togglePlay" />

    <button v-if="!playing" class="play-hint" type="button" @click.stop="togglePlay">
      Play
    </button>

    <div class="right-actions">
      <button class="action" type="button" @click.stop="emit('favorite', episode.id)">
        <span class="action__icon">{{ episode.favorite ? 'Saved' : 'Save' }}</span>
        <span>Favorite</span>
      </button>

      <button class="action" type="button" @click.stop="toggleMuted">
        <span class="action__icon">{{ muted ? 'Mute' : 'Sound' }}</span>
        <span>Audio</span>
      </button>

      <button class="action" type="button" @click.stop="showPanel = showPanel === 'rate' ? '' : 'rate'">
        <span class="action__icon">{{ currentRate }}x</span>
        <span>Rate</span>
      </button>

      <button class="action" type="button" @click.stop="showPanel = showPanel === 'quality' ? '' : 'quality'">
        <span class="action__icon">HD</span>
        <span>Quality</span>
      </button>
    </div>

    <div class="bottom-info">
      <h1>{{ episode.title }}</h1>
      <p>{{ episode.desc }}</p>
      <div class="progress">
        <span :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <div v-if="showPanel === 'rate'" class="sheet" @click.stop>
      <button
        v-for="rate in rates"
        :key="rate"
        type="button"
        :class="{ active: rate === currentRate }"
        @click="setRate(rate)"
      >
        {{ rate }}x
      </button>
    </div>

    <div v-if="showPanel === 'quality'" class="sheet" @click.stop>
      <button type="button" class="active">Auto</button>
      <button type="button">HD</button>
      <button type="button">SD</button>
    </div>
  </section>
</template>

<script setup>
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  episode: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['favorite', 'track', 'ended'])
const playerEl = ref(null)
const player = ref(null)
const playing = ref(false)
const muted = ref(true)
const progress = ref(0)
const showPanel = ref('')
const currentRate = ref(1)
const rates = [0.75, 1, 1.25, 1.5, 2]

const ensurePlayer = async () => {
  if (player.value) return

  await nextTick()

  player.value = new Player({
    el: playerEl.value,
    url: props.episode.url,
    poster: props.episode.poster,
    width: '100%',
    height: '100%',
    autoplay: props.active,
    muted: true,
    volume: 0,
    playsinline: true,
    controls: false,
    miniprogress: false,
    fitVideoSize: 'fixed',
    videoFillMode: 'fill',
    closeVideoClick: true,
    closeVideoDblclick: true,
    mobile: {
      gestureX: false,
      gestureY: false,
      disablePress: false,
      pressRate: 2,
      gradient: 'none'
    }
  })

  player.value.on('play', () => {
    playing.value = true
    emit('track', { event: 'play', id: props.episode.id })
  })

  player.value.on('pause', () => {
    playing.value = false
    emit('track', { event: 'pause', id: props.episode.id })
  })

  player.value.on('timeupdate', () => {
    const duration = player.value?.duration || 0
    progress.value = duration ? (player.value.currentTime / duration) * 100 : 0
  })

  player.value.on('ended', () => {
    emit('track', { event: 'ended', id: props.episode.id })
    emit('ended', props.episode.id)
  })
}

const tryAutoPlay = () => {
  if (!player.value) return

  player.value.muted = muted.value
  if (muted.value) player.value.volume = 0

  const result = player.value.play()
  if (result?.catch) {
    result.catch(() => {
      playing.value = false
      emit('track', { event: 'autoplay_blocked', id: props.episode.id })
    })
  }
}

watch(
  () => props.active,
  async (active) => {
    if (active) {
      await ensurePlayer()
      tryAutoPlay()
      emit('track', { event: 'play_visible', id: props.episode.id })
      return
    }

    player.value?.pause()
    showPanel.value = ''
  },
  { immediate: true }
)

const togglePlay = () => {
  if (!player.value) return
  if (player.value.paused) {
    tryAutoPlay()
  } else {
    player.value.pause()
  }
}

const toggleMuted = () => {
  muted.value = !muted.value
  if (!player.value) return

  player.value.muted = muted.value
  player.value.volume = muted.value ? 0 : 0.8
  emit('track', { event: 'mute_change', id: props.episode.id, muted: muted.value })
}

const setRate = (rate) => {
  currentRate.value = rate
  if (player.value) player.value.playbackRate = rate
  showPanel.value = ''
  emit('track', { event: 'rate_change', id: props.episode.id, rate })
}

onBeforeUnmount(() => {
  player.value?.destroy()
})
</script>

<style scoped lang="scss">
.player {
  position: relative;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: #050505;
}

.player__stage {
  position: absolute;
  inset: 0;
}

.player__stage :deep(.xgplayer),
.player__stage :deep(.xgplayer video) {
  width: 100%;
  height: 100%;
}

.player__stage :deep(.xgplayer video) {
  object-fit: cover;
}

.player__stage :deep(.xgplayer-controls),
.player__stage :deep(.xgplayer-start) {
  display: none;
}

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

.right-actions {
  position: absolute;
  right: 14px;
  bottom: 132px;
  display: grid;
  gap: 16px;
  z-index: 3;
}

.action {
  width: 64px;
  border: 0;
  background: transparent;
  color: #fff;
  display: grid;
  justify-items: center;
  gap: 5px;
  font-size: 12px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.75);
}

.action__icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.bottom-info {
  position: absolute;
  left: 18px;
  right: 90px;
  bottom: 26px;
  z-index: 3;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
}

.bottom-info h1 {
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.2;
}

.bottom-info p {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.progress {
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.progress span {
  display: block;
  height: 100%;
  background: #fff;
}

.sheet {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 24px;
  z-index: 5;
  display: flex;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(12, 12, 12, 0.88);
  backdrop-filter: blur(16px);
}

.sheet button {
  flex: 1;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sheet button.active {
  background: #fff;
  color: #050505;
}
</style>
