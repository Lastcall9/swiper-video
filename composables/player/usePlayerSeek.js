import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export const usePlayerSeek = ({
  player,
  progressBarRef,
  currentTime,
  duration,
  progress,
  progressPercent,
  track
}) => {
  const seeking = ref(false)

  const seekToClientX = (clientX) => {
    if (!player.value || !progressBarRef.value) return

    const videoDuration = player.value.duration || 0
    if (!videoDuration) return

    const rect = progressBarRef.value.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const targetTime = videoDuration * ratio

    // 拖动时先写本地状态，保证进度条和时间浮层即时响应。
    player.value.currentTime = targetTime
    currentTime.value = targetTime
    duration.value = videoDuration
    progress.value = ratio * 100
  }

  const startSeek = (event) => {
    seeking.value = true
    seekToClientX(event.clientX)
  }

  const seekBy = (seconds) => {
    if (!player.value) return

    const videoDuration = player.value.duration || 0
    if (!videoDuration) return

    const targetTime = Math.min(Math.max((player.value.currentTime || 0) + seconds, 0), videoDuration)
    player.value.currentTime = targetTime
    currentTime.value = targetTime
    duration.value = videoDuration
    progress.value = (targetTime / videoDuration) * 100
    track({ event: 'seek', currentTime: targetTime })
  }

  const endSeek = () => {
    if (!seeking.value) return

    seeking.value = false
    track({ event: 'seek', progress: progressPercent.value })
  }

  const cancelSeek = () => {
    seeking.value = false
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

  useEventListener(import.meta.client ? window : null, 'pointerup', endSeek)

  return {
    seeking,
    startSeek,
    seekBy,
    cancelSeek,
    formatTime
  }
}
