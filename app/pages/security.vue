<script setup lang="ts">
useSeoMeta({ title: 'Keamanan Akun | Luber' })

definePageMeta({
  layout: {
    name: 'default',
    props: {
      title: 'Keamanan Akun',
      subtitle: 'Autentikasi dua langkah & kredensial',
      backTo: '/',
      backLabel: 'Kembali ke Beranda'
    }
  }
})
</script>

<template>
  <div>
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <AuthTwoFactorSetup />
      </div>
    </div>
  </div>
</template>
