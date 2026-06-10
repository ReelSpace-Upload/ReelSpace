<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="glass-panel rounded-2xl p-10 text-center">
      <UIcon name="i-lucide-loader-circle" class="mx-auto h-10 w-10 animate-spin text-indigo-300" />
      <p class="mt-4 text-slate-300">Finalisation de la connexion…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/')
})
</script>
