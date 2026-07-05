<template>
  <div class="unlock-mask" @click.self="emit('close')">
    <section class="unlock-panel" aria-label="解锁剧集">
      <button class="unlock-panel__close" type="button" aria-label="关闭解锁弹层" @click="emit('close')">
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
      <h2>解锁第 {{ episode.index }} 集</h2>
      <p>试看已结束，解锁后可继续观看本集并自动连播。</p>
      <button class="unlock-panel__primary" type="button" @click="emit('unlock', episode.id)">
        {{ episode.priceText || '立即解锁' }}
      </button>
    </section>
  </div>
</template>

<script setup>
defineProps({
  episode: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'unlock'])
</script>

<style scoped lang="scss">
.unlock-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
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
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

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
</style>
