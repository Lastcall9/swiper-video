# AGENTS.md

## 项目说明

这是一个 Nuxt 4 + Vite 的竖屏短剧播放器示例，已接入基础认证能力。

技术栈：

- Nuxt 4
- Vue 3 Composition API
- Pinia
- VueUse
- Swiper 竖向滑动
- xgplayer 播放内核
- SCSS 组件样式

## 常用命令

- 安装依赖：`pnpm install`
- 启动开发服务：`pnpm run dev -- --port 3008`
- 构建验证：`pnpm run build`

## 编码约定

- 业务代码使用箭头函数，例如 `const playNext = () => {}`。
- 不新增普通函数声明，例如不要写 `function playNext() {}`。
- 表单字段清洗优先放在模板层，例如 `v-model.trim`，不要在提交逻辑里到处写 `String(...).trim()`。
- 接口返回按约定结构处理，不要堆过多防御式类型判断。
- 能用 VueUse 的状态/计时/浏览器能力优先用 VueUse。
- 组件样式使用 `lang="scss"`。
- 播放器相关代码只在客户端运行，优先使用 `.client.vue` 或 `<ClientOnly>`。

## 播放组件

### `components/ShortDramaFeed.client.vue`

外层短剧信息流组件，负责 Swiper 竖向滑动。

主要职责：

- 维护当前播放集数 `activeIndex`。
- 保存 Swiper 实例 `swiperRef`。
- 渲染每一集对应的 `ShortDramaPlayer`。
- 当前视频播放结束后调用 `swiper.slideNext()` 自动进入下一集。
- 提供 `slide_attempt`、`slide_success`、`slide_blocked` 三类滑动回调。
- 通过 `canSlide(direction, targetIndex)` 处理试看、付费、广告、登录态等拦截。

当前示例里，第 2 集以后需要登录才允许继续向下滑。

### `components/ShortDramaPlayer.vue`

单集播放器组件，负责创建和销毁 xgplayer 实例。

主要职责：

- 初始化 xgplayer。
- 使用 `muted: true` 和 `volume: 0` 保证浏览器允许自动播放。
- 关闭 xgplayer 默认控制栏：`controls: false`。
- 禁用 xgplayer 移动端横向/纵向手势，避免和 Swiper 冲突。
- 自定义右侧操作按钮、底部标题、进度条、倍速面板和清晰度面板。

组件事件：

- `ended`：视频播放结束，用于通知外层切到下一集。
- `favorite`：点击收藏按钮时触发。
- `track`：播放器行为埋点。

## 认证迁移

认证逻辑从 `C:\Users\Cooper\Desktop\web` 迁移而来，接口参数保持一致。

关键文件：

- `plugins/api.js`：统一 `$apiFetch`，自动带 `Authorization`，401 时刷新 token 后重试。
- `core/api/auth-api.js`：登录、注册、邮箱验证码、Google 登录、Turnstile 检查等认证 API。
- `core/api/account-api.js`：当前用户资料 API。
- `core/api/token.js`：token 状态和 localStorage 持久化，使用 VueUse `useLocalStorage`。
- `stores/auth.js`：登录态、注册、登录、Google 登录、发码、退出登录。
- `stores/ui.js`：登录弹层和 toast。
- `components/AuthModal.vue`：简化 UI 的登录/注册弹层。
- `components/AuthStatusButton.vue`：页面左上角登录状态入口。
- `components/ToastHost.vue`：全局 toast。

## Google 登录和 CF Turnstile

保留原项目的接口契约：

- Google 登录接口：`POST /api/auth/google/login`
- Google 参数：`{ idToken, inviteCode }`
- 人机验证检查接口：`POST /api/auth/human-verification/required`
- 发邮箱验证码接口：`POST /api/auth/email/register/code`
- 发码参数带 `turnstileToken`
- 邮箱登录参数带 `turnstileToken`

相关文件：

- `composables/auth/useGooglePromptLogin.js`
- `composables/auth/useTurnstileScript.js`
- `composables/auth/useHumanVerification.js`

环境变量：

- `NUXT_API_BASE`
- `NUXT_GOOGLE_CLIENT_ID`
- `TURNSTILE_SITE_KEY`
- `NUXT_PUBLIC_GOOGLE_INVITE_CODE_REQUIRED`

## Git 约定

- 不提交 `node_modules`、`.nuxt`、`.output`、日志文件和环境变量文件。
- 每次改完至少运行 `pnpm run build`。
