<script setup lang="ts">
const route = useRoute()
const isExpired = computed(() => route.query.expired === '1' || route.query.expired === 'true')
</script>

<template>
  <main class="relative flex min-h-full w-full flex-col items-center justify-between overflow-hidden px-6 pt-10 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pt-12 sm:pb-16">
    <!-- Background Photo from Unsplash with Gradient Overlay -->
    <div class="pointer-events-none absolute inset-0 z-0">
      <img
        src="/a-c-JNwba6cv4e0-unsplash.jpg"
        alt="Simbol ta'awun dan saling tolong menolong"
        class="size-full object-cover object-center opacity-45"
      >
      <!-- Multi-stop Gradient Overlay for depth and readability -->
      <div class="absolute inset-0 bg-linear-to-b from-[#2A41CB]/25 via-[#F8F9FB]/80 to-[#F8F9FB]" />
      <div class="absolute inset-0 bg-radial-[at_top] from-[#2A41CB]/15 via-transparent to-transparent" />
    </div>

    <!-- Top Alert Notification (if session expired) -->
    <div class="relative z-10 w-full">
      <div
        v-if="isExpired"
        role="alert"
        class="mb-4 flex items-center gap-3 rounded-xl border border-amber-200/90 bg-amber-50/95 p-4 text-xs font-medium text-amber-800 shadow-sm backdrop-blur-sm"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="size-5 shrink-0 text-amber-600"
        />
        <span>Sesi Anda telah berakhir setelah 1 jam tanpa aktivitas. Silakan masuk kembali.</span>
      </div>
    </div>

    <!-- Center Brand Logo & Slogan with Soft Glass Card -->
    <div class="relative z-10 my-auto flex w-full flex-col items-center justify-center py-6">
      <div class="flex flex-col items-center p-6 transition-transform duration-300 hover:scale-[1.01]">
        <img
          class="h-auto w-64 max-w-full drop-shadow-xs"
          src="/brand.svg"
          width="250"
          height="169"
          alt="Luber, Lunas Bersama. Hidup Bebas Hutang Dan Riba"
        >
      </div>
    </div>

    <!-- Bottom Action & Attribution -->
    <div class="relative z-10 flex w-full max-w-sm flex-col items-center gap-3.5">
      <NuxtLink
        to="/login"
        class="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#2A41CB] px-6 text-sm font-semibold text-white shadow-md shadow-[#2A41CB]/25 transition-all duration-200 hover:bg-[#2439B5] hover:shadow-lg hover:shadow-[#2A41CB]/35 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2A41CB]"
      >
        <span>Get Started</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="size-5"
        />
      </NuxtLink>

      <p class="text-center text-xs font-medium text-slate-500">
        Komunitas Ta'awun • Edukasi Bebas Riba
      </p>

      <!-- Photo Attribution -->
      <p class="text-center text-[10px] text-slate-400">
        Photo by
        <a
          href="https://unsplash.com/@3tnik?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium underline hover:text-slate-600"
        >A. C.</a>
        on
        <a
          href="https://unsplash.com/photos/handshake-on-light-yellow-background-JNwba6cv4e0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium underline hover:text-slate-600"
        >Unsplash</a>
      </p>
    </div>
  </main>
</template>
