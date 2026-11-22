<script setup lang="ts">
const updateAvailable = ref(false)
const updating = ref(false)

onMounted(async () => {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (!registration) return

  const showUpdate = () => {
    updateAvailable.value = Boolean(registration.waiting)
  }
  showUpdate()
  registration.addEventListener('updatefound', () => {
    registration.installing?.addEventListener('statechange', showUpdate)
  })
  await registration.update().catch(() => undefined)
})

async function applyUpdate() {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (!registration?.waiting) return

  updating.value = true
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
}
</script>

<template>
  <ClientOnly>
    <aside
      v-if="updateAvailable"
      class="fixed inset-x-3 bottom-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm shadow-lg sm:inset-x-auto sm:right-4 sm:w-96"
      role="status"
    >
      <span class="text-slate-700">Versi baru Luber tersedia.</span>
      <UButton
        size="sm"
        :loading="updating"
        @click="applyUpdate"
      >
        Muat ulang
      </UButton>
    </aside>
  </ClientOnly>
</template>
