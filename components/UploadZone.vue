<template>
  <div
    class="upload-zone glass-panel relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/10 p-8 text-center sm:p-12"
    :class="{ 'upload-zone--active': isDragging, 'pointer-events-none opacity-60': uploading }"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="openPicker"
  >
    <input
      ref="inputRef"
      type="file"
      accept="video/*"
      class="hidden"
      @change="onPick"
    >

    <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
      <UIcon
        :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-cloud-upload'"
        class="h-8 w-8 text-indigo-300"
        :class="{ 'animate-spin': uploading }"
      />
    </div>

    <h3 class="text-xl font-semibold text-white">
      {{ uploading ? 'Envoi en cours…' : 'Glissez une vidéo ou cliquez ici' }}
    </h3>
    <p class="mt-2 text-sm text-slate-400">
      MP4, WebM, MOV, AVI, MKV — jusqu'à {{ maxMb }} Mo
    </p>
    <p class="mt-3 text-xs text-slate-500">
      Un lien ReelSpace sera généré automatiquement
    </p>

    <div v-if="uploading" class="mx-auto mt-6 max-w-md">
      <UProgress :model-value="progress" color="primary" size="sm" />
      <p class="mt-2 text-xs text-slate-400">{{ progress }}%</p>
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
