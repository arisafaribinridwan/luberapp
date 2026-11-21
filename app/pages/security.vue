<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
    <h1 class="text-3xl font-bold">
      Keamanan akun
    </h1>
    <AuthTwoFactorSetup />
    <NuxtLink
      to="/"
      class="text-primary"
    >Kembali</NuxtLink>
  </main>
</template>
