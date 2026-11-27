<script setup lang="ts">
useSeoMeta({ title: 'Masuk | Luber' })

definePageMeta({ layout: false })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-sm flex-col pt-10 pb-16 justify-between">
    <!-- Top Back to Welcome Screen -->
    <div>
      <header class="mt-8">
        <h1 class="text-2xl leading-7 font-bold text-[#0C2541]">
          Assalamu’alaikum
        </h1>
        <p class="mt-3 leading-6 text-[#737B86]">
          Senang berjumpa lagi. Kamu dapat melanjutkan login untuk memeriksa keuanganmu.
        </p>
      </header>

      <AuthLoginForm class="mt-8" />
    </div>

    <!-- Bottom Brand Logo -->
    <div
      class="mt-12 flex flex-col items-center pt-6 mb-20"
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
