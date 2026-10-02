<template>
  <div class="relative w-full h-full flex items-center justify-center">
    <!-- 精密机械的金属底盘微光 -->
    <div
      class="absolute inset-4 rounded-full pointer-events-none"
      :style="bezelStyle"
      aria-hidden="true"
    ></div>

    <svg
      class="relative z-10 w-full h-full"
      viewBox="0 0 120 120"
      style="fill: none !important;"
      aria-hidden="true"
    >
      <defs>
        <!-- 已走过刻度的高亮遮罩：用一段与进度等长的白色弧遮出刻度组 -->
        <mask :id="maskId">
          <circle
            cx="60"
            cy="60"
            r="52"
            pathLength="1"
            fill="none"
            stroke="#fff"
            stroke-width="12"
            :stroke-dasharray="`${litFraction} 1`"
          />
        </mask>
      </defs>

      <!-- 单向旋转表圈外环 -->
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke-width="1.25"
        class="chrono-bezel"
        :stroke-dasharray="bezelDash"
        :transform="`rotate(${bezelRotation} 60 60)`"
      />

      <!-- 未点亮的细刻度（60 格，用归一化路径长度一次成型）-->
      <circle
        cx="60"
        cy="60"
        r="50"
        pathLength="300"
        class="chrono-tick"
        stroke-dasharray="1.2 3.8"
      />

      <!-- 每 5 格的主刻度 -->
      <circle
        cx="60"
        cy="60"
        r="50"
        pathLength="60"
        class="chrono-tick chrono-tick--major"
        stroke-dasharray="2 3"
      />

      <!-- 已走过的高亮刻度组 -->
      <g :mask="`url(#${maskId})`">
        <circle
          cx="60"
          cy="60"
          r="50"
          pathLength="300"
          class="chrono-tick chrono-tick--lit"
          stroke-dasharray="1.2 3.8"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          pathLength="60"
          class="chrono-tick chrono-tick--lit"
          stroke-dasharray="2 3"
        />
      </g>

      <!-- 四个基准位数字（0 / 15 / 30 / 45）-->
      <text x="60" y="20" font-size="12" font-weight="700" text-anchor="middle" class="chrono-numeral">0</text>
      <text x="101" y="64" font-size="12" font-weight="700" text-anchor="middle" class="chrono-numeral">15</text>
      <text x="60" y="107" font-size="12" font-weight="700" text-anchor="middle" class="chrono-numeral">30</text>
      <text x="19" y="64" font-size="12" font-weight="700" text-anchor="middle" class="chrono-numeral">45</text>

      <!-- 扫视指针：只在非待机时出现，凝滞时去饱和 -->
      <g v-if="uiPhase !== 'idle'" :class="{ 'chrono-hand--frozen': frozen }">
        <line
          x1="60"
          y1="60"
          x2="60"
          y2="14"
          :stroke="tint"
          stroke-width="2"
          stroke-linecap="round"
          class="chrono-hand st-pomo-anim-soft"
          :style="{ transform: `rotate(${handAngle}deg)`, transformOrigin: '60px 60px' }"
        />
        <circle
          cx="60"
          cy="60"
          r="3"
          :fill="tint"
          class="chrono-hand-cap"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UiPhase } from '../../../utils/pomodoro';

const props = defineProps<{
  progress: number;
  displayText?: string;
  subtitle?: string;
  uiPhase: UiPhase;
  frozen: boolean;
  heat: number;
}>();

/** 同一页面可能挂载多个实例，遮罩 id 必须唯一 */
const maskId = `chrono-mask-${Math.random().toString(36).slice(2, 9)}`;

const tint = 'var(--pomo-tint, var(--b3-theme-primary))';

const litFraction = computed(() => (
  props.uiPhase === 'idle' ? 0 : Math.max(0, Math.min(1, props.progress))
));

/** 指针角度：正北为 0，顺时针推进 */
const handAngle = computed(() => props.progress * 360);

/** 表圈随进度单向旋转，模拟潜水表圈的锁定推进 */
const bezelRotation = computed(() => -props.progress * 30);
const bezelDash = computed(() => (props.uiPhase === 'idle' ? '3 5' : '4 4'));

const bezelStyle = computed(() => {
  if (props.frozen) {
    return { background: 'radial-gradient(circle, var(--st-pomo-frozen-bg) 0%, transparent 72%)' };
  }
  return {
    background: 'radial-gradient(circle, color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 12%, transparent) 0%, transparent 74%)',
  };
});
</script>

<style scoped>
.chrono-bezel {
  stroke: color-mix(in srgb, var(--b3-theme-on-background) 16%, transparent);
  transition: stroke-dasharray 1.2s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.chrono-tick {
  stroke: color-mix(in srgb, var(--b3-theme-on-background) 14%, transparent);
  stroke-width: 1;
  transition: stroke 0.3s ease;
}

.chrono-tick--major {
  stroke: color-mix(in srgb, var(--b3-theme-on-background) 30%, transparent);
  stroke-width: 1.75;
}

.chrono-tick--lit {
  stroke: var(--pomo-tint, var(--b3-theme-primary));
  filter: drop-shadow(0 0 2px color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 55%, transparent));
}

.chrono-numeral {
  fill: color-mix(in srgb, var(--b3-theme-on-background) 42%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

.chrono-hand {
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 60%, transparent));
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}

.chrono-hand-cap {
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 70%, transparent));
}

.chrono-hand--frozen {
  filter: grayscale(1);
  opacity: 0.55;
}
</style>
