<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
    <h1 class="text-3xl font-bold">
      Daftar Luber
    </h1>
    <AuthRegisterForm />
    <NuxtLink
      to="/login"
      class="text-primary"
    >
      Sudah punya akun? Masuk
    </NuxtLink>
  </main>
</template>
