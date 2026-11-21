<script setup lang="ts">
const email = shallowRef('')
const password = shallowRef('')
const { execute, status, error } = useSignIn('email')

async function submit() {
  await execute({ email: email.value, password: password.value })
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="submit"
  >
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
      <span>Password</span>
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="rounded-md border p-2"
      >
    </label>
    <button
      class="rounded-md bg-primary p-2 text-white disabled:opacity-50"
      :disabled="status === 'pending'"
    >
      Masuk
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
