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

    <PlayerCenterOverlays
      :episode="episode"
      :playing="playing"
      :like-pulse-visible="likePulseVisible"
      :long-pressing="longPressing"
      @toggle-play="togglePlay"
    />

    <PlayerActionBar
      :episode="episode"
      :muted="muted"
      @favorite="emit('favorite', episode.id)"
      @toggle-muted="toggleMuted"
      @toggle-panel="togglePanel"
      @open-episode-drawer="openEpisodeDrawer"
    />

    <PlayerProgress
      ref="progressComponentRef"
      :seeking="seeking"
      :progress-percent="progressPercent"
      :current-time="currentTime"
      :duration="duration"
      :format-time="displayTime"
      @start-seek="startSeek"
      @seek-by="seekBy"
    />

    <PlayerFloatingSheets
      :show-panel="showPanel"
      :rates="rates"
      :current-rate="currentRate"
      @set-rate="handleRateChange"
    />

    <EpisodeDrawer
      v-if="episodeDrawerVisible"
      :episodes="episodes"
      :active-episode-id="episode.id"
      @close="episodeDrawerVisible = false"
      @select="selectEpisode"
    />

    <UnlockPanel
      v-if="active && paywallEpisode"
      :episode="paywallEpisode"
      @close="emit('close-paywall')"
      @unlock="emit('unlock', $event)"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useLikePulse } from '~/composables/player/useLikePulse'
import { usePlayerSeek } from '~/composables/player/usePlayerSeek'
import { usePlayerStageGestures } from '~/composables/player/usePlayerStageGestures'
import { useShortDramaPlayerCore } from '~/composables/player/useShortDramaPlayerCore'

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
const progressComponentRef = ref(null)
const progressBarRef = computed(() => {
  const exposedBar = progressComponentRef.value?.barEl
  return exposedBar?.value || exposedBar || null
})
const showPanel = ref('')
const episodeDrawerVisible = ref(false)

const {
  player,
  playing,
  muted,
  progress,
  progressPercent,
  currentTime,
  duration,
  currentRate,
  rates,
  longPressing,
  ensurePlayer,
  tryAutoPlay,
  pausePlayer,
  togglePlay,
  toggleMuted,
  setRate,
  startLongPressRate,
  stopLongPressRate,
  destroyPlayer,
  track
} = useShortDramaPlayerCore({ playerEl, props, emit })

const { likePulseVisible, triggerLikePulse, stopLikePulse } = useLikePulse({ props, emit })

const {
  seeking,
  startSeek,
  seekBy,
  cancelSeek,
  formatTime
} = usePlayerSeek({
  player,
  progressBarRef,
  currentTime,
  duration,
  progress,
  progressPercent,
  track
})

const displayTime = (seconds) => formatTime(seconds)

const closeFloatingUi = () => {
  showPanel.value = ''
}

const {
  handleStagePointerDown,
  handleStagePointerUp,
  handleStagePointerCancel,
  stopGestureTimers
} = usePlayerStageGestures({
  isLongPressing: longPressing,
  onSingleTap: togglePlay,
  onDoubleTap: triggerLikePulse,
  onLongPressStart: startLongPressRate,
  onLongPressEnd: stopLongPressRate,
  onClosePanel: closeFloatingUi
})

const resetFloatingUi = () => {
  showPanel.value = ''
  episodeDrawerVisible.value = false
  cancelSeek()
}

const togglePanel = (panel) => {
  showPanel.value = showPanel.value === panel ? '' : panel
  episodeDrawerVisible.value = false
}

const openEpisodeDrawer = () => {
  showPanel.value = ''
  episodeDrawerVisible.value = true
}

const handleRateChange = (rate) => {
  setRate(rate)
  showPanel.value = ''
}

const selectEpisode = (item) => {
  episodeDrawerVisible.value = false
  emit('select-episode', item.id)
}

watch(
  () => props.active,
  async (active) => {
    if (active) {
      await ensurePlayer()
      tryAutoPlay()
      track({ event: 'play_visible' })
      return
    }

    // 当前 slide 离屏时统一收口，避免弹层和手势状态残留到下一集。
    stopLongPressRate()
    pausePlayer()
    resetFloatingUi()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopGestureTimers()
  stopLikePulse()
  destroyPlayer()
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
</style>
