<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="rs-auth-layout relative">
      <div class="glow-orb h-72 w-72 -top-20 -left-10 bg-indigo-500/20" aria-hidden="true" />
      <div class="glow-orb h-72 w-72 bottom-0 -right-10 bg-violet-500/20 animate-float-slow" aria-hidden="true" />

      <div class="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <section class="hidden lg:block">
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            Authentification sécurisée
          </div>
          <h1 class="gradient-text text-5xl font-bold leading-[1.05] tracking-tight">
            Vos vidéos,<br>votre espace.
          </h1>
          <p class="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Connectez-vous pour uploader vos vidéos, générer des liens propres
            et garder le contrôle total sur ce que vous partagez.
          </p>

          <ul class="mt-8 space-y-3.5">
            <li v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-inset ring-indigo-400/25">
                <UIcon :name="feature.icon" class="h-4 w-4 text-indigo-200" />
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ feature.title }}</p>
                <p class="text-xs text-slate-500">{{ feature.desc }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section class="glass-panel gradient-border relative w-full overflow-hidden rounded-3xl p-7 sm:p-9">
          <div class="mb-7 text-center lg:text-left">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 lg:mx-0">
              <UIcon name="i-lucide-clapperboard" class="h-7 w-7 text-white" />
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-white sm:text-[26px]">
              {{ isRegister ? 'Créer un compte' : 'Bon retour' }}
            </h1>
            <p class="mt-1.5 text-sm text-slate-400">
              {{ isRegister ? 'Rejoignez ReelSpace en quelques secondes' : 'Connectez-vous pour gérer vos vidéos' }}
            </p>
          </div>

          <button
            type="button"
            class="rs-google-btn mb-5"
            :disabled="loadingGoogle"
            @click="signInWithGoogle"
          >
            <UIcon
              :name="loadingGoogle ? 'i-lucide-loader-circle' : 'i-lucide-chrome'"
              class="h-5 w-5"
              :class="{ 'animate-spin text-zinc-500': loadingGoogle }"
            />
            <span>{{ loadingGoogle ? 'Redirection…' : 'Continuer avec Google' }}</span>
          </button>

          <div class="rs-divider mb-5">ou par email</div>

          <UForm :state="form" class="space-y-4" @submit.prevent="signInWithEmail">
            <UFormField label="Email">
              <UInput
                v-model="form.email"
                type="email"
                placeholder="vous@exemple.com"
                icon="i-lucide-mail"
                size="lg"
                class="w-full"
                :ui="{ base: 'w-full' }"
                required
              />
            </UFormField>

            <UFormField label="Mot de passe">
              <UInput
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                class="w-full"
                :ui="{ base: 'w-full' }"
                required
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    size="xs"
                    :padded="false"
                    tabindex="-1"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>

            <UButton
              block
              type="submit"
              color="primary"
              size="lg"
              :loading="loadingEmail"
              :label="isRegister ? 'Créer mon compte' : 'Se connecter'"
              :icon="isRegister ? 'i-lucide-user-plus' : 'i-lucide-log-in'"
            />

            <div class="flex items-center justify-center pt-1 text-sm">
              <span class="text-slate-500">
                {{ isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?' }}
              </span>
              <button
                type="button"
                class="ml-1.5 font-medium text-indigo-300 transition hover:text-indigo-200"
                @click="isRegister = !isRegister"
              >
                {{ isRegister ? 'Se connecter' : 'S\'inscrire' }}
              </button>
            </div>
          </UForm>

          <p class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <UIcon name="i-lucide-shield-check" class="h-3 w-3" />
            Vos données sont chiffrées et stockées de manière sécurisée
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const isRegister = ref(false)
const showPassword = ref(false)
const loadingGoogle = ref(false)
const loadingEmail = ref(false)

const features = [
  { icon: 'i-lucide-link', title: 'Liens directs propres', desc: 'Un slug ReelSpace court, prêt à partager.' },
  { icon: 'i-lucide-shield-check', title: 'Privé par défaut', desc: 'Seul vous pouvez gérer vos uploads.' },
  { icon: 'i-lucide-zap', title: 'Upload rapide', desc: 'Glissez-déposez, le lien arrive en quelques secondes.' },
]

watchEffect(() => {
  if (user.value) navigateTo('/')
})

async function signInWithGoogle() {
  loadingGoogle.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/confirm` },
  })
  if (error) {
    toast.add({ title: 'Erreur Google', description: error.message, color: 'error' })
    loadingGoogle.value = false
  }
}

async function signInWithEmail() {
  loadingEmail.value = true
  const { error } = isRegister.value
    ? await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      })
    : await supabase.auth.signInWithPassword({ email: form.email, password: form.password })

  loadingEmail.value = false
  if (error) {
    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    return
  }
  if (isRegister.value) {
    toast.add({
      title: 'Compte créé',
      description: 'Vérifiez votre email si la confirmation est activée.',
      color: 'success',
    })
  }
  else {
    await navigateTo('/')
  }
}
</script>
