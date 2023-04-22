<template>
  <v-col 
    class="log-line rounded d-flex flex-column elevation-1 pa-2 mb-1" 
    cols="12" 
    :class="{ error: !!audit.error, 'bg-red': !!audit.error, 'bg-blue-grey-darken-2': !audit.error }"
  >
    <span class="timestamp justify-space-between d-flex">
      {{ new Date(audit.timestamp).toLocaleString() }}

      <span class="font-weight-bold">
        Trace: {{ audit.traceId }}
      </span>
    </span>
    <span>
      <span class="font-weight-bold">
        <v-avatar>
          <v-img :src="user.displayAvatarURL"></v-img>
        </v-avatar>
        {{ user.username }}
      </span>

    </span>
    <dl>
      <dt>Raw:</dt>
      <dd>{{ audit.raw }}</dd>

      <dt>Expanded:</dt>
      <dd>{{ audit.expanded }}</dd>
    </dl>
  </v-col>
</template>

<script setup lang="ts">
import type { AuditRecord } from '@/models/audits';
import { useGuildsStore } from '@/stores/guilds';
import { useUserStore } from '@/stores/users';
import { computed } from 'vue';

interface Props {
  audit: AuditRecord
}

const props = defineProps<Props>()

const users = useUserStore()
const guilds = useGuildsStore()

const guild = computed(() => {
  return guilds.records[props.audit.guildId]
})

const user = computed(() => {
  return users.records[props.audit.userId]
})
</script>

<style>
.log-line {
  font-family: 'Courier New', Courier, monospace;
}

/* .log-line.error {
  background
} */

.log-line .timestamp {
  font-weight: bold;
}

.log-line dl {
  padding: 10px;
}

.log-line dt {
  font-weight: bold;
}

.log-line dd {
  margin-left: 8px;
}
</style>
