<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import type { MemberDto, MemberListResponse } from '~~/shared/types/member'
import type { MemberStatus } from '~~/server/database/schema/constants'

const query = shallowRef('')
const filter = shallowRef<'ALL' | MemberStatus>('ALL')
const members = shallowRef<MemberDto[]>([])
const total = shallowRef(0)
const pending = shallowRef(false)
const saving = shallowRef(false)
const notice = shallowRef('')
const errorMessage = shallowRef('')
const deactivateTarget = shallowRef<MemberDto | null>(null)
const actionTarget = shallowRef<MemberDto | null>(null)
const actionDrawerOpen = shallowRef(false)

const filters = [
  { key: 'ALL' as const, label: 'Semua' },
  { key: 'ACTIVE' as const, label: 'Aktif' },
  { key: 'INACTIVE' as const, label: 'Nonaktif' }
]
const visibleMembers = computed(() => members.value)
const subtitle = computed(() => `${total.value} anggota terdaftar`)

async function loadMembers() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch<MemberListResponse>('/api/admin/members', {
      query: { q: query.value.trim() || undefined, status: filter.value === 'ALL' ? undefined : filter.value, limit: 100 }
    })
    members.value = result.items
    total.value = result.total
  } catch {
    errorMessage.value = 'Data anggota tidak dapat dimuat.'
  } finally {
    pending.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch([query, filter], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadMembers, 250)
})
onMounted(loadMembers)

function openCreate() {
  navigateTo('/admin/user-form')
}

function openActions(member: MemberDto) {
  actionTarget.value = member
  actionDrawerOpen.value = true
}

function openEdit() {
  if (!actionTarget.value) return
  actionDrawerOpen.value = false
  navigateTo(`/admin/user-form?id=${encodeURIComponent(actionTarget.value.id)}`)
}

function requestDelete() {
  if (!actionTarget.value) return
  actionDrawerOpen.value = false
  deactivateTarget.value = actionTarget.value
}

async function toggleStatus() {
  if (!deactivateTarget.value) return
  saving.value = true
  try {
    const target = deactivateTarget.value
    await $fetch(`/api/admin/members/${encodeURIComponent(target.id)}`, { method: 'PATCH', body: { status: target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } })
    notice.value = target.status === 'ACTIVE' ? 'Anggota dinonaktifkan.' : 'Anggota diaktifkan kembali.'
    deactivateTarget.value = null
    await loadMembers()
  } catch {
    errorMessage.value = 'Status anggota tidak dapat diubah.'
  } finally {
    saving.value = false
  }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
}
function roleTone(status: MemberStatus) {
  return status === 'ACTIVE' ? 'bg-[#2A41CB] text-white' : 'bg-slate-100 text-slate-600'
}
function formatPhone(phone: string | null) {
  return phone?.replace(/(\d{4})(?=\d)/g, '$1 ') || 'Nomor telepon belum diisi'
}

useSeoMeta({ title: 'Kelola Pengguna | Luber' })
</script>

