<template>
  <div class="feed">
    <AuthStatusButton />

    <Swiper
      direction="vertical"
      :allow-slide-next="canSlideNext"
      :allow-slide-prev="canSlidePrev"
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
          :active="index === activeIndex"
          @ended="playNext"
          @favorite="toggleFavorite"
          @track="track"
        />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import 'swiper/css'

const authStore = useAuthStore()
const uiStore = useUiStore()
const activeIndex = ref(0)
const swiperRef = ref(null)
const canSlideNext = ref(true)
const canSlidePrev = ref(true)
const revertingSlide = ref(false)

const episodes = ref([
  {
    id: 1,
    title: 'Episode 1',
    desc: 'Autoplay muted, vertical swipe, custom short-drama controls.',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    favorite: false
  },
  {
    id: 2,
    title: 'Episode 2',
    desc: 'Swipe up or wait for video ended, then it jumps to next episode.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    favorite: false
  },
  {
    id: 3,
    title: 'Episode 3',
    desc: 'This shell can later connect quality, rate, trial, ads and analytics.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
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

const playNext = () => {
  if (!swiperRef.value) return

  if (canSlide('next', activeIndex.value + 1)) {
    swiperRef.value.slideNext()
  }
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

  // Put trial/payment/ad checks here. Return false to block the swipe.
  return true
}

const getBlockReason = (direction, targetIndex) => {
  if (targetIndex < 0) return 'first_episode'
  if (targetIndex >= episodes.value.length) return 'last_episode'
  if (direction === 'next' && !canSlideNext.value) return 'next_disabled'
  if (direction === 'prev' && !canSlidePrev.value) return 'prev_disabled'
  if (direction === 'next' && targetIndex >= 1 && !authStore.isAuthenticated) return 'login_required'
  return 'business_rule'
}

const onSlideAttempt = (payload) => {
  track({ event: 'slide_attempt', ...payload })
}

const onSlideBlocked = (payload) => {
  track({ event: 'slide_blocked', ...payload })

  if (payload.reason === 'login_required') {
    uiStore.toast('请先登录后继续观看', 'info')
    uiStore.openAuth('login')
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
