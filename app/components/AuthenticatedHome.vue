<script setup lang="ts">
const { user } = useUserSession()
const { role } = useRole()
const { execute: signOut, status } = useSignOut()
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-6">
    <h1 class="text-3xl font-bold">
      Luber
    </h1>
    <p>Selamat datang, {{ user?.name }}.</p>
    <p>Role: {{ role }}</p>
    <p>Fondasi autentikasi siap. Menu aplikasi akan ditambahkan pada Task 3.</p>
    <NuxtLink
      to="/security"
      class="text-primary"
    >
      Keamanan akun dan 2FA
    </NuxtLink>
    <button
      type="button"
      class="w-fit rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
      :disabled="status === 'pending'"
      @click="signOut()"
    >
      Keluar
    </button>
  </main>
</template>
