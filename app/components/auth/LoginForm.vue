<script setup lang="ts">
const email = shallowRef('')
const password = shallowRef('')
const showPassword = shallowRef(false)
const pending = shallowRef(false)
const errorMessage = shallowRef('')
const client = useAuthClient()

async function submit() {
  if (!client || pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await client.signIn.email({ email: email.value, password: password.value })
    if (result.error) {
      errorMessage.value = result.error.message ?? 'Login gagal. Periksa email dan password.'
      return
    }
    await navigateTo('/')
  } catch {
    errorMessage.value = 'Login gagal. Periksa email dan password.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col"
    @submit.prevent="submit"
  >
    <label
      for="login-email"
      class="sr-only"
    >Email</label>
    <input
      id="login-email"
      v-model="email"
      type="email"
      autocomplete="email"
      placeholder="Email"
      required
      class="h-14 w-full rounded-lg border border-[#CDD5E1] bg-transparent px-4 text-base text-[#0C2541] placeholder:text-[#0C2541] focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A41CB]"
    >

    <div class="relative mt-4">
      <label
        for="login-password"
        class="sr-only"
      >Password</label>
      <input
        id="login-password"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        placeholder="Password"
        required
        class="h-14 w-full rounded-lg border border-[#CDD5E1] bg-transparent pr-14 pl-4 text-base text-[#0C2541] placeholder:text-[#0C2541] focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A41CB]"
      >
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-lg text-[#0C2541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A41CB]"
        :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <UIcon
          :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          class="size-5"
        />
      </button>
    </div>
    <button
      type="submit"
      class="mt-12 flex min-h-12 items-center justify-center rounded-lg bg-[#2A41CB] px-4 text-sm font-semibold text-white hover:bg-[#2439B5] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#12192F] disabled:opacity-50"
      :disabled="pending"
    >
      {{ pending ? 'Memproses...' : 'Login' }}
    </button>
    <p
      v-if="errorMessage"
      role="alert"
      class="mt-3 text-sm text-error"
    >
      {{ errorMessage }}
    </p>
    <p class="mt-3 text-sm text-[#737B86] text-center">
      Lupa password? Hubungi admin
    </p>
  </form>
</template>
