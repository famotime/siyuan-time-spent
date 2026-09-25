<template>
  <div class="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-3.5 w-full">
    <!-- Chart 1: Donut Chart with Dimension Switcher (按文档 / 按笔记本 / 按标签) -->
    <div class="chart-card bg-gray-900/90 border border-gray-800/90 rounded-xl p-3.5 shadow-md flex flex-col">
      <div class="chart-header flex justify-between items-center mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
          <span class="text-xs sm:text-sm font-semibold text-gray-300">
            {{ proportionMode === 'doc' ? '文档投入分布' : proportionMode === 'notebook' ? '笔记本投入分布' : '标签投入分布' }}
          </span>
        </div>

        <!-- Dimension Switcher (按文档 / 按笔记本 / 按标签) -->
        <div class="inline-flex items-center bg-gray-800/80 border border-gray-700/60 p-0.5 rounded-lg text-[11px]">
          <button
            @click="proportionMode = 'doc'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'doc' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >
            按文档
          </button>
          <button
            @click="proportionMode = 'notebook'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'notebook' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >
            按笔记本
          </button>
          <button
            @click="proportionMode = 'tag'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="proportionMode === 'tag' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >
            按标签
          </button>
        </div>
      </div>

      <div class="chart-wrapper h-52 sm:h-56 w-full">
        <v-chart class="chart" :option="pieOption" autoresize />
      </div>
    </div>

    <!-- Chart 2: Dynamic Trend & Time Slot Distribution OR Top 10 Ranking -->
    <div class="chart-card bg-gray-900/90 border border-gray-800/90 rounded-xl p-3.5 shadow-md flex flex-col">
      <div class="chart-header flex justify-between items-center mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
          <span class="text-xs sm:text-sm font-semibold text-gray-300">
            {{ rightChartMode === 'trend' ? trendTitle : '专注耗时排行 Top 10' }}
          </span>
        </div>

        <!-- Mode Switcher (时段走势 / 耗时排行) -->
        <div class="inline-flex items-center bg-gray-800/80 border border-gray-700/60 p-0.5 rounded-lg text-[11px]">
          <button
            @click="rightChartMode = 'trend'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="rightChartMode === 'trend' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >
            时段走势
          </button>
          <button
            @click="rightChartMode = 'ranking'"
            class="px-2 py-0.5 rounded transition-all cursor-pointer"
            :class="rightChartMode === 'ranking' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >
            耗时排行
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
import { ref, computed, watch } from 'vue';
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
    const title = docTitles.value[log.docId] || log.docId || '未知文档';
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
    const nbName = meta.notebookName || '默认笔记本';
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
    const tags = meta.tags && meta.tags.length > 0 ? meta.tags : ['未打标签'];
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

// 饼图展示数据（最多显示前 10 项，多余的合并为 ...）
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
      itemStyle: { color: '#64748b' },
    },
  ];
});

// Modern Color Palette
const palette = [
  '#6366f1', // Indigo
  '#38bdf8', // Sky
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

const pieOption = computed(() => {
  const data = pieData.value;
  const hasData = data.length > 0;
  const dimensionName =
    proportionMode.value === 'doc'
      ? '文档'
      : proportionMode.value === 'notebook'
      ? '笔记本'
      : '标签';

  return {
    backgroundColor: 'transparent',
    color: palette,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#374151',
      textStyle: { color: '#f3f4f6', fontSize: 12 },
      formatter: (params: any) => {
        const dur = formatDuration(params.value);
        if (params.name === '...') {
          const restCount = currentPieList.value.length - 10;
          return `<div class="font-sans font-semibold">剩余 ${restCount} 个${dimensionName}</div>
                  <div class="text-xs text-indigo-300 mt-0.5">总时长: ${dur} (${params.percent}%)</div>`;
        }
        return `<div class="font-sans font-semibold">${params.name}</div>
                <div class="text-xs text-indigo-300 mt-0.5">时长: ${dur} (${params.percent}%)</div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 4,
      textStyle: { color: '#9ca3af', fontSize: 11 },
      formatter: (name: string) => {
        if (name === '...') return '...';
        return name.length > 10 ? name.substring(0, 10) + '...' : name;
      },
    },
    series: [
      {
        name: `${dimensionName}专注分布`,
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#111827',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: hasData ? data : [{ name: '暂无数据', value: 0, itemStyle: { color: '#374151' } }],
      },
    ],
  };
});

const trendTitle = computed(() => {
  if (props.scopeType === 'day') return '24小时时段分布 (分钟)';
  if (props.scopeType === 'week') return '周内每日专注对比 (小时)';
  return '整月每日专注走势 (小时)';
});

// 时段趋势走势图配置
const barOption = computed(() => {
  if (props.scopeType === 'day') {
    // 24 hours distribution
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
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/><span class="text-cyan-400 font-bold">${item.value} 分钟</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: hours.map((h, i) => (i % 3 === 0 ? h : '')),
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(75, 85, 99, 0.25)', type: 'dashed' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          name: '专注时长',
          type: 'bar',
          data: minutes,
          barWidth: '60%',
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
    // Week: 7 days
    const labels =
      props.dayLabels.length === 7
        ? props.dayLabels.map((d) => d.label)
        : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          const hrs = item.value;
          const mins = Math.round(hrs * 60);
          return `${item.name}<br/><span class="text-indigo-400 font-bold">${hrs} 小时</span> (${mins} 分钟)`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(75, 85, 99, 0.25)', type: 'dashed' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          name: '专注时长',
          type: 'bar',
          data: hoursData,
          barWidth: '45%',
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
    // Month: all days in month
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
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}号: <span class="text-emerald-400 font-bold">${item.value} 小时</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels.map((l, i) => (i % 3 === 0 || i === labels.length - 1 ? l : '')),
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(75, 85, 99, 0.25)', type: 'dashed' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          name: '每日专注',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: hoursData,
          lineStyle: { width: 3, color: '#34d399' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(52, 211, 153, 0.4)' },
                { offset: 1, color: 'rgba(52, 211, 153, 0.0)' },
              ],
            },
          },
        },
      ],
    };
  }
});

// Top 10 耗时文档排行条形图配置 (Horizontal Bar Chart)
const rankingBarOption = computed(() => {
  const top10 = sortedDocs.value.slice(0, 10).reverse(); // reverse 使第一名显示在最上方
  const titles = top10.map((d) => (d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name));
  const fullTitles = top10.map((d) => d.name);
  const minutes = top10.map((d) => Math.round(d.value / 60));

  return {
    backgroundColor: 'transparent',
    grid: { top: '8%', left: '3%', right: '12%', bottom: '8%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#374151',
      textStyle: { color: '#f3f4f6', fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const dataIdx = item.dataIndex;
        const fullTitle = fullTitles[dataIdx] || item.name;
        const dur = formatDuration(item.value * 60);
        return `<div class="font-sans font-semibold">${fullTitle}</div>
                <div class="text-xs text-cyan-400 mt-1">总投入: ${dur} (${item.value} 分钟)</div>`;
      },
    },
    xAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(75, 85, 99, 0.25)', type: 'dashed' } },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: titles,
      axisLine: { lineStyle: { color: '#4b5563' } },
      axisLabel: { color: '#cbd5e1', fontSize: 11 },
    },
    series: [
      {
        name: '投入时长',
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
          show: true,
          position: 'right',
          color: '#94a3b8',
          fontSize: 10,
          formatter: '{c}m',
        },
      },
    ],
  };
});

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
