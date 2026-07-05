<template>
  <div ref="feedRef" class="feed">
    <AuthStatusButton />

    <Swiper
      direction="vertical"
      :allow-slide-next="canSlideNext"
      :allow-slide-prev="canSlidePrev"
      :modules="swiperModules"
      :mousewheel="mousewheelOptions"
      :slides-per-view="1"
      :speed="260"
      class="feed__swiper"
      @swiper="onSwiper"
      @touch-end="onTouchEnd"
      @slide-change="onSlideChange"
    >
      <SwiperSlide v-for="(episode, index) in episodes" :key="episode.id">
        <ShortDramaPlayer
          :episode="episode"
          :episodes="episodes"
          :active="index === activeIndex"
          :paywall-episode="paywallEpisode"
          @ended="playNext"
          @favorite="toggleFavorite"
          @select-episode="selectEpisode"
          @unlock="unlockEpisode"
          @close-paywall="paywallEpisode = null"
          @track="track"
        />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { ref } from 'vue'
import { Mousewheel } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import 'swiper/css'

const WHEEL_THRESHOLD = 24

const authStore = useAuthStore()
const uiStore = useUiStore()
const feedRef = ref(null)
const activeIndex = ref(0)
const swiperRef = ref(null)
const canSlideNext = ref(true)
const canSlidePrev = ref(true)
const revertingSlide = ref(false)
const paywallEpisode = ref(null)
const swiperModules = [Mousewheel]
const mousewheelOptions = {
  enabled: true,
  forceToAxis: true,
  releaseOnEdges: false,
  thresholdDelta: WHEEL_THRESHOLD
}

const episodes = ref([
  {
    id: 1,
    index: 1,
    title: 'Episode 1',
    desc: 'Autoplay muted, vertical swipe, custom short-drama controls.',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    locked: false,
    unlocked: true,
    favorite: false
  },
  {
    id: 2,
    index: 2,
    title: 'Episode 2',
    desc: 'Swipe up or wait for video ended, then it jumps to next episode.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    locked: true,
    unlocked: false,
    priceText: '解锁本集',
    favorite: false
  },
  {
    id: 3,
    index: 3,
    title: 'Episode 3',
    desc: 'This shell can later connect quality, rate, trial, ads and analytics.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    locked: true,
    unlocked: false,
    priceText: '解锁本集',
    favorite: false
  }
])

const onSwiper = (swiper) => {
  swiperRef.value = swiper
}

const onSlideChange = (swiper) => {
  if (revertingSlide.value) return

  const from = activeIndex.value
  const to = swiper.activeIndex
  if (to === from) return

  const direction = to > from ? 'next' : 'prev'
  const allowed = canSlide(direction, to)

  if (!allowed) {
    onSlideBlocked({
      direction,
      from,
      to,
      reason: getBlockReason(direction, to)
    })

    revertingSlide.value = true
    swiper.slideTo(from, 0, false)
    requestAnimationFrame(() => {
      revertingSlide.value = false
    })
    return
  }

  activeIndex.value = to
  onSlideSuccess({ from, to, episode: episodes.value[to] })
}

const onTouchEnd = (swiper) => {
  const direction = getSwipeDirection(swiper)
  if (!direction) return

  const targetIndex = activeIndex.value + (direction === 'next' ? 1 : -1)
  const allowed = canSlide(direction, targetIndex)

  onSlideAttempt({
    direction,
    from: activeIndex.value,
    to: targetIndex,
    allowed
  })
}

const handleWheel = (event) => {
  if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return

  const direction = event.deltaY > 0 ? 'next' : 'prev'
  const targetIndex = activeIndex.value + (direction === 'next' ? 1 : -1)
  const allowed = canSlide(direction, targetIndex)

  onSlideAttempt({
    direction,
    from: activeIndex.value,
    to: targetIndex,
    allowed,
    input: 'wheel'
  })

  if (!allowed) {
    onSlideBlocked({
      direction,
      from: activeIndex.value,
      to: targetIndex,
      reason: getBlockReason(direction, targetIndex),
      input: 'wheel'
    })
  }
}

