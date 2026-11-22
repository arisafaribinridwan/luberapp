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
    <div class="mx-auto my-0 min-h-dvh w-full max-w-md sm:max-w-lg bg-[#F7F8FA] shadow-xl sm:border-x sm:border-slate-200/80 flex flex-col">
      <NuxtPage />
    </div>
    <PwaUpdateNotice />
  </UApp>
</template>
