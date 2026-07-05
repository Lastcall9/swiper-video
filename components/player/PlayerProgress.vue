<template>
  <div
    ref="barEl"
    class="progress"
    :class="{ 'progress--seeking': seeking }"
    role="slider"
    tabindex="0"
    aria-label="Video progress"
    :aria-valuenow="Math.round(progressPercent)"
    aria-valuemin="0"
    aria-valuemax="100"
    @pointerdown.stop.prevent="emit('start-seek', $event)"
    @keydown.left.prevent="emit('seek-by', -5)"
    @keydown.right.prevent="emit('seek-by', 5)"
  >
    <span v-if="seeking" class="progress__time">
      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
    </span>
    <span class="progress__track">
      <span class="progress__fill" :style="{ width: `${progressPercent}%` }" />
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  seeking: {
    type: Boolean,
    default: false
  },
  progressPercent: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  formatTime: {
    type: Function,
    required: true
  }
})

const barEl = ref(null)
const emit = defineEmits(['start-seek', 'seek-by'])

defineExpose({
  barEl
})
</script>

<style scoped lang="scss">
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
</style>
