import type {
  ComputedRef,
  Ref,
} from 'vue'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

export interface DialMotionOptions {
  /** 500ms tick 提供的毫秒基线锚点 */
  anchorMs: () => number
  /** 是否按墙钟推进：暂停与冻结时回落到锚点 */
  live: () => boolean
  /** 关闭帧插值时退化为秒级阶跃，指针照走、只是不再扫动 */
  smooth: () => boolean
  /** 一整圈的毫秒数；正计时模式由 sweep 覆盖为 60 秒环 */
  totalMs: () => number
  /** 正计时走秒环：表盘进度 = 已过毫秒落在本分钟内的位置 */
  sweep: () => boolean
}

export interface DialMotion {
  /** 帧插值后的会话毫秒数，暂停时与锚点重合 */
  motionMs: Ref<number>
  /** 表盘环进度 0..1，与 capsule 的进度轴同口径 */
  fraction: ComputedRef<number>
}

const MINUTE_MS = 60_000

/**
 * 表盘走时：props 只提供 500ms 的校准锚点，帧循环在两个锚点之间线性外推，
 * 于是秒针 60s/圈、分针 60min/圈、时针 12h/圈，全都按真实钟表速度推进。
 * 锚点每次到达都会把外推拉回真值，长时间悬挂（休眠唤醒）后不会持续漂移。
 */
export function useDialMotion(options: DialMotionOptions): DialMotion {
  const motionMs = ref(options.anchorMs())
  let raf = 0
  let disposed = false
  let anchorValue = motionMs.value
  let anchorAt = 0

  function retarget() {
    anchorValue = options.anchorMs()
    anchorAt = performance.now()
    if (!options.smooth()) {
      // 减弱动效：直接贴合锚点，同样获得秒级走动，只是没有插值扫动
      motionMs.value = anchorValue
    }
  }

  function startFrames() {
    if (raf || disposed || !options.smooth()) return
    retarget()
    const frame = (now: number) => {
      motionMs.value = options.live()
        ? anchorValue + Math.max(0, now - anchorAt)
        : anchorValue
      if (!disposed) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
  }

  function stopFrames() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  onMounted(startFrames)
  onUnmounted(() => {
    disposed = true
    stopFrames()
  })

  // 锚点推进（每个 tick）、暂停 / 恢复、正计时切换都重新对齐
  watch([
    options.anchorMs,
    options.live,
    options.totalMs,
    options.sweep,
  ], retarget)

  // 动效强度或系统偏好中途变化：只在需要时才接管帧循环
  watch(options.smooth, (enabled) => {
    if (enabled) {
      startFrames()
      return
    }
    stopFrames()
    // 停帧后把残留的插值偏差收回锚点，秒级阶跃继续走
    retarget()
  })

  const fraction = computed(() => {
    if (options.sweep()) {
      return (motionMs.value % MINUTE_MS) / MINUTE_MS
    }
    const total = options.totalMs()
    if (!(total > 0)) return 0
    return Math.max(0, Math.min(1, motionMs.value / total))
  })

  return {
    motionMs,
    fraction,
  }
}
