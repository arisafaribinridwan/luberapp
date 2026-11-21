<script setup lang="ts">
import type { AppRole } from '~~/shared/auth/permissions'

const client = useAuthClient()
const name = shallowRef('')
const email = shallowRef('')
const password = shallowRef('')
const role = shallowRef<AppRole>('member')
const pending = shallowRef(false)
const notice = shallowRef('')
const errorMessage = shallowRef('')

async function submit() {
  if (!client || pending.value) return

  pending.value = true
  notice.value = ''
  errorMessage.value = ''

  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    const result = await client.admin.createUser({
      name: name.value.trim(),
      email: normalizedEmail,
      password: password.value,
      role: role.value
    })

    if (result.error) throw result.error
    notice.value = `Akun ${normalizedEmail} berhasil dibuat.`
    name.value = ''
    email.value = ''
    password.value = ''
    role.value = 'member'
  } catch {
    errorMessage.value = 'Akun tidak dapat dibuat. Periksa data dan pastikan email belum digunakan.'
  } finally {
    pending.value = false
  }
}

useSeoMeta({ title: 'Kelola pengguna | Luber' })
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-6 py-12">
    <NuxtLink
      to="/"
      class="text-sm text-primary"
    >
      Kembali ke beranda
    </NuxtLink>
    <h1 class="mt-6 text-2xl font-bold text-default">
      Buat akun pengguna
    </h1>
    <p class="mt-2 text-sm text-muted">
      Admin menetapkan password saat membuat akun. Sampaikan password tersebut melalui kanal yang aman.
    </p>

    <p
      v-if="notice"
      role="status"
      class="mt-6 text-sm text-default"
    >
      {{ notice }}
    </p>
    <p
      v-if="errorMessage"
      role="alert"
      class="mt-6 text-sm text-error"
    >
      {{ errorMessage }}
    </p>

    <form
      class="mt-8 flex flex-col gap-3"
      @submit.prevent="submit"
    >
      <label
        for="new-user-name"
        class="text-sm font-medium"
      >Nama</label>
      <input
        id="new-user-name"
        v-model="name"
        type="text"
        autocomplete="name"
        required
        class="h-12 rounded-lg border border-default bg-default px-4 text-default"
      >
      <label
        for="new-user-password"
        class="mt-2 text-sm font-medium"
      >Password</label>
      <input
        id="new-user-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
        class="h-12 rounded-lg border border-default bg-default px-4 text-default"
      >
      <label
        for="new-user-email"
        class="mt-2 text-sm font-medium"
      >Email</label>
      <input
        id="new-user-email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        class="h-12 rounded-lg border border-default bg-default px-4 text-default"
      >
      <label
        for="new-user-role"
        class="mt-2 text-sm font-medium"
      >Role</label>
      <select
        id="new-user-role"
        v-model="role"
        class="h-12 rounded-lg border border-default bg-default px-4 text-default"
      >
        <option value="member">
          Member
        </option>
        <option value="pengurus">
          Pengurus
        </option>
        <option value="admin">
          Admin
        </option>
      </select>
      <button
        type="submit"
        class="mt-5 min-h-12 rounded-lg bg-primary px-4 font-semibold text-white disabled:opacity-50"
        :disabled="pending"
      >
        {{ pending ? 'Membuat akun...' : 'Buat akun' }}
      </button>
    </form>
  </main>
</template>
