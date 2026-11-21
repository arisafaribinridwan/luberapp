<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'id' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})

useSeoMeta({ title: 'Luber' })
</script>

<template>
  <UApp>
    <div class="mx-auto my-0 min-h-full max-w-120 bg-default shadow-xl">
      <NuxtPage />
    </div>
  </UApp>
</template>
