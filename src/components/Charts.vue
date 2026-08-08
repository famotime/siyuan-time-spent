<template>
  <div class="charts-container h-64 w-full">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { TimeLog } from '../models/TimeLog';

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

const props = defineProps<{
  logs: TimeLog[]
}>();

const option = computed(() => {
  // Aggregate by docId for demo (in full version, it should aggregate by Notebook/Tag based on DocumentMeta)
  const aggregated: Record<string, number> = {};
  
  props.logs.forEach(log => {
    const docId = log.docId || 'Unknown';
    if (!aggregated[docId]) {
      aggregated[docId] = 0;
    }
    aggregated[docId] += log.duration;
  });
  
  const data = Object.keys(aggregated).map(key => ({
    name: key,
    value: aggregated[key]
  }));
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}s ({d}%)',
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#f3f4f6' }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#9ca3af' }
    },
    series: [
      {
        name: 'Time Spent',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#1f2937',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#f3f4f6'
          }
        },
        labelLine: {
          show: false
        },
        data: data.length > 0 ? data : [{ name: 'No Data', value: 0 }]
      }
    ]
  };
});
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
