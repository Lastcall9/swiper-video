<template>
  <section class="player">
    <div
      ref="playerEl"
      class="player__stage"
      @pointerdown="handleStagePointerDown"
      @pointerup="handleStagePointerUp"
      @pointerleave="handleStagePointerCancel"
      @pointercancel="handleStagePointerCancel"
    />

    <button v-if="!playing" class="play-hint" type="button" aria-label="播放" @click.stop="togglePlay">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>

    <div class="right-actions">
      <button class="action" type="button" :aria-label="episode.favorite ? '取消收藏' : '收藏'" @click.stop="emit('favorite', episode.id)">
        <span class="action__icon" :class="{ 'action__icon--active': episode.favorite }">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-4.35-9.4-8.7C.74 8.94 2.9 5 6.75 5 8.95 5 10.48 6.18 12 8c1.52-1.82 3.05-3 5.25-3 3.85 0 6.01 3.94 4.15 7.3C19 16.65 12 21 12 21z" />
          </svg>
        </span>
      </button>

      <button class="action" type="button" :aria-label="muted ? '开启声音' : '静音'" @click.stop="toggleMuted">
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

      <button class="action" type="button" aria-label="播放速度" @click.stop="togglePanel('rate')">
        <span class="action__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 15a7 7 0 1 1 14 0" class="stroke-icon" />
            <path d="m12 15 4-4" class="stroke-icon" />
            <path d="M8 19h8" class="stroke-icon" />
          </svg>
        </span>
      </button>

      <button class="action" type="button" aria-label="清晰度" @click.stop="togglePanel('quality')">
        <span class="action__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14v10H5z" class="stroke-icon" />
            <path d="M8 10h2v4H8zm6 0h2a2 2 0 0 1 0 4h-2z" />
          </svg>
        </span>
      </button>

      <button class="action" type="button" aria-label="选集" @click.stop="episodeDrawerVisible = true">
        <span class="action__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 6h14M5 12h14M5 18h14" class="stroke-icon" />
          </svg>
        </span>
      </button>
    </div>

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

    <div
      ref="progressBarRef"
      class="progress"
      :class="{ 'progress--seeking': seeking }"
      role="slider"
      tabindex="0"
      aria-label="Video progress"
      :aria-valuenow="Math.round(progressPercent)"
      aria-valuemin="0"
      aria-valuemax="100"
      @pointerdown.stop.prevent="startSeek"
      @keydown.left.prevent="seekBy(-5)"
      @keydown.right.prevent="seekBy(5)"
    >
      <span v-if="seeking" class="progress__time">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
      <span class="progress__track">
        <span class="progress__fill" :style="{ width: `${progressPercent}%` }" />
      </span>
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

    <div v-if="episodeDrawerVisible" class="drawer-mask" @click.self="episodeDrawerVisible = false">
      <section class="episode-drawer" aria-label="选集">
        <header class="episode-drawer__header">
          <strong>选集</strong>
          <button type="button" aria-label="关闭选集" @click="episodeDrawerVisible = false">
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
              active: item.id === episode.id,
              locked: item.locked && !item.unlocked
            }"
            @click="selectEpisode(item)"
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

    <div v-if="active && paywallEpisode" class="unlock-mask" @click.self="emit('close-paywall')">
      <section class="unlock-panel" aria-label="解锁剧集">
        <button class="unlock-panel__close" type="button" aria-label="关闭解锁弹层" @click="emit('close-paywall')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" class="stroke-icon" />
          </svg>
        </button>
        <div class="unlock-panel__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10V8a5 5 0 0 1 10 0v2" class="stroke-icon" />
            <path d="M6 10h12v10H6z" class="stroke-icon" />
          </svg>
        </div>
        <h2>解锁第 {{ paywallEpisode.index }} 集</h2>
        <p>试看已结束，解锁后可继续观看本集并自动连播。</p>
        <button class="unlock-panel__primary" type="button" @click="emit('unlock', paywallEpisode.id)">
          {{ paywallEpisode.priceText || '立即解锁' }}
        </button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { useEventListener } from '@vueuse/core'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  episode: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  episodes: {
    type: Array,
    default: () => []
  },
  paywallEpisode: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['favorite', 'track', 'ended', 'select-episode', 'unlock', 'close-paywall'])
const playerEl = ref(null)
const progressBarRef = ref(null)
const player = ref(null)
const playing = ref(false)
const muted = ref(true)
const progress = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const seeking = ref(false)
const showPanel = ref('')
const episodeDrawerVisible = ref(false)
const likePulseVisible = ref(false)
const longPressing = ref(false)
const currentRate = ref(1)
const rates = [0.75, 1, 1.25, 1.5, 2]
const longPressTimer = ref(null)
const likePulseTimer = ref(null)
const lastPointerUpAt = ref(0)
const stagePointerMoved = ref(false)
const stagePointerStart = ref({ x: 0, y: 0 })
const progressPercent = computed(() => Math.min(Math.max(progress.value, 0), 100))

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
    duration.value = player.value?.duration || 0
    currentTime.value = player.value?.currentTime || 0
    progress.value = duration.value ? (currentTime.value / duration.value) * 100 : 0
  })

  player.value.on('durationchange', () => {
    duration.value = player.value?.duration || 0
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

const togglePlay = () => {
  if (!player.value) return
  if (player.value.paused) {
    tryAutoPlay()
  } else {
    player.value.pause()
  }
}

const togglePanel = (panel) => {
  showPanel.value = showPanel.value === panel ? '' : panel
  episodeDrawerVisible.value = false
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

const startLongPressRate = () => {
  if (!player.value || longPressing.value) return

  longPressing.value = true
  player.value.playbackRate = 2
  emit('track', { event: 'long_press_rate_start', id: props.episode.id, rate: 2 })
}

const stopLongPressRate = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }

  if (!longPressing.value) return

  longPressing.value = false
  if (player.value) player.value.playbackRate = currentRate.value
  emit('track', { event: 'long_press_rate_end', id: props.episode.id, rate: currentRate.value })
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

    stopLongPressRate()
    player.value?.pause()
    showPanel.value = ''
    episodeDrawerVisible.value = false
    seeking.value = false
  },
  { immediate: true }
)

