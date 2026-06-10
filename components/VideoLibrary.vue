<template>
  <section class="glass-panel rounded-3xl p-5 sm:p-7">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10">
          <UIcon name="i-lucide-library" class="h-4.5 w-4.5 text-indigo-300" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-white sm:text-lg">Mes vidéos</h2>
          <p class="text-xs text-slate-500">
            {{ videos.length }} fichier{{ videos.length > 1 ? 's' : '' }}<template v-if="videos.length"> · {{ totalSize }}</template>
          </p>
        </div>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-refresh-cw"
        label="Actualiser"
        size="sm"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="n in 3" :key="n" class="h-44 rounded-2xl" />
    </div>

    <div v-else-if="videos.length === 0" class="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
        <UIcon name="i-lucide-film" class="h-6 w-6 text-slate-500" />
      </div>
      <p class="font-medium text-slate-300">Aucune vidéo pour le moment</p>
      <p class="mt-1 text-sm text-slate-500">Uploadez votre première vidéo ci-dessus.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="video in videos"
        :key="video.id"
        class="video-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-indigo-400/30 hover:bg-white/[0.035]"
      >
        <div class="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10">
          <div class="absolute inset-0 opacity-50" style="background-image: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.25), transparent 50%), radial-gradient(circle at 70% 70%, rgba(139,92,246,0.2), transparent 50%);" />
          <UIcon name="i-lucide-play" class="relative h-10 w-10 text-white/80 transition group-hover:scale-110 group-hover:text-white" />
          <UBadge
            color="neutral"
            variant="solid"
            class="absolute right-2 top-2 bg-black/50 text-[10px] uppercase tracking-wide backdrop-blur"
          >
            {{ video.mime_type.split('/')[1] || 'video' }}
          </UBadge>
        </div>

        <div class="flex flex-1 flex-col p-4">
          <h3 class="truncate font-medium text-white" :title="video.original_filename">
            {{ video.original_filename }}
          </h3>
          <p class="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <UIcon name="i-lucide-clock" class="h-3 w-3" />
            {{ formatDate(video.created_at) }}
            <span class="text-slate-700">·</span>
            <UIcon name="i-lucide-hard-drive" class="h-3 w-3" />
            {{ formatSize(video.file_size) }}
          </p>

          <div class="mt-3 flex items-center gap-1.5 truncate rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-violet-200/90">
            <UIcon name="i-lucide-link" class="h-3 w-3 shrink-0 text-violet-300/70" />
            <span class="truncate">{{ shareUrl(video.share_slug) }}</span>
          </div>

          <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
            <UButton
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-copy"
              label="Copier"
              @click="$emit('copy', video.share_slug)"
            />
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-external-link"
              label="Ouvrir"
              @click="openUrl(video.share_slug)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              square
              :loading="deletingId === video.id"
              class="ml-auto"
              @click="$emit('delete', video.id)"
            />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Video } from '~/types/database'

const props = defineProps<{
  videos: Video[]
  loading: boolean
  deletingId: string | null
  formatSize: (bytes: number) => string
  formatDate: (iso: string) => string
}>()

defineEmits<{
  refresh: []
  copy: [slug: string]
  delete: [id: string]
}>()

const { shareUrl } = useVideos()

const totalSize = computed(() => {
  const total = props.videos.reduce((sum, v) => sum + (v.file_size || 0), 0)
  return props.formatSize(total)
})

function openUrl(slug: string) {
  window.open(shareUrl(slug), '_blank', 'noopener,noreferrer')
}
</script>
