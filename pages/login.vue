<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="rs-auth-layout">
      <div class="glass-panel w-full max-w-md rounded-2xl p-8">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-400">
            <UIcon name="i-lucide-clapperboard" class="h-7 w-7 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">Bienvenue sur ReelSpace</h1>
          <p class="mt-2 text-sm text-slate-400">Connectez-vous pour gérer vos vidéos</p>
        </div>

        <button
          type="button"
          class="rs-google-btn mb-6"
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

        <div class="rs-divider mb-6">ou par email</div>

        <UForm :state="form" class="space-y-4" @submit.prevent="signInWithEmail">
          <UFormField label="Email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="vous@exemple.com"
              icon="i-lucide-mail"
              required
            />
          </UFormField>

          <UFormField label="Mot de passe">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              required
            />
          </UFormField>

          <UButton
            block
            type="submit"
            color="primary"
            :loading="loadingEmail"
            :label="isRegister ? 'Créer mon compte' : 'Se connecter'"
          />

          <button
            type="button"
            class="w-full text-center text-sm text-slate-400 transition hover:text-white"
            @click="isRegister = !isRegister"
          >
            {{ isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire' }}
          </button>
        </UForm>
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
const loadingGoogle = ref(false)
const loadingEmail = ref(false)

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