const onWheel = useThrottleFn(handleWheel, 360, true, false)

useEventListener(feedRef, 'wheel', onWheel, { passive: true })

const playNext = () => {
  if (!swiperRef.value) return

  if (canSlide('next', activeIndex.value + 1)) {
    swiperRef.value.slideNext()
    return
  }

  const targetIndex = activeIndex.value + 1
  const reason = getBlockReason('next', targetIndex)
  onSlideBlocked({
    direction: 'next',
    from: activeIndex.value,
    to: targetIndex,
    reason
  })
}

const getSwipeDirection = (swiper) => {
  const diff = swiper.touches?.diff || 0
  if (Math.abs(diff) < 30) return ''
  return diff < 0 ? 'next' : 'prev'
}

const canSlide = (direction, targetIndex) => {
  if (targetIndex < 0 || targetIndex >= episodes.value.length) return false
  if (direction === 'next' && !canSlideNext.value) return false
  if (direction === 'prev' && !canSlidePrev.value) return false
  if (direction === 'next' && targetIndex >= 1 && !authStore.isAuthenticated) return false
  if (episodes.value[targetIndex]?.locked && !episodes.value[targetIndex]?.unlocked) return false

  // Put trial/payment/ad checks here. Return false to block the swipe.
  return true
}

const getBlockReason = (direction, targetIndex) => {
  if (targetIndex < 0) return 'first_episode'
  if (targetIndex >= episodes.value.length) return 'last_episode'
  if (direction === 'next' && !canSlideNext.value) return 'next_disabled'
  if (direction === 'prev' && !canSlidePrev.value) return 'prev_disabled'
  if (direction === 'next' && targetIndex >= 1 && !authStore.isAuthenticated) return 'login_required'
  if (episodes.value[targetIndex]?.locked && !episodes.value[targetIndex]?.unlocked) return 'episode_locked'
  return 'business_rule'
}

const onSlideAttempt = (payload) => {
  track({ event: 'slide_attempt', ...payload })
}

const onSlideBlocked = (payload) => {
  track({ event: 'slide_blocked', ...payload })

  const episode = episodes.value[payload.to]

  if (payload.reason === 'login_required') {
    uiStore.toast('请先登录后继续观看', 'info')
    uiStore.openAuth('login')
    return
  }

  if (payload.reason === 'episode_locked' && episode) {
    paywallEpisode.value = episode
  }
}

const onSlideSuccess = (payload) => {
  track({ event: 'slide_success', ...payload })
}

const toggleFavorite = (id) => {
  if (!authStore.isAuthenticated) {
    uiStore.toast('登录后才能收藏', 'info')
    uiStore.openAuth('login')
    return
  }

  const item = episodes.value.find((episode) => episode.id === id)
  if (item) item.favorite = !item.favorite
}

const selectEpisode = (id) => {
  const targetIndex = episodes.value.findIndex((episode) => episode.id === id)
  if (targetIndex < 0) return

  const direction = targetIndex > activeIndex.value ? 'next' : 'prev'
  const allowed = canSlide(direction, targetIndex)

  onSlideAttempt({
    direction,
    from: activeIndex.value,
    to: targetIndex,
    allowed
  })

  if (!allowed) {
    onSlideBlocked({
      direction,
      from: activeIndex.value,
      to: targetIndex,
      reason: getBlockReason(direction, targetIndex)
    })
    return
  }

  swiperRef.value?.slideTo(targetIndex)
}

const unlockEpisode = (id) => {
  const item = episodes.value.find((episode) => episode.id === id)
  if (!item) return

  item.unlocked = true
  paywallEpisode.value = null
  uiStore.toast(`第 ${item.index} 集已解锁`, 'success')
  selectEpisode(id)
}

const track = (payload) => {
  console.log('[track]', payload)
}
</script>

<style scoped lang="scss">
.feed {
  width: 100vw;
  height: 100dvh;
  background: #050505;
}

.feed__swiper {
  width: 100%;
  height: 100%;
}
</style>
