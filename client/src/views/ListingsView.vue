<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12">
        <h2> Listings </h2>

          <v-pagination v-model="currentPage" :length="length"></v-pagination>

          <div class="paginated-list">
            <album-panel v-for="item of albumsToShow" :key="item._id" :album="item" />
          </div>
          <!-- <paginated-results :items="albums.allAlbums" v-model="currentPage" v-slot="{ item }">
            <album-panel :album="item" />
          </paginated-results> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import AlbumPanel from '@/components/AlbumPanel.vue';
import { useAlbumsStore } from '@/stores/albums';
import { useRoute, useRouter } from 'vue-router';
import PaginatedResults from '@/components/PaginatedResults.vue';

const page_length = 15

const route = useRoute()
const router = useRouter()

const albums = useAlbumsStore()

const currentPage = ref(1)

const pageParam = computed(() => {
  let page = parseInt(route.query.page?.toString() || '')
  return isNaN(page) ? 0 : page
})

watch(() => currentPage.value, (newVal, oldVal) => {
  if (oldVal === newVal) {
    return
  }

  router.push({ path: route.path, query: { ...route.query, page: currentPage.value } })
})

const length = computed(() => {
  return Math.floor(albums.allAlbums.length / page_length)
})

const albumsToShow = computed(() => {
  let page = parseInt(route.query.page?.toString() || '')
  page = isNaN(page) ? 0 : page

  let page_index = page * page_length

  return albums.allAlbums.slice(page_index, page_index + page_length)
})

onMounted(() => {
  currentPage.value = pageParam.value || 1
})
</script>

<style>
@media (min-width: 1024px) {
  .about {
    display: flex;
    align-items: center;
  }
}

.paginated-list {
  display: grid;
  grid-template-columns: repeat(3, calc(calc(100% / 3) - 20px));
  gap: 10px;
  justify-content: center;
}
</style>
