<script setup lang="ts">
const { ready, loggedIn } = useUserSession()

useSeoMeta({
  title: 'Luber - Lunas Bersama'
})
</script>

<template>
  <AppLaunchpad v-if="ready && loggedIn" />
  <WelcomeScreen v-else-if="ready" />
  <main
    v-else
    class="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F8F9FB] p-6 text-center"
    aria-busy="true"
    aria-label="Memuat aplikasi Luber"
  >
    <div class="relative flex items-center justify-center">
      <img
        src="/logo.svg"
        alt="Luber Logo"
        class="h-12 w-auto animate-pulse"
      >
    </div>
    <div class="flex items-center gap-2 text-sm font-semibold text-[#2A41CB]">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 animate-spin"
      />
      <span>Memeriksa sesi...</span>
    </div>
  </main>
</template>
