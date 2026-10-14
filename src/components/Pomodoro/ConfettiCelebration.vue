<template>
  <div
    class="sy-confetti-wrap"
    role="presentation"
    aria-hidden="true"
    :class="{ 'is-fading': isFading }"
  >
    <canvas
      v-if="!reduced"
      ref="canvasEl"
      class="sy-confetti-canvas"
    />
    <div class="sy-confetti-banner">
      <div class="sy-confetti-badge">
        <span class="sy-confetti-title">{{ t('pomodoroCelebrationTitle') }}</span>
        <span class="sy-confetti-sub">{{ t('pomodoroCelebrationSubtitle') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { t } from '../../i18n'

const props = withDefaults(
  defineProps<{
    reduced?: boolean
  }>(),
  { reduced: false },
)

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const isFading = ref(false)
let animId: number | null = null
let fadeTimer: ReturnType<typeof setTimeout> | null = null
let doneTimer: ReturnType<typeof setTimeout> | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vRot: number
  scaleY: number
  vScale: number
  shape: 'rect' | 'circle'
}

const COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f43f5e', // rose
]

function startAnimation() {
  if (props.reduced || !canvasEl.value) {
    fadeTimer = setTimeout(() => {
      isFading.value = true
    }, 1200)
    doneTimer = setTimeout(() => {
      emit('complete')
    }, 1600)
    return
  }

  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height

  // 生成粒子群
  const particles: Particle[] = []
  const count = 48
  const startX = width / 2
  const startY = height * 0.42

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
    const speed = 2.5 + Math.random() * 5.5
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.8, // 初始向上喷发
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      scaleY: 1,
      vScale: 0.08 + Math.random() * 0.1,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    })
  }

  let startTime = performance.now()
  const duration = 1600

  function render(time: number) {
    const elapsed = time - startTime
    ctx!.clearRect(0, 0, width, height)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.16 // 重力
      p.vx *= 0.985 // 空气阻力
      p.rotation += p.vRot
      p.scaleY = Math.cos(elapsed * p.vScale)

      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.rotation)
      ctx!.scale(1, p.scaleY)
      ctx!.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5)
      } else {
        ctx!.beginPath()
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.restore()
    }

    if (elapsed < duration) {
      animId = requestAnimationFrame(render)
    }
  }

  animId = requestAnimationFrame(render)

  fadeTimer = setTimeout(() => {
    isFading.value = true
  }, 1300)

  doneTimer = setTimeout(() => {
    emit('complete')
  }, 1700)
}

onMounted(() => {
  void nextTick(() => {
    startAnimation()
  })
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (fadeTimer) clearTimeout(fadeTimer)
  if (doneTimer) clearTimeout(doneTimer)
})
</script>

<style scoped>
.sy-confetti-wrap {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 350ms ease-out;
}
.sy-confetti-wrap.is-fading {
  opacity: 0;
}
.sy-confetti-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.sy-confetti-banner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: sy-confetti-pop 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.sy-confetti-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 18px;
  border-radius: 16px;
  background: var(--b3-theme-surface, rgba(30, 32, 48, 0.88));
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--st-pomo-line, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(8px);
}
.sy-confetti-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--st-pomo-ink, #ffffff);
  letter-spacing: 0.02em;
}
.sy-confetti-sub {
  font-size: 11px;
  color: var(--st-pomo-muted, rgba(255, 255, 255, 0.7));
}
@keyframes sy-confetti-pop {
  0% {
    transform: scale(0.7) translateY(12px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
