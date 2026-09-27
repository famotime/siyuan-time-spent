<template>
  <div class="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-3.5 w-full">
    <!-- Chart 1: Donut Chart with Dimension Switcher (按文档 / 按笔记本 / 按标签) -->
    <div class="chart-card sy-chart-card p-3.5 rounded-xl shadow-xs flex flex-col">
      <div class="chart-header flex justify-between items-center mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
          <span class="text-xs sm:text-sm font-semibold sy-text-primary">
            {{ proportionMode === 'doc' ? t('chartDocDistribution') : proportionMode === 'notebook' ? t('chartNotebookDistribution') : t('chartTagDistribution') }}
          </span>
        </div>

        <!-- Dimension Switcher (按文档 / 按笔记本 / 按标签) -->
        <div class="inline-flex items-center sy-chart-pill-group p-0.5 rounded-lg text-xs">
          <button
            @click="proportionMode = 'doc'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'doc' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'sy-text-secondary hover:sy-text-primary'"
          >
            {{ t('chartByDoc') }}
          </button>
          <button
            @click="proportionMode = 'notebook'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'notebook' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'sy-text-secondary hover:sy-text-primary'"
          >
            {{ t('chartByNotebook') }}
          </button>
          <button
            @click="proportionMode = 'tag'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'tag' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'sy-text-secondary hover:sy-text-primary'"
          >
            {{ t('chartByTag') }}
          </button>
        </div>
      </div>

      <div class="chart-wrapper h-52 sm:h-56 w-full">
        <v-chart class="chart" :option="pieOption" autoresize />
      </div>
    </div>

    <!-- Chart 2: Dynamic Trend & Time Slot Distribution OR Top 10 Ranking -->
    <div class="chart-card sy-chart-card p-3.5 rounded-xl shadow-xs flex flex-col">
      <div class="chart-header flex justify-between items-center mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
          <span class="text-xs sm:text-sm font-semibold sy-text-primary">
            {{ rightChartMode === 'trend' ? trendTitle : t('chartRankingTop10') }}
          </span>
        </div>

        <!-- Mode Switcher (时段走势 / 耗时排行) -->
        <div class="inline-flex items-center sy-chart-pill-group p-0.5 rounded-lg text-xs">
          <button
            @click="rightChartMode = 'trend'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="rightChartMode === 'trend' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'sy-text-secondary hover:sy-text-primary'"
          >
            {{ t('chartModeTrend') }}
          </button>
          <button
            @click="rightChartMode = 'ranking'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="rightChartMode === 'ranking' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'sy-text-secondary hover:sy-text-primary'"
          >
            {{ t('chartModeRanking') }}
          </button>
        </div>
      </div>

      <div class="chart-wrapper h-52 sm:h-56 w-full">
        <v-chart class="chart" :option="rightChartMode === 'trend' ? barOption : rankingBarOption" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { TimeLog } from '../models/TimeLog';
import { docTitles, fetchDocTitle, getDocMeta } from '../utils/title-cache';
import { t, formatDurationI18n, currentLang, getWeekdayNames } from '../i18n';

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
]);

const props = withDefaults(
  defineProps<{
    logs: TimeLog[];
    scopeType: 'day' | 'week' | 'month';
    scopeDateTitle?: string;
    dayMap?: Record<string, TimeLog[]>;
    dayLabels?: { key: string; label: string }[];
  }>(),
  {
    scopeType: 'day',
    scopeDateTitle: '',
    dayMap: () => ({}),
    dayLabels: () => [],
  }
);

// 模式状态
const proportionMode = ref<'doc' | 'notebook' | 'tag'>('doc');
const rightChartMode = ref<'trend' | 'ranking'>('trend');

// ==================== 明暗双模主题感知体系 ====================
const isDarkMode = ref(true);

const detectThemeMode = () => {
  // 1. 优先读取思源原生配置
  if ((window as any).siyuan?.config?.appearance?.mode !== undefined) {
    isDarkMode.value = (window as any).siyuan.config.appearance.mode === 1;
    return;
  }
  // 2. 读取 HTML / Body 属性
  const htmlTheme = document.documentElement.getAttribute('data-theme-mode');
  const bodyTheme = document.body.getAttribute('data-theme-mode');
  if (htmlTheme === 'dark' || bodyTheme === 'dark') {
    isDarkMode.value = true;
    return;
  }
  if (htmlTheme === 'light' || bodyTheme === 'light') {
    isDarkMode.value = false;
    return;
  }
  // 3. 兜底系统配色
  isDarkMode.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

let themeObserver: MutationObserver | null = null;

onMounted(() => {
  detectThemeMode();
  themeObserver = new MutationObserver(() => {
    detectThemeMode();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });
});

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
});

