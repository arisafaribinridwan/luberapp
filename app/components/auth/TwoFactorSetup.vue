<script setup lang="ts">
const client = useAuthClient()
const { user, fetchSession } = useUserSession()
const password = shallowRef('')
const code = shallowRef('')
const secret = shallowRef('')
const backupCodes = shallowRef<string[]>([])
const pending = shallowRef(false)
const error = shallowRef('')
const info = shallowRef('')

async function start() {
  if (!client || pending.value) return
  pending.value = true
  error.value = ''
  try {
    const result = await client.twoFactor.enable({ password: password.value })
    if (result.error || result.data?.method !== 'totp') {
      error.value = result.error?.message || 'Gagal memulai 2FA.'
      return
    }
    secret.value = new URL(result.data.totpURI).searchParams.get('secret') || ''
    backupCodes.value = result.data.backupCodes || []
  } catch {
    error.value = 'Gagal memulai 2FA. Coba lagi.'
  } finally {
    pending.value = false
  }
}

async function confirm() {
  if (!client || pending.value) return
  pending.value = true
  error.value = ''
  try {
    const result = await client.twoFactor.verifyTotp({ code: code.value })
    if (result.error) {
      error.value = result.error.message || 'Kode tidak valid.'
      return
    }
    await fetchSession({ force: true })
    secret.value = ''
    code.value = ''
    password.value = ''
    info.value = '2FA aktif. Simpan kode cadangan di tempat aman.'
  } catch {
    error.value = 'Konfirmasi 2FA gagal. Coba lagi.'
  } finally {
    pending.value = false
  }
}

async function disable() {
  if (!client || pending.value) return
  pending.value = true
  error.value = ''
  try {
    const result = await client.twoFactor.disable({ password: password.value })
    if (result.error) {
      error.value = result.error.message || 'Gagal menonaktifkan 2FA.'
      return
    }
    await fetchSession({ force: true })
    password.value = ''
    backupCodes.value = []
    info.value = '2FA dinonaktifkan.'
  } catch {
    error.value = 'Gagal menonaktifkan 2FA. Coba lagi.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p>Status: {{ user?.twoFactorEnabled ? 'Aktif' : 'Tidak aktif' }}</p>
    <form
      v-if="!user?.twoFactorEnabled && !secret"
      class="flex flex-col gap-3"
      @submit.prevent="start"
    >
      <label for="setup-password">Password akun</label>
      <input
        id="setup-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="rounded-md border p-2"
      >
      <button
        class="rounded-md bg-primary p-2 text-white disabled:opacity-50"
        :disabled="pending"
      >
        Aktifkan 2FA
      </button>
    </form>
    <div
      v-if="secret"
      class="flex flex-col gap-3"
    >
      <p>Masukkan kunci berikut secara manual ke aplikasi authenticator:</p>
      <code class="break-all rounded-md border p-2">{{ secret }}</code>
      <form
        class="flex flex-col gap-3"
        @submit.prevent="confirm"
      >
        <label for="setup-code">Kode enam digit dari authenticator</label>
        <input
          id="setup-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          required
          class="rounded-md border p-2"
        >
        <button
          class="rounded-md bg-primary p-2 text-white disabled:opacity-50"
          :disabled="pending"
        >
          Konfirmasi 2FA
        </button>
      </form>
    </div>
    <div
      v-if="backupCodes.length"
      class="flex flex-col gap-3"
    >
      <p>Simpan kode cadangan di tempat aman. Kode ini hanya ditampilkan saat setup.</p>
      <ul class="grid grid-cols-2 gap-2">
        <li
          v-for="backupCode in backupCodes"
          :key="backupCode"
        >
          <code>{{ backupCode }}</code>
        </li>
      </ul>
    </div>
    <form
      v-if="user?.twoFactorEnabled"
      class="flex flex-col gap-3"
      @submit.prevent="disable"
    >
      <label for="disable-password">Password akun</label>
      <input
        id="disable-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="rounded-md border p-2"
      >
      <button
        class="rounded-md border p-2 disabled:opacity-50"
        :disabled="pending"
      >
        Nonaktifkan 2FA
      </button>
    </form>
    <p v-if="info">
      {{ info }}
    </p>
    <p
      v-if="error"
      role="alert"
      class="text-red-600"
    >
      {{ error }}
    </p>
  </div>
</template>
