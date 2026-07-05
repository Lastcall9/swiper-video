# AGENTS.md

## 项目说明

这是一个最小化的 Nuxt 4 + Vite 竖屏短剧播放器示例。

技术栈：

- Nuxt 4
- Vue 3 Composition API
- Swiper 竖向滑动
- xgplayer 作为视频播放内核

## 常用命令

- 安装依赖：`pnpm install`
- 启动开发服务：`pnpm run dev -- --port 3008`
- 构建验证：`pnpm run build`

## 编码约定

- 本项目业务代码必须优先使用箭头函数，例如 `const playNext = () => {}`。
- 不新增普通函数声明，例如不要写 `function playNext() {}`。
- 播放器相关代码只在客户端运行，优先使用 `.client.vue` 或 `<ClientOnly>`。
- 不使用 xgplayer 默认控制栏做短剧 UI，xgplayer 只负责播放能力，业务按钮使用 Vue 浮层实现。

## 组件使用说明

### `components/ShortDramaFeed.client.vue`

这是短剧信息流外层组件，负责 Swiper 竖向滑动。

主要职责：

- 维护当前播放集数 `activeIndex`。
- 保存 Swiper 实例 `swiperRef`。
- 渲染每一集对应的 `ShortDramaPlayer`。
- 当前视频播放结束后调用 `swiper.slideNext()` 自动进入下一集。
- 提供滑动尝试、滑动成功、滑动拦截的埋点入口。

核心回调：

- `slide_attempt`：用户尝试滑动时触发。
- `slide_success`：Swiper 成功切换到另一集后触发。
- `slide_blocked`：滑动被业务规则拦截时触发。

拦截入口：

- `canSlide(direction, targetIndex)`

后续试看、付费、广告、解锁逻辑都放在这里判断。返回 `false` 就代表禁止滑动。

示例逻辑：

```js
const canSlide = (direction, targetIndex) => {
  if (targetIndex < 0 || targetIndex >= episodes.value.length) return false
  if (direction === 'next' && !canSlideNext.value) return false
  if (direction === 'prev' && !canSlidePrev.value) return false
  return true
}
```

### `components/ShortDramaPlayer.vue`

这是单集播放器组件，负责创建和销毁 xgplayer 实例。

主要职责：

- 初始化 xgplayer。
- 使用 `muted: true` 和 `volume: 0` 保证浏览器允许自动播放。
- 关闭 xgplayer 默认控制栏：`controls: false`。
- 禁用 xgplayer 移动端横向/纵向手势，避免和 Swiper 冲突。
- 自定义右侧操作按钮、底部标题、进度条、倍速面板和清晰度面板。

组件入参：

- `episode`：当前集数据，包含 `id`、`title`、`desc`、`url`、`poster`、`favorite`。
- `active`：当前集是否处于可见播放状态。

组件事件：

- `ended`：视频播放结束，用于通知外层切到下一集。
- `favorite`：点击收藏按钮时触发。
- `track`：播放器行为埋点，例如播放、暂停、结束、倍速切换、静音切换。

自动播放说明：

- 页面进入后当前集会自动播放。
- 为了符合浏览器策略，默认静音播放。
- 用户点击 `Audio` 按钮后才切换声音。

## 后续扩展位置

- 清晰度：在 `ShortDramaPlayer.vue` 的清晰度面板里接入真实清晰度列表和 xgplayer 切源能力。
- 倍速：当前已提供 `0.75`、`1`、`1.25`、`1.5`、`2`。
- 试看：在 `ShortDramaPlayer.vue` 监听播放时间，达到试看秒数后暂停并弹出付费层。
- 广告：建议在 `ShortDramaFeed.client.vue` 切集前判断是否需要广告，广告结束后再允许播放正片。
- 埋点：统一通过 `track(payload)` 处理，后续替换为真实上报接口。

## Git 约定

- 不提交 `node_modules`、`.nuxt`、`.output`、日志文件和环境变量文件。
- 保持示例项目轻量，除非业务逻辑已经出现，否则不要过早抽象。
