import { computed, nextTick, ref, shallowRef } from 'vue'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2]

export const useShortDramaPlayerCore = ({ playerEl, props, emit }) => {
  const player = shallowRef(null)
  const playing = ref(false)
  const muted = ref(true)
  const progress = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const currentRate = ref(1)
  const longPressing = ref(false)

  const progressPercent = computed(() => Math.min(Math.max(progress.value, 0), 100))

  const track = (payload) => {
    emit('track', { ...payload, id: props.episode.id })
  }

  const syncProgress = () => {
    duration.value = player.value?.duration || 0
    currentTime.value = player.value?.currentTime || 0
    progress.value = duration.value ? (currentTime.value / duration.value) * 100 : 0
  }

  const bindPlayerEvents = () => {
    player.value.on('play', () => {
      playing.value = true
      track({ event: 'play' })
    })

    player.value.on('pause', () => {
      playing.value = false
      track({ event: 'pause' })
    })

    player.value.on('timeupdate', syncProgress)

    player.value.on('durationchange', () => {
      duration.value = player.value?.duration || 0
    })

    player.value.on('ended', () => {
      track({ event: 'ended' })
      emit('ended', props.episode.id)
    })
  }

  const ensurePlayer = async () => {
    if (player.value) return

    await nextTick()
    if (!playerEl.value) return

    // 播放内核只负责 xgplayer 生命周期和播放状态同步。
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

    bindPlayerEvents()
  }

  const tryAutoPlay = () => {
    if (!player.value) return

    // 短剧首屏自动播放必须默认静音，避免被浏览器自动播放策略拦截。
    player.value.muted = muted.value
    if (muted.value) player.value.volume = 0

    const result = player.value.play()
    if (result?.catch) {
      result.catch(() => {
        playing.value = false
        track({ event: 'autoplay_blocked' })
      })
    }
  }

  const pausePlayer = () => {
    player.value?.pause()
  }

  const togglePlay = () => {
    if (!player.value) return

    if (player.value.paused) {
      tryAutoPlay()
      return
    }

    pausePlayer()
  }

  const toggleMuted = () => {
    muted.value = !muted.value
    if (!player.value) return

    player.value.muted = muted.value
    player.value.volume = muted.value ? 0 : 0.8
    track({ event: 'mute_change', muted: muted.value })
  }

  const setRate = (rate) => {
    currentRate.value = rate
    if (player.value) player.value.playbackRate = rate
    track({ event: 'rate_change', rate })
  }

  const startLongPressRate = () => {
    if (!player.value || longPressing.value) return

    longPressing.value = true
    player.value.playbackRate = 2
    track({ event: 'long_press_rate_start', rate: 2 })
  }

  const stopLongPressRate = () => {
    if (!longPressing.value) return

    longPressing.value = false
    if (player.value) player.value.playbackRate = currentRate.value
    track({ event: 'long_press_rate_end', rate: currentRate.value })
  }

  const destroyPlayer = () => {
    stopLongPressRate()
    player.value?.destroy()
    player.value = null
  }

  return {
    player,
    playing,
    muted,
    progress,
    progressPercent,
    currentTime,
    duration,
    currentRate,
    rates: PLAYBACK_RATES,
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
  }
}