const triggerLikePulse = () => {
  emit('favorite', props.episode.id)
  emit('track', { event: 'double_tap_like', id: props.episode.id })
  likePulseVisible.value = false

  if (likePulseTimer.value) clearTimeout(likePulseTimer.value)
  requestAnimationFrame(() => {
    likePulseVisible.value = true
    likePulseTimer.value = setTimeout(() => {
      likePulseVisible.value = false
      likePulseTimer.value = null
    }, 620)
  })
}

const handleStagePointerDown = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  stagePointerMoved.value = false
  stagePointerStart.value = { x: event.clientX, y: event.clientY }
  showPanel.value = ''

  if (longPressTimer.value) clearTimeout(longPressTimer.value)
  longPressTimer.value = setTimeout(() => {
    startLongPressRate()
  }, 420)
}

const handleStagePointerUp = (event) => {
  const moved = Math.hypot(
    event.clientX - stagePointerStart.value.x,
    event.clientY - stagePointerStart.value.y
  )
  stagePointerMoved.value = moved > 10

  const wasLongPressing = longPressing.value
  stopLongPressRate()

  if (wasLongPressing || stagePointerMoved.value) return

  const now = Date.now()
  if (now - lastPointerUpAt.value < 280) {
    lastPointerUpAt.value = 0
    triggerLikePulse()
    return
  }

  lastPointerUpAt.value = now
  setTimeout(() => {
    if (lastPointerUpAt.value !== now) return
    togglePlay()
    lastPointerUpAt.value = 0
  }, 280)
}

const handleStagePointerCancel = () => {
  stopLongPressRate()
}

const selectEpisode = (item) => {
  episodeDrawerVisible.value = false
  emit('select-episode', item.id)
}

const seekToClientX = (clientX) => {
  if (!player.value || !progressBarRef.value) return

  const duration = player.value.duration || 0
  if (!duration) return

  const rect = progressBarRef.value.getBoundingClientRect()
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  const targetTime = duration * ratio

  player.value.currentTime = targetTime
  currentTime.value = targetTime
  duration.value = duration
  progress.value = ratio * 100
}

const startSeek = (event) => {
  seeking.value = true
  seekToClientX(event.clientX)
}

const seekBy = (seconds) => {
  if (!player.value) return

  const duration = player.value.duration || 0
  if (!duration) return

  const targetTime = Math.min(Math.max((player.value.currentTime || 0) + seconds, 0), duration)
  player.value.currentTime = targetTime
  currentTime.value = targetTime
  duration.value = duration
  progress.value = (targetTime / duration) * 100
  emit('track', { event: 'seek', id: props.episode.id, currentTime: targetTime })
}

const formatTime = (seconds) => {
  const value = Math.max(Math.floor(seconds || 0), 0)
  const minutes = Math.floor(value / 60)
  const remainingSeconds = String(value % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

useEventListener(import.meta.client ? window : null, 'pointermove', (event) => {
  if (!seeking.value) return
  seekToClientX(event.clientX)
})

useEventListener(import.meta.client ? window : null, 'pointerup', () => {
  if (!seeking.value) return
  seeking.value = false
  emit('track', { event: 'seek', id: props.episode.id, progress: progressPercent.value })
})

onBeforeUnmount(() => {
  stopLongPressRate()
  if (likePulseTimer.value) clearTimeout(likePulseTimer.value)
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

.play-hint svg {
  width: 34px;
  height: 34px;
  fill: currentColor;
}

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

.action__icon svg,
.episode-drawer svg,
.unlock-panel svg {
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

.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  display: flex;
  height: 18px;
  align-items: flex-end;
  width: 100%;
  cursor: pointer;
  touch-action: none;
}

.progress__track {
  display: block;
  width: 100%;
  height: 2px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.24);
  transition: height 0.16s ease;
}

.progress__time {
  position: absolute;
  left: 50%;
  bottom: 18px;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  transform: translateX(-50%);
  white-space: nowrap;
}

.progress__fill {
  display: block;
  height: 100%;
  background: #fff;
}

.progress--seeking .progress__track,
.progress:focus-visible .progress__track {
  height: 4px;
}

.progress:focus-visible {
  outline: none;
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

.drawer-mask,
.unlock-mask {
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

.episode-drawer__header button,
.unlock-panel__close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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

.unlock-mask {
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.62);
}

.unlock-panel {
  position: relative;
  width: min(340px, 100%);
  box-sizing: border-box;
  border-radius: 8px;
  padding: 26px 20px 20px;
  background: rgba(18, 18, 18, 0.96);
  color: #fff;
  text-align: center;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.46);
}

.unlock-panel__close {
  position: absolute;
  top: 10px;
  right: 10px;
}

.unlock-panel__icon {
  display: grid;
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.unlock-panel h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.unlock-panel p {
  margin: 0 0 18px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  line-height: 1.5;
}

.unlock-panel__primary {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 6px;
  background: #fff;
  color: #050505;
  font-size: 15px;
  font-weight: 700;
}

@media (max-width: 360px) {
  .episode-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .right-actions {
    right: 10px;
  }
}
</style>
