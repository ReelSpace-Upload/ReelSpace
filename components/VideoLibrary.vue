<template>
  <section class="glass-panel rounded-2xl p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-white">Mes vidéos</h2>
        <p class="text-sm text-slate-400">{{ videos.length }} fichier{{ videos.length > 1 ? 's' : '' }}</p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-refresh-cw"
        label="Actualiser"
        :loading="loading"
        @click="$emit('refresh')"
      />
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
      <USkeleton v-for="n in 2" :key="n" class="h-36 rounded-xl" />
    </div>

    <div v-else-if="videos.length === 0" class="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
      <UIcon name="i-lucide-film" class="mx-auto mb-3 h-10 w-10 text-slate-600" />
      <p class="text-slate-400">Aucune vidéo pour le moment.</p>
      <p class="mt-1 text-sm text-slate-500">Uploadez votre première vidéo ci-dessus.</p>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-2">
      <article
        v-for="video in videos"
        :key="video.id"
        class="group rounded-xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-indigo-400/30 hover:bg-white/[0.04]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate font-medium text-white">{{ video.original_filename }}</h3>
            <p class="mt-1 text-xs text-slate-500">
              {{ formatDate(video.created_at) }} · {{ formatSize(video.file_size) }}
            </p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ video.mime_type.split('/')[1] || 'video' }}</UBadge>
        </div>

        <p class="mt-3 truncate rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-violet-300/90">
          {{ shareUrl(video.share_slug) }}
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="primary"
            variant="soft"
            icon="i-lucide-copy"
            label="Copier le lien"
            @click="$emit('copy', video.share_slug)"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-external-link"
            label="Ouvrir"
            @click="openUrl(video.share_slug)"
          />
          <UButton
            size="sm"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Supprimer"
            :loading="deletingId === video.id"
            @click="$emit('delete', video.id)"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Video } from '~/types/database'

defineProps<{
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

function openUrl(slug: string) {
  window.open(shareUrl(slug), '_blank', 'noopener,noreferrer')
}
</script>
