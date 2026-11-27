<script setup lang="ts">
useSeoMeta({ title: 'Verifikasi Dua Langkah | Luber' })

definePageMeta({ layout: false })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pt-10 pb-16 justify-between">
    <div>
      <NuxtLink
        to="/login"
        class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#2A41CB]"
        aria-label="Kembali ke halaman login"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4"
        />
        <span>Kembali ke Login</span>
      </NuxtLink>

      <header class="mt-8">
        <h1 class="text-xl leading-7 font-bold text-[#0C2541]">
          Verifikasi Dua Langkah
        </h1>
        <p class="mt-3 text-sm leading-6 text-[#737B86]">
          Masukkan kode 6 digit dari aplikasi autentikator atau kode cadangan Anda untuk melanjutkan.
        </p>
      </header>

      <div class="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <AuthTwoFactorForm />
      </div>
    </div>

    <!-- Bottom Brand Logo -->
    <div
      class="mt-12 flex flex-col items-center pt-6"
      aria-label="Luber, Lunas Bersama"
    >
      <img
        src="/logo.svg"
        width="500"
        height="338"
        alt="Luber, Lunas Bersama"
        class="block h-auto w-40 opacity-90"
      >
    </div>
  </main>
</template>
