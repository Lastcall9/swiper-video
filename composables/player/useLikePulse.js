import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

export const useLikePulse = ({ emit, props }) => {
  const likePulseVisible = ref(false)

  const { start: hideLikePulse, stop: stopLikePulseTimer } = useTimeoutFn(() => {
    likePulseVisible.value = false
  }, 620, { immediate: false })

  const triggerLikePulse = () => {
    emit('favorite', props.episode.id)
    emit('track', { event: 'double_tap_like', id: props.episode.id })
    likePulseVisible.value = false
    stopLikePulseTimer()

    requestAnimationFrame(() => {
      likePulseVisible.value = true
      hideLikePulse()
    })
  }

  const stopLikePulse = () => {
    stopLikePulseTimer()
    likePulseVisible.value = false
  }

  return {
    likePulseVisible,
    triggerLikePulse,
    stopLikePulse
  }
}
