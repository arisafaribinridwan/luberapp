<script setup lang="ts">
const name = shallowRef('')
const email = shallowRef('')
const password = shallowRef('')
const { execute, status, error } = useSignUp('email')

async function submit() {
  await execute({ name: name.value, email: email.value, password: password.value })
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="submit"
  >
    <label class="flex flex-col gap-1">
      <span>Nama</span>
      <input
        v-model="name"
        type="text"
        autocomplete="name"
        required
        class="rounded-md border p-2"
      >
    </label>
    <label class="flex flex-col gap-1">
      <span>Email</span>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        required
        class="rounded-md border p-2"
      >
    </label>
    <label class="flex flex-col gap-1">
      <span>Password (minimal 8 karakter)</span>
      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
        class="rounded-md border p-2"
      >
    </label>
    <button
      class="rounded-md bg-primary p-2 text-white disabled:opacity-50"
      :disabled="status === 'pending'"
    >
      Daftar
    </button>
    <p
      v-if="error"
      role="alert"
      class="text-red-600"
    >
      {{ error.message }}
    </p>
  </form>
</template>
