<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'id' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
    { name: 'theme-color', content: '#2A41CB' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' }
  ]
})

useSeoMeta({
  title: 'Luber - Lunas Bersama',
  description: 'Aplikasi pencatatan keuangan simpan pinjam komunitas berprinsip ta\'awun dan murni bebas riba.'
})
</script>

<template>
  <UApp>
    <!-- 1. Canvas Layar Luar (Background desktop, flex center) -->
    <div class="min-h-screen w-full bg-slate-100 flex justify-center items-center">
      <!-- 2. Mobile Container Utama (Terkunci max-w-md & h-screen / h-[92vh]) -->
      <div class="w-full max-w-md h-screen sm:h-[92vh] bg-[#F7F8FA] sm:rounded-4xl shadow-xl flex flex-col overflow-hidden relative">
        <!-- 3. Area konten utama yang bisa di-scroll -->
        <main class="flex-1 overflow-y-auto scrollbar-none">
          <NuxtPage />
        </main>
      </div>
    </div>

    <PwaUpdateNotice />
  </UApp>
</template>
