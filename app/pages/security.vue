<script setup lang="ts">
useSeoMeta({ title: 'Keamanan Akun | Luber' })
</script>

<template>
  <AppShell
    title="Keamanan Akun"
    subtitle="Autentikasi dua langkah & kredensial"
    back-to="/"
    back-label="Kembali ke Beranda"
  >
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <AuthTwoFactorSetup />
      </div>
    </div>
  </AppShell>
</template>
