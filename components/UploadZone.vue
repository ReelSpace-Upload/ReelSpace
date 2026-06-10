<template>
  <div
    class="upload-zone gradient-border glass-panel relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-white/10 p-8 text-center sm:p-14"
    :class="{ 'upload-zone--active': isDragging, 'pointer-events-none opacity-60': uploading }"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="openPicker"
  >
    <div class="glow-orb h-48 w-48 -top-10 -left-10 bg-indigo-500/30" aria-hidden="true" />
    <div class="glow-orb h-48 w-48 -bottom-16 -right-10 bg-violet-500/20 animate-float-slow" aria-hidden="true" />

    <input
      ref="inputRef"
      type="file"
      accept="video/*"
      class="hidden"
      @change="onPick"
    >

    <div class="relative">
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-inset ring-indigo-400/30">
        <UIcon
          :name="uploading ? 'i-lucide-loader-circle' : (isDragging ? 'i-lucide-download' : 'i-lucide-cloud-upload')"
          class="h-9 w-9 text-indigo-200"
          :class="{ 'animate-spin': uploading }"
        />
      </div>

      <h3 class="text-xl font-semibold text-white sm:text-2xl">
        {{ uploading ? 'Envoi en cours…' : (isDragging ? 'Déposez votre vidéo' : 'Glissez une vidéo ou cliquez ici') }}
      </h3>
      <p class="mt-2 text-sm text-slate-400">
        Un lien ReelSpace est généré automatiquement
      </p>

      <div class="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-2">
        <span class="stat-pill"><span class="h-1.5 w-1.5 rounded-full bg-indigo-400" />MP4</span>
        <span class="stat-pill"><span class="h-1.5 w-1.5 rounded-full bg-violet-400" />WebM</span>
        <span class="stat-pill"><span class="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />MOV</span>
        <span class="stat-pill"><span class="h-1.5 w-1.5 rounded-full bg-cyan-400" />AVI</span>
        <span class="stat-pill"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />MKV</span>
        <span class="stat-pill"><UIcon name="i-lucide-hard-drive" class="h-3.5 w-3.5" />{{ maxMb }} Mo max</span>
      </div>

      <div v-if="uploading" class="mx-auto mt-7 max-w-md">
        <UProgress :model-value="progress" color="primary" size="sm" />
        <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Téléversement</span>
          <span class="font-mono text-indigo-300">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  uploading: boolean
  progress: number
  maxMb: number
}>()

const emit = defineEmits<{ upload: [file: File] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function openPicker() {
  if (!props.uploading) inputRef.value?.click()
}

function handleFile(file: File | undefined) {
  if (file && !props.uploading) emit('upload', file)
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  handleFile(target.files?.[0])
  target.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  handleFile(event.dataTransfer?.files?.[0])
}
</script>
