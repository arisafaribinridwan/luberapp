<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
    <h1 class="text-3xl font-bold">
      Verifikasi dua langkah
    </h1>
    <AuthTwoFactorForm />
    <NuxtLink
      to="/login"
      class="text-primary"
    >
      Kembali ke login
    </NuxtLink>
  </main>
</template>
