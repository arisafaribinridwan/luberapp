<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
    <h1 class="text-3xl font-bold">
      Masuk ke Luber
    </h1>
    <AuthLoginForm />
    <NuxtLink
      to="/register"
      class="text-primary"
    >
      Belum punya akun? Daftar
    </NuxtLink>
  </main>
</template>
