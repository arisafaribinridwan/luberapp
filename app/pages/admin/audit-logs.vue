<script setup lang="ts">
import { onMounted, reactive } from 'vue'

const eventOptions = [
  { value: '', label: 'Semua kejadian' },
  { value: 'LOGIN_SUCCEEDED', label: 'Login berhasil' },
  { value: 'LOGIN_FAILED', label: 'Login gagal' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'ACTION_REJECTED', label: 'Aksi ditolak' },
  { value: 'TRANSACTION_CREATED', label: 'Transaksi dibuat' },
  { value: 'TRANSFER_CREATED', label: 'Transfer dibuat' },
  { value: 'MANUAL_ACCOUNT_CREATED', label: 'Rekening dibuat' },
  { value: 'MANUAL_ACCOUNT_UPDATED', label: 'Rekening diubah' },
  { value: 'USER_UPDATED', label: 'Pengguna diubah' },
  { value: 'CONFIG_UPDATED', label: 'Konfigurasi diubah' }
]

const filters = reactive({
  from: '',
  to: '',
  eventType: '',
  actorId: ''
})
const page = shallowRef(1)
const { result, pending, errorMessage, fetchLogs } = useAuditLogs()

function query() {
  return { ...filters, page: page.value, limit: 50 }
}

async function applyFilters() {
  page.value = 1
  await fetchLogs(query())
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > result.value.totalPages || pending.value) return
  page.value = nextPage
  await fetchLogs(query())
}

function resetFilters() {
  filters.from = ''
  filters.to = ''
  filters.eventType = ''
  filters.actorId = ''
  applyFilters()
}

onMounted(() => fetchLogs(query()))
useSeoMeta({ title: 'Log Aktivitas | Luber' })

definePageMeta({
  layout: {
    name: 'default',
    props: {
      title: 'Log Aktivitas',
      subtitle: 'Catatan audit append-only sistem',
      backTo: '/',
      backLabel: 'Kembali ke Launchpad'
    }
  }
})
</script>

<template>
  <div>
    <div class="space-y-4 px-5 py-6">
      <form
        class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
        @submit.prevent="applyFilters"
      >
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-xs font-semibold text-[#0C2541]">
            Dari tanggal
            <input
              v-model="filters.from"
              type="date"
              class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </label>
          <label class="text-xs font-semibold text-[#0C2541]">
            Sampai tanggal
            <input
              v-model="filters.to"
              type="date"
              class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </label>
          <label class="text-xs font-semibold text-[#0C2541]">
            Jenis kejadian
            <select
              v-model="filters.eventType"
              class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
              <option
                v-for="option in eventOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="text-xs font-semibold text-[#0C2541]">
            ID pelaku
            <input
              v-model="filters.actorId"
              type="text"
              placeholder="Opsional"
              class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 placeholder:text-slate-400 focus-visible:border-[#2A41CB] focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </label>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            class="rounded-xl bg-[#2A41CB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2439B5] disabled:opacity-50"
            :disabled="pending"
          >
            Terapkan filter
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            @click="resetFilters"
          >
            Reset
          </button>
          <span class="self-center text-xs text-slate-500">{{ result.total }} log</span>
        </div>
      </form>

      <div
        v-if="errorMessage"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
      >
        {{ errorMessage }}
      </div>

      <AdminAuditLogTable
        :items="result.items"
        :pending="pending"
      />

      <div
        v-if="result.totalPages > 1"
        class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-xs"
      >
        <span class="text-slate-500">Halaman {{ result.page }} dari {{ result.totalPages }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
            :disabled="result.page <= 1 || pending"
            @click="goToPage(result.page - 1)"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
            :disabled="result.page >= result.totalPages || pending"
            @click="goToPage(result.page + 1)"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
