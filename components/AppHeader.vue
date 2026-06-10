<template>
  <header class="sticky top-0 z-50 border-b border-white/5 bg-[#06080f]/70 backdrop-blur-xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
      <NuxtLink to="/" class="group flex items-center gap-3">
        <div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 transition group-hover:shadow-indigo-500/50">
          <UIcon name="i-lucide-clapperboard" class="h-5 w-5 text-white" />
          <span class="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 opacity-0 blur-md transition group-hover:opacity-60" />
        </div>
        <div class="leading-tight">
          <p class="text-[15px] font-semibold tracking-tight text-white">ReelSpace</p>
          <p class="text-[11px] text-slate-500">Liens vidéo directs &amp; sécurisés</p>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-2 sm:gap-3">
        <template v-if="user">
          <div class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-semibold text-white">
              {{ initial }}
            </span>
            <span class="max-w-[180px] truncate text-sm text-slate-300">{{ user.email }}</span>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            label="Déconnexion"
            class="hidden sm:inline-flex"
            @click="signOut"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            square
            class="sm:hidden"
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

const initial = computed(() => user.value?.email?.[0]?.toUpperCase() ?? '?')

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
