<script setup lang="ts">
useSeoMeta({ title: 'Masuk | Luber' })
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-92 flex-col pt-20 pb-28">
    <header>
      <h1 class="text-xl leading-7 font-bold text-[#0C2541]">
        Assalamu’alaikum
      </h1>
      <p class="mt-4 text-base leading-6 text-[#737B86]">
        Senang berjumpa lagi. Kamu dapat melanjutkan login untuk memeriksa keuanganmu.
      </p>
    </header>

    <AuthLoginForm class="mt-12" />

    <div
      class="mt-auto self-center pt-20"
      aria-label="Luber, Lunas Bersama"
    >
      <img
        src="/logo.svg"
        width="500"
        height="338"
        alt="Luber, Lunas Bersama"
        class="block h-auto w-45"
      >
    </div>
  </main>
</template>