<template>
  <main class="relative flex min-h-full w-full flex-col overflow-hidden bg-[#EFF2FE] text-slate-800 sm:rounded-[40px] sm:border sm:border-white/10 sm:shadow-2xl">
    <header class="shrink-0 rounded-b-[28px] bg-linear-to-b from-[#2234A6] to-[#2A41CB] px-5 pb-5 pt-5 text-white shadow-lg shadow-[#1C2868]/20">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          aria-label="Kembali ke menu utama"
          class="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20 active:scale-95"
        ><UIcon
          name="i-lucide-arrow-left"
          class="size-5"
        /></NuxtLink>
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold leading-none tracking-tight">
            Pengguna
          </h1><p class="mt-1 text-xs font-medium text-[#DFE5FC]">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <div class="relative mt-4">
        <UIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#C3CDF9]"
        /><input
          v-model="query"
          type="search"
          placeholder="Cari nama atau ID anggota"
          class="h-12 w-full rounded-2xl border border-white/20 bg-white/10 pl-11 pr-4 text-sm font-medium text-white placeholder-[#C3CDF9] outline-none transition focus:border-white/60 focus:bg-white/20"
        >
      </div>
    </header>

    <nav
      class="flex shrink-0 gap-2 overflow-x-auto px-5 py-4"
      aria-label="Filter tipe anggota"
    >
      <button
        v-for="item in filters"
        :key="item.key"
        type="button"
        class="flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition"
        :class="filter === item.key ? 'border-[#2A41CB] bg-[#2A41CB] text-white' : 'border-[#DFE5FC] bg-white text-slate-700 hover:border-[#99A9F3]'"
        :aria-pressed="filter === item.key"
        @click="filter = item.key"
      >
        {{ item.label }} <span
          class="rounded-full px-2 py-0.5 text-[11px]"
          :class="filter === item.key ? 'bg-white/20' : 'bg-[#EFF2FE] text-[#2234A6]'"
        >{{ item.key === 'ALL' ? total : members.filter(member => member.status === item.key).length }}</span>
      </button>
    </nav>

    <section
      class="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-28"
      aria-live="polite"
    >
      <div
        v-if="notice"
        role="status"
        class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
      >
        <UIcon
          name="i-lucide-badge-check"
          class="size-4 text-emerald-600"
        />{{ notice }}
      </div>
      <div
        v-if="errorMessage"
        role="alert"
        class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="size-4 text-red-600"
        />{{ errorMessage }}
      </div>
      <div
        v-if="pending"
        class="space-y-3"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="h-22 animate-pulse rounded-2xl bg-white/70"
        />
      </div>
      <div
        v-else-if="!visibleMembers.length"
        class="mt-2 flex flex-col items-center rounded-3xl border border-dashed border-[#C3CDF9] bg-white/60 px-6 py-10 text-center"
      >
        <div class="grid size-14 place-items-center rounded-full bg-[#DFE5FC] text-[#2A41CB]">
          <UIcon
            name="i-lucide-users-round"
            class="size-7"
          />
        </div><p class="mt-4 text-sm font-bold text-slate-900">
          {{ total ? 'Tidak ada anggota yang cocok' : 'Belum ada anggota' }}
        </p><p class="mt-1 text-xs text-slate-500">
          {{ total ? 'Ubah kata kunci atau filter status.' : 'Tambahkan anggota pertama untuk memulai.' }}
        </p><button
          type="button"
          class="mt-4 h-10 rounded-full bg-[#2A41CB] px-5 text-xs font-bold text-white"
          @click="openCreate"
        >
          Tambah pengguna
        </button>
      </div>
      <template v-else>
        <article
          v-for="member in visibleMembers"
          :key="member.id"
          class="flex items-center gap-3 rounded-2xl border border-[#DFE5FC]/70 bg-white p-3 shadow-sm"
        >
          <span
            class="grid size-14 shrink-0 place-items-center rounded-2xl text-base font-extrabold"
            :class="roleTone(member.status)"
          >{{ initials(member.name) }}</span><div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate text-sm font-extrabold text-slate-900">
                {{ member.name }}
              </h2><span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="roleTone(member.status)"
              >{{ member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}</span>
            </div><p class="mt-0.5 truncate text-xs text-slate-500">
              {{ member.email ?? 'Email belum diisi' }}
            </p><p class="text-xs font-medium text-slate-500">
              {{ formatPhone(member.phone) }}
            </p>
          </div><div class="flex shrink-0">
            <button
              type="button"
              :aria-label="`Aksi untuk ${member.name}`"
              class="grid size-10 place-items-center rounded-xl bg-[#EFF2FE] text-[#2A41CB] transition hover:bg-[#2A41CB] hover:text-white"
              @click="openActions(member)"
            >
              <UIcon
                name="i-lucide-ellipsis-vertical"
                class="size-5"
              />
            </button>
          </div>
        </article>
      </template>
    </section>

    <button
      type="button"
      class="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] right-5 z-10 flex h-14 items-center gap-2 rounded-full bg-[#2A41CB] pl-5 pr-6 text-sm font-bold text-white shadow-xl shadow-[#2A41CB]/40 transition hover:bg-[#2234A6] active:scale-95 sm:bottom-6"
      @click="openCreate"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-5"
      />Tambah pengguna
    </button>

    <UDrawer
      v-model:open="actionDrawerOpen"
      direction="bottom"
      :handle="false"
      :overlay="true"
      :ui="{ content: 'mx-auto w-full max-w-lg rounded-t-[32px] bg-white' }"
    >
      <template #body>
        <div
          v-if="actionTarget"
          class="space-y-2 p-5 pb-7"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aksi pengguna
              </p>
              <h2 class="mt-1 text-lg font-extrabold text-slate-900">
                {{ actionTarget.name }}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Tutup menu aksi"
              class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600"
              @click="actionDrawerOpen = false"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </div>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-[#EFF2FE]"
            @click="openEdit"
          >
            <UIcon
              name="i-lucide-pencil"
              class="size-5 text-[#2A41CB]"
            />
            Edit pengguna
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-[#EFF2FE]"
            @click="navigateTo(`/admin/user-form?id=${encodeURIComponent(actionTarget.id)}&mode=reset`); actionDrawerOpen = false"
          >
            <UIcon
              name="i-lucide-key-round"
              class="size-5 text-[#2A41CB]"
            />
            Reset password
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
            @click="requestDelete"
          >
            <UIcon
              name="i-lucide-trash-2"
              class="size-5"
            />
            Hapus pengguna
          </button>
        </div>
      </template>
    </UDrawer>

    <UModal
      :open="!!deactivateTarget"
      :dismissible="false"
      :ui="{ content: 'max-w-xs rounded-3xl' }"
      @update:open="(open) => !open && (deactivateTarget = null)"
    >
      <template #content>
        <div
          v-if="deactivateTarget"
          class="p-6 text-center"
        >
          <div class="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <UIcon
              :name="deactivateTarget.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              class="size-6"
            />
          </div><h2 class="mt-4 text-base font-extrabold text-slate-900">
            {{ deactivateTarget.status === 'ACTIVE' ? 'Nonaktifkan anggota?' : 'Aktifkan anggota?' }}
          </h2><p class="mt-1 text-xs leading-relaxed text-slate-500">
            {{ deactivateTarget.name }} {{ deactivateTarget.status === 'ACTIVE' ? 'tidak dapat dipilih untuk transaksi baru.' : 'dapat dipilih kembali untuk transaksi.' }}
          </p><div class="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700"
              @click="deactivateTarget = null"
            >
              Batal
            </button><button
              type="button"
              :disabled="saving"
              class="rounded-xl bg-rose-600 py-3 text-xs font-bold text-white disabled:opacity-50"
              @click="toggleStatus"
            >
              Ya, lanjutkan
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </main>
</template>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.member-field { width: 100%; height: 3rem; border: 1px solid #e2e8f0; border-radius: .75rem; background: #fff; padding: 0 1rem; font-size: .875rem; font-weight: 500; color: #0f172a; outline: none; }
.member-field:focus { border-color: #2a41cb; box-shadow: 0 0 0 3px rgb(42 65 203 / .15); }
</style>