// 动态主题色彩映射 Token
const themeColors = computed(() => {
  if (isDarkMode.value) {
    return {
      axisText: '#8b949e',
      axisLine: 'rgba(255, 255, 255, 0.12)',
      splitLine: 'rgba(255, 255, 255, 0.08)',
      tooltipBg: 'rgba(15, 23, 42, 0.95)',
      tooltipBorder: 'rgba(255, 255, 255, 0.15)',
      tooltipText: '#f0f6fc',
      emptyText: '#6e7681',
      barLabel: '#8b949e'
    };
  } else {
    return {
      axisText: '#475569',
      axisLine: 'rgba(0, 0, 0, 0.15)',
      splitLine: 'rgba(0, 0, 0, 0.06)',
      tooltipBg: 'rgba(255, 255, 255, 0.98)',
      tooltipBorder: 'rgba(0, 0, 0, 0.12)',
      tooltipText: '#0f172a',
      emptyText: '#94a3b8',
      barLabel: '#475569'
    };
  }
});

watch(
  () => props.logs,
  (newLogs) => {
    if (newLogs) {
      newLogs.forEach((log) => {
        if (log.docId) {
          fetchDocTitle(log.docId);
        }
      });
    }
  },
  { immediate: true, deep: true }
);

// 1. 按文档聚合
const sortedDocs = computed(() => {
  const aggregated: Record<string, number> = {};
  props.logs.forEach((log) => {
    const title = docTitles.value[log.docId] || log.docId || t('unknownDoc');
    if (!aggregated[title]) {
      aggregated[title] = 0;
    }
    aggregated[title] += log.duration;
  });

  return Object.keys(aggregated)
    .map((key) => ({
      name: key,
      value: aggregated[key],
    }))
    .sort((a, b) => b.value - a.value);
});

// 2. 按笔记本聚合
const sortedNotebooks = computed(() => {
  const aggregated: Record<string, number> = {};
  props.logs.forEach((log) => {
    const meta = getDocMeta(log.docId);
    const nbName = meta.notebookName || t('chartUnknownNotebook');
    if (!aggregated[nbName]) {
      aggregated[nbName] = 0;
    }
    aggregated[nbName] += log.duration;
  });

  return Object.keys(aggregated)
    .map((key) => ({
      name: key,
      value: aggregated[key],
    }))
    .sort((a, b) => b.value - a.value);
});

// 3. 按标签聚合
const sortedTags = computed(() => {
  const aggregated: Record<string, number> = {};
  props.logs.forEach((log) => {
    const meta = getDocMeta(log.docId);
    const tags = meta.tags && meta.tags.length > 0 ? meta.tags : [t('chartNoTag')];
    tags.forEach((tag) => {
      const tagName = tag.startsWith('#') ? tag : `#${tag}#`;
      aggregated[tagName] = (aggregated[tagName] || 0) + log.duration;
    });
  });

  return Object.keys(aggregated)
    .map((key) => ({
      name: key,
      value: aggregated[key],
    }))
    .sort((a, b) => b.value - a.value);
});

// 饼图展示数据
const currentPieList = computed(() => {
  if (proportionMode.value === 'doc') return sortedDocs.value;
  if (proportionMode.value === 'notebook') return sortedNotebooks.value;
  return sortedTags.value;
});

const pieData = computed(() => {
  const all = currentPieList.value;
  if (all.length <= 10) {
    return all;
  }
  const top10 = all.slice(0, 10);
  const rest = all.slice(10);
  const restDuration = rest.reduce((sum, item) => sum + item.value, 0);

  return [
    ...top10,
    {
      name: '...',
      value: restDuration,
      itemStyle: { color: isDarkMode.value ? '#64748b' : '#94a3b8' },
    },
  ];
});

// 现代莫兰迪调色板
const palette = [
  '#6366f1', // Indigo
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#06b6d4', // Cyan
];

