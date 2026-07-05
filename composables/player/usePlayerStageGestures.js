import { ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

const DOUBLE_TAP_DELAY = 280
const LONG_PRESS_DELAY = 420
const MOVE_THRESHOLD = 10

export const usePlayerStageGestures = ({
  isLongPressing,
  onSingleTap,
  onDoubleTap,
  onLongPressStart,
  onLongPressEnd,
  onClosePanel
}) => {
  const lastPointerUpAt = ref(0)
  const pendingTapAt = ref(0)
  const stagePointerMoved = ref(false)
  const stagePointerStart = ref({ x: 0, y: 0 })

  const { start: startLongPressTimer, stop: stopLongPressTimer } = useTimeoutFn(() => {
    onLongPressStart()
  }, LONG_PRESS_DELAY, { immediate: false })

  const { start: startSingleTapTimer, stop: stopSingleTapTimer } = useTimeoutFn(() => {
    if (lastPointerUpAt.value !== pendingTapAt.value) return

    onSingleTap()
    lastPointerUpAt.value = 0
  }, DOUBLE_TAP_DELAY, { immediate: false })

  const stopGestureTimers = () => {
    stopLongPressTimer()
    stopSingleTapTimer()
  }

  const handleStagePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    // 手势层只识别单击、双击和长按，避免播放内核关心 UI 交互。
    stagePointerMoved.value = false
    stagePointerStart.value = { x: event.clientX, y: event.clientY }
    onClosePanel()
    stopLongPressTimer()
    startLongPressTimer()
  }

  const handleStagePointerUp = (event) => {
    const moved = Math.hypot(
      event.clientX - stagePointerStart.value.x,
      event.clientY - stagePointerStart.value.y
    )
    stagePointerMoved.value = moved > MOVE_THRESHOLD

    const wasLongPressing = isLongPressing.value
    stopLongPressTimer()
    onLongPressEnd()

    if (wasLongPressing || stagePointerMoved.value) return

    const now = Date.now()
    if (now - lastPointerUpAt.value < DOUBLE_TAP_DELAY) {
      stopSingleTapTimer()
      lastPointerUpAt.value = 0
      onDoubleTap()
      return
    }

    lastPointerUpAt.value = now
    pendingTapAt.value = now
    startSingleTapTimer()
  }

  const handleStagePointerCancel = () => {
    stopGestureTimers()
    onLongPressEnd()
  }

  return {
    handleStagePointerDown,
    handleStagePointerUp,
    handleStagePointerCancel,
    stopGestureTimers
  }
}
