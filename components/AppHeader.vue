<template>
  <header class="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <NuxtLink to="/" class="group flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/20">
          <UIcon name="i-lucide-clapperboard" class="h-5 w-5 text-white" />
        </div>
        <div>
          <p class="text-lg font-semibold tracking-tight text-white">ReelSpace</p>
          <p class="text-xs text-slate-400">Liens vidéo directs & sécurisés</p>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-3">
        <template v-if="user">
          <div class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
            <UIcon name="i-lucide-user" class="h-4 w-4 text-slate-400" />
            <span class="max-w-[180px] truncate text-sm text-slate-300">{{ user.email }}</span>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            label="Déconnexion"
            @click="signOut"
          />
        </template>
        <UButton
          v-else
          to="/login"
          color="primary"
          icon="i-lucide-log-in"
          label="Connexion"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
