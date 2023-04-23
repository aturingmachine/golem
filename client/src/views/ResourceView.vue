<template>
  <v-container v-if="resources.current">
    <v-row>
      <v-col cols="12" class="mb-5">
        <h2>
          Uptime: {{ uptime }}
        </h2>
      </v-col>

      <v-col cols="12" class="resource-card cpu-chart">
        <h3>CPU Load: {{ resources.current.load }}%</h3>
        <Chart
          :size="{ width: 500, height: 420 }"
          :data="loadData"
          :direction="'horizontal'"
          :axis="axis"
          :margin="{
            left: 0,
            top: 20,
            right: 0,
            bottom: 20
          }"
        >
          <template #layers>
            <Grid strokeDasharray="2,2" />
            <Line :dataKeys="['name', 'val']" />
            <!-- <Line :dataKeys="['name', 'avg']" :lineStyle="{ stroke: 'red' }" type="step" /> -->
          </template>

          <template #widgets>
            <Tooltip
              borderColor="#48CAE4"
              :config="{
                name: { hide: true },
                pl: { color: '#0077b6' },
                avg: { label: 'averange', color: 'red' },
                inc: { hide: true }
              }"
            />
          </template>

        </Chart>
      </v-col>

      <v-col cols="12" class="resource-card mem-chart">
        <h3>Current Memory Usage:</h3>

        <dl>
          <template v-for="data of memData" :key="data.name">
            <dt>{{ data.name }}</dt>
            <dd>{{ data.val }}GB</dd>
          </template>
        </dl>

        <!-- <h3>Current Memory Usage: {{ (resources.totalMem / 1000 - (resources.totalMem * resources.current.freemem / 1000)).toFixed(2) }}GB</h3> -->
        <!-- <Responsive>
          <template #main="{ width }">
            <Chart
              direction="circular"
              :size="{ width, height: 400 }"
              :data="memData"
              :config="{ controlHover: false }"
              :axis="undefined"
              :margin="{
                left: Math.round((width - 360)/2),
                top: 20,
                right: 0,
                bottom: 20
              }"
              >
              <template #layers>
                <Pie
                  :dataKeys="['name', 'val']"
                  :pie-style="{ innerRadius: 100, padAngle: 0.05 }" />
              </template>
              <template #widgets>
                <Tooltip
                  :config="{
                    name: { },
                  }"
                  hideLine
                />
              </template>
            </Chart>
          </template>
        </Responsive> -->
      </v-col>

      <v-col cols="6" class="resource-card">
        <h3>Total Local Listings: {{ listings.list.length }}</h3>
        <h3>Total Local Albums: {{ albums.allAlbums.length }}</h3>
      </v-col>
    </v-row>
  </v-container>
  <v-progress-circular indeterminate v-else></v-progress-circular>
</template>

<script setup lang="ts">
import { useAlbumsStore } from '@/stores/albums';
import { useListingsStore } from '@/stores/listings';
import { useResourceStore } from '@/stores/resources';
import { convertMS } from '@/utils/time';
import { computed, ref } from 'vue';
import { Chart, Grid, Line, Responsive, Tooltip, Pie } from 'vue3-charts'

const resources = useResourceStore()
const listings = useListingsStore()
const albums = useAlbumsStore()

const freeMem = computed(() => resources.totalMem * resources.current.freemem)
const golemMemUsage = computed(() => {
  const golemMemPercent = resources.current.currentmemmaybe / 100
  const golemMem = golemMemPercent * resources.totalMem

  return golemMem
})
const totalMemUsage = computed(() => resources.totalMem - (freeMem.value - golemMemUsage.value))

const memData = computed(() => {
  return [
    { name: 'Free Memory', val: (freeMem.value / 1000).toFixed(2) },
    { name: 'Current Total Memory Usage', val: (totalMemUsage.value / 1000).toFixed(2) },
    { name: 'Golem Memory Usage', val: (golemMemUsage.value / 1000).toFixed(2) }
    // total: resources.totalMem
  ]
})

const loadData = computed(() => {
  return resources.history.map((h, index) => {
    return { name: index, val: h.load, index }
  })
})


const axis = ref({
  primary: {
    domain: ['dataMin', 'dataMax'],
    type: 'linear',
    format: (val: number) => {
      
      return `T - ${60 - val}`
    }
  },

  secondary: {
    domain: ['dataMin', 'dataMax * 1.15 < 100 ? dataMax * 1.15 : dataMax'],
    type: 'linear',
    ticks: 5,
    format: (val: number) => {
      return `${val}%`
    }
  }
})

const uptime = computed(() => {
  const parsed = convertMS(resources.current?.uptime * 1000 || 0)

  let base = `${parsed.minute.toString().padStart(2, '0')}:${parsed.seconds.toString().padStart(2, '0')}`

  if (parsed.hour) {
    base = `${parsed.hour.toString().padStart(2, '0')}:${base}`
  }

  return base
})

</script>

<style>
.mem-chart svg .axis {
  display: none;
}
</style>
