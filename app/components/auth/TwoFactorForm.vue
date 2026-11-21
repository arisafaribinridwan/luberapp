<script setup lang="ts">
const client = useAuthClient()
const code = shallowRef('')
const useBackup = shallowRef(false)
const trustDevice = shallowRef(false)
const pending = shallowRef(false)
const error = shallowRef('')

async function submit() {
  if (!client || pending.value) return

  pending.value = true
  error.value = ''
  try {
    const result = await runWithSessionRefresh(() => useBackup.value
      ? client.twoFactor.verifyBackupCode({ code: code.value, trustDevice: trustDevice.value })
      : client.twoFactor.verifyTotp({ code: code.value, trustDevice: trustDevice.value }))

    if (result?.error) {
      error.value = result.error.message || 'Kode tidak valid.'
      return
    }

    await navigateTo('/')
  } catch {
    error.value = 'Verifikasi gagal. Coba lagi.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="submit"
  >
    <label class="flex flex-col gap-1">
      <span>{{ useBackup ? 'Kode cadangan' : 'Kode authenticator' }}</span>
      <input
        v-model="code"
        type="text"
        autocomplete="one-time-code"
        required
        class="rounded-md border p-2"
      >
    </label>
    <label class="flex items-center gap-2">
      <input
        v-model="trustDevice"
        type="checkbox"
      >
      <span>Percayai perangkat ini</span>
    </label>
    <button
      class="rounded-md bg-primary p-2 text-white disabled:opacity-50"
      :disabled="pending"
    >
      Verifikasi
    </button>
    <button
      type="button"
      class="text-primary"
      @click="useBackup = !useBackup"
    >
      {{ useBackup ? 'Gunakan kode authenticator' : 'Gunakan kode cadangan' }}
    </button>
    <p
      v-if="error"
      role="alert"
      class="text-red-600"
    >
      {{ error }}
    </p>
  </form>
</template>
