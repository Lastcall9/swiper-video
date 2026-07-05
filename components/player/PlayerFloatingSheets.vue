<template>
  <div v-if="showPanel === 'rate'" class="sheet" @click.stop>
    <button
      v-for="rate in rates"
      :key="rate"
      type="button"
      :class="{ active: rate === currentRate }"
      @click="emit('set-rate', rate)"
    >
      {{ rate }}x
    </button>
  </div>

  <div v-if="showPanel === 'quality'" class="sheet" @click.stop>
    <button type="button" class="active">Auto</button>
    <button type="button">HD</button>
    <button type="button">SD</button>
  </div>
</template>

<script setup>
defineProps({
  showPanel: {
    type: String,
    default: ''
  },
  rates: {
    type: Array,
    default: () => []
  },
  currentRate: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['set-rate'])
</script>

<style scoped lang="scss">
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