const pieOption = computed(() => {
  const data = pieData.value;
  const hasData = data.length > 0;
  const tc = themeColors.value;
  const dimensionName =
    proportionMode.value === 'doc'
      ? t('chartDimensionDoc')
      : proportionMode.value === 'notebook'
      ? t('chartDimensionNotebook')
      : t('chartDimensionTag');

  return {
    backgroundColor: 'transparent',
    color: palette,
    tooltip: {
      trigger: 'item',
      backgroundColor: tc.tooltipBg,
      borderColor: tc.tooltipBorder,
      textStyle: { color: tc.tooltipText, fontSize: 12 },
      formatter: (params: any) => {
        const dur = formatDuration(params.value);
        if (params.name === '...') {
          const restCount = currentPieList.value.length - 10;
          return `<div class="font-sans font-semibold">${t('chartRemainingCount', { count: restCount, dimension: dimensionName })}</div>
                  <div class="text-xs text-indigo-400 mt-0.5">${t('chartTotalDuration', { duration: dur })} (${params.percent}%)</div>`;
        }
        return `<div class="font-sans font-semibold">${params.name}</div>
                <div class="text-xs text-indigo-400 mt-0.5">${t('chartTotalInvested', { duration: dur })} (${params.percent}%)</div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 5,
      textStyle: { 
        color: tc.axisText, 
        fontSize: 11 
      },
      formatter: (name: string) => {
        if (name === '...') return '...';
        return name.length > 10 ? name.substring(0, 10) + '...' : name;
      },
    },
    series: [
      {
        name: `${dimensionName}${t('chartFocusTime')}`,
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDarkMode.value ? '#161b22' : '#ffffff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
          },
        },
        data: hasData ? data : [{ name: t('chartNoData'), value: 0, itemStyle: { color: isDarkMode.value ? '#21262d' : '#e2e8f0' } }],
      },
    ],
  };
});

const trendTitle = computed(() => {
  if (props.scopeType === 'day') return `${t('chartTrendToday')} (${t('chartUnitMinutes')})`;
  if (props.scopeType === 'week') return `${t('chartTrendWeek')} (${t('chartUnitHours')})`;
  return `${t('chartTrendMonth')} (${t('chartUnitHours')})`;
});

// 时段趋势走势图配置 (自适应明暗主题)
const barOption = computed(() => {
  const tc = themeColors.value;

  if (props.scopeType === 'day') {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const minutes = Array(24).fill(0);

    props.logs.forEach((log) => {
      const d = new Date(log.startTime);
      const h = d.getHours();
      minutes[h] += Math.round(log.duration / 60);
    });

    return {
      backgroundColor: 'transparent',
      grid: { top: '15%', left: '8%', right: '5%', bottom: '15%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tc.tooltipBg,
        borderColor: tc.tooltipBorder,
        textStyle: { color: tc.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/><span class="text-cyan-500 font-bold font-mono">${item.value} ${t('chartUnitMinutes')}</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: hours.map((h, i) => (i % 3 === 0 ? h : '')),
        axisLine: { lineStyle: { color: tc.axisLine } },
        axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
      },
      yAxis: {
        type: 'value',
        name: t('chartUnitMinutes'),
        nameTextStyle: { color: tc.axisText, fontSize: 11 },
        splitLine: { lineStyle: { color: tc.splitLine, type: 'dashed' } },
        axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
      },
      series: [
        {
          name: t('chartFocusTime'),
          type: 'bar',
          data: minutes,
          barWidth: '60%',
          label: {
            show: false,
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#38bdf8' },
                { offset: 1, color: '#6366f1' },
              ],
            },
          },
        },
      ],
    };
  } else if (props.scopeType === 'week') {
    const labels =
      props.dayLabels.length === 7
        ? props.dayLabels.map((d) => d.label)
        : getWeekdayNames(currentLang.value);

    const hoursData = props.dayLabels.map((d) => {
      const dayLogs = props.dayMap[d.key] || [];
      const totalSec = dayLogs.reduce((acc, log) => acc + log.duration, 0);
      return Number((totalSec / 3600).toFixed(2));
    });

    return {
      backgroundColor: 'transparent',
      grid: { top: '15%', left: '8%', right: '5%', bottom: '15%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tc.tooltipBg,
        borderColor: tc.tooltipBorder,
        textStyle: { color: tc.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          const hrs = item.value;
          const mins = Math.round(hrs * 60);
          return `${item.name}<br/><span class="text-indigo-500 font-bold font-mono">${hrs} ${t('chartUnitHours')}</span> (${mins} ${t('chartUnitMinutes')})`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: tc.axisLine } },
        axisLabel: { color: tc.axisText, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: t('chartUnitHours'),
        nameTextStyle: { color: tc.axisText, fontSize: 11 },
        splitLine: { lineStyle: { color: tc.splitLine, type: 'dashed' } },
        axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
      },
      series: [
        {
          name: t('chartFocusTime'),
          type: 'bar',
          data: hoursData,
          barWidth: '45%',
          label: {
            show: false,
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#818cf8' },
                { offset: 1, color: '#4f46e5' },
              ],
            },
          },
        },
      ],
    };
  } else {
    const labels = props.dayLabels.map((d) => d.label);
    const hoursData = props.dayLabels.map((d) => {
      const dayLogs = props.dayMap[d.key] || [];
      const totalSec = dayLogs.reduce((acc, log) => acc + log.duration, 0);
      return Number((totalSec / 3600).toFixed(2));
    });

    return {
      backgroundColor: 'transparent',
      grid: { top: '15%', left: '8%', right: '5%', bottom: '15%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tc.tooltipBg,
        borderColor: tc.tooltipBorder,
        textStyle: { color: tc.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}${t('chartDaySuffix')}: <span class="text-emerald-500 font-bold font-mono">${item.value} ${t('chartUnitHours')}</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels.map((l, i) => (i % 3 === 0 || i === labels.length - 1 ? l : '')),
        axisLine: { lineStyle: { color: tc.axisLine } },
        axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
      },
      yAxis: {
        type: 'value',
        name: t('chartUnitHours'),
        nameTextStyle: { color: tc.axisText, fontSize: 11 },
        splitLine: { lineStyle: { color: tc.splitLine, type: 'dashed' } },
        axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
      },
      series: [
        {
          name: t('chartDailyFocus'),
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: hoursData,
          lineStyle: { width: 3, color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
              ],
            },
          },
        },
      ],
    };
  }
});

// Top 10 耗时文档排行条形图配置 (自适应明暗主题)
const rankingBarOption = computed(() => {
  const tc = themeColors.value;
  const top10 = sortedDocs.value.slice(0, 10).reverse();
  const titles = top10.map((d) => (d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name));
  const fullTitles = top10.map((d) => d.name);
  const minutes = top10.map((d) => Math.round(d.value / 60));

  return {
    backgroundColor: 'transparent',
    grid: { top: '8%', left: '3%', right: '12%', bottom: '8%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tc.tooltipBg,
      borderColor: tc.tooltipBorder,
      textStyle: { color: tc.tooltipText, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const dataIdx = item.dataIndex;
        const fullTitle = fullTitles[dataIdx] || item.name;
        const dur = formatDuration(item.value * 60);
        return `<div class="font-sans font-semibold">${fullTitle}</div>
                <div class="text-xs text-cyan-500 mt-1">${t('chartTotalInvested', { duration: dur })} (${item.value} ${t('chartUnitMinutes')})</div>`;
      },
    },
    xAxis: {
      type: 'value',
      name: t('chartUnitMinutes'),
      nameTextStyle: { color: tc.axisText, fontSize: 11 },
      splitLine: { lineStyle: { color: tc.splitLine, type: 'dashed' } },
      axisLabel: { color: tc.axisText, fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'category',
      data: titles,
      axisLine: { lineStyle: { color: tc.axisLine } },
      axisLabel: { color: tc.axisText, fontSize: 11 },
    },
    series: [
      {
        name: t('chartInvestedTime'),
        type: 'bar',
        data: minutes,
        barWidth: '55%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#06b6d4' },
              { offset: 1, color: '#3b82f6' },
            ],
          },
        },
        label: {
          show: false,
        },
      },
    ],
  };
});

const formatDuration = (seconds: number) => {
  return formatDurationI18n(seconds, currentLang.value);
};
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}

.sy-chart-card {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-chart-pill-group {
  background-color: var(--st-bg-elevated, #21262d);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-text-primary {
  color: var(--st-text-primary, #f0f6fc);
}

.sy-text-secondary {
  color: var(--st-text-secondary, #8b949e);
}
</style>
