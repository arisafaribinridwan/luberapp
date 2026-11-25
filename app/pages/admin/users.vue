<script setup lang="ts">
import type { MemberDto, MemberListResponse } from '~~/shared/types/member'
import type { MemberStatus } from '~~/server/database/schema/constants'

const LIMIT = 25
const SEARCH_DEBOUNCE_MS = 300

// ── State yang memicu fetch ────────────────────────────────────────────────
const query = shallowRef('')
const debouncedQuery = shallowRef('')
const filter = shallowRef<'ALL' | MemberStatus>('ALL')
const page = shallowRef(1)

// ── State UI ───────────────────────────────────────────────────────────────
const saving = shallowRef(false)
const notice = shallowRef('')
const actionError = shallowRef('')
const statusTarget = shallowRef<MemberDto | null>(null)
const actionTarget = shallowRef<MemberDto | null>(null)
const actionDrawerOpen = shallowRef(false)

const filters = [
  { key: 'ALL' as const, label: 'Semua' },
  { key: 'ACTIVE' as const, label: 'Aktif' },
  { key: 'INACTIVE' as const, label: 'Nonaktif' }
]

// useFetch: SSR (data sudah ada saat HTML tiba), request lama otomatis dibatalkan
// saat parameter berubah (tidak ada race condition), dan hanya 1 sumber kebenaran.
const { data, status, error, refresh } = await useFetch<MemberListResponse>('/api/admin/members', {
  query: computed(() => ({
    q: debouncedQuery.value || undefined,
    status: filter.value === 'ALL' ? undefined : filter.value,
    page: page.value,
    limit: LIMIT
  })),
  default: () => ({ items: [], page: 1, limit: LIMIT, total: 0, totalPages: 1 }),
  dedupe: 'cancel'
})

const members = computed(() => data.value.items)
const total = computed(() => data.value.total)
const totalPages = computed(() => Math.max(1, data.value.totalPages))
const isRefreshing = computed(() => status.value === 'pending')
const showSkeleton = computed(() => isRefreshing.value && members.value.length === 0)
const hasPrev = computed(() => page.value > 1)
const hasNext = computed(() => page.value < totalPages.value)
const subtitle = computed(() => `${total.value} anggota terdaftar`)
const loadError = computed(() => {
  if (!error.value) return ''
  const code = error.value.status
  if (code === 401 || code === 403) return 'Sesi berakhir atau Anda tidak punya akses. Silakan masuk kembali.'
  return 'Data anggota tidak dapat dimuat. Coba lagi.'
})

// ── Pencarian (debounce manual, tanpa dependensi tambahan) ─────────────────
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQuery.value = value.trim()
    page.value = 1 // dua perubahan di tick yang sama → tetap 1 request
  }, SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function setFilter(next: 'ALL' | MemberStatus) {
  if (filter.value === next) return
  filter.value = next
  page.value = 1
}
const prevPage = () => {
  if (hasPrev.value) page.value--
}
const nextPage = () => {
  if (hasNext.value) page.value++
}

// ── Navigasi ───────────────────────────────────────────────────────────────
const openCreate = () => navigateTo('/admin/user-form')

function openActions(member: MemberDto) {
  actionTarget.value = member
  actionDrawerOpen.value = true
}
function goToForm(mode?: 'reset') {
  const target = actionTarget.value
  if (!target) return
  actionDrawerOpen.value = false
  const suffix = mode ? `&mode=${mode}` : ''
  navigateTo(`/admin/user-form?id=${encodeURIComponent(target.id)}${suffix}`)
}
function requestStatusChange() {
  if (!actionTarget.value) return
  actionDrawerOpen.value = false
  statusTarget.value = actionTarget.value
}

// ── Ubah status ────────────────────────────────────────────────────────────
let noticeTimer: ReturnType<typeof setTimeout> | undefined
function showNotice(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = ''
  }, 4000)
}
onBeforeUnmount(() => clearTimeout(noticeTimer))

async function toggleStatus() {
  const target = statusTarget.value
  if (!target || saving.value) return
  saving.value = true
  actionError.value = ''
  try {
    const next: MemberStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await $fetch(`/api/admin/members/${encodeURIComponent(target.id)}`, { method: 'PATCH', body: { status: next } })
    showNotice(next === 'INACTIVE' ? 'Anggota dinonaktifkan.' : 'Anggota diaktifkan kembali.')
    statusTarget.value = null
    await refresh()
    // Jika halaman terakhir jadi kosong (mis. filter Aktif), mundur ke halaman valid.
    if (members.value.length === 0 && page.value > totalPages.value) page.value = totalPages.value
  } catch {
    actionError.value = 'Status anggota tidak dapat diubah.'
  } finally {
    saving.value = false
  }
}

// ── Helper tampilan ────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
const avatarTone = (s: MemberStatus) => s === 'ACTIVE' ? 'bg-[#2A41CB] text-white' : 'bg-slate-100 text-slate-600'
const formatPhone = (phone: string | null) => phone?.replace(/(\d{4})(?=\d)/g, '$1 ') || 'Nomor telepon belum diisi'
const membershipLabel = (role: MemberDto['role']) => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'pengurus':
      return 'Pengurus'
    case 'member':
    default:
      return 'Member'
  }
}
const membershipColor = (role: MemberDto['role']) => {
  switch (role) {
    case 'admin':
      return 'primary' as const
    case 'pengurus':
      return 'success' as const
    case 'member':
    default:
      return 'neutral' as const
  }
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
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-5"
          />
        </NuxtLink>
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold leading-none tracking-tight">
            Pengguna
          </h1>
          <p class="mt-1 text-xs font-medium text-[#DFE5FC]">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <div class="relative mt-4">
        <UInput
          v-model="query"
          type="search"
          icon="i-lucide-search"
          size="xl"
          placeholder="Cari nama atau ID anggota"
          aria-label="Cari anggota"
          class="w-full"
          :ui="{ base: 'h-12 rounded-2xl border border-white/20 bg-white/10 pl-11 pr-4 text-sm font-medium text-white placeholder:text-[#C3CDF9] outline-none transition focus:border-white/60 focus:bg-white/20' }"
        />
      </div>
    </header>

    <nav
      class="flex shrink-0 gap-2 overflow-x-auto px-5 py-4"
      aria-label="Filter status anggota"
    >
      <UButton
        v-for="item in filters"
        :key="item.key"
        type="button"
        :variant="filter === item.key ? 'solid' : 'outline'"
        :color="filter === item.key ? 'primary' : 'neutral'"
        class="flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition"
        :class="filter === item.key ? 'border-[#2A41CB] bg-[#2A41CB] text-white' : 'border-[#DFE5FC] bg-white text-slate-700 hover:border-[#99A9F3]'"
        :aria-pressed="filter === item.key"
        @click="setFilter(item.key)"
      >
        {{ item.label }}
        <!-- Hanya filter aktif yang punya angka valid (total hasil query saat ini). -->
        <span
          v-if="filter === item.key"
          class="rounded-full bg-white/20 px-2 py-0.5 text-[11px]"
        >{{ total }}</span>
      </UButton>
    </nav>

    <section class="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-28">
      <div aria-live="polite">
        <UAlert
          v-if="notice"
          color="success"
          variant="soft"
          role="status"
          icon="i-lucide-badge-check"
          :description="notice"
        />
        <UAlert
          v-if="loadError || actionError"
          color="error"
          variant="soft"
          role="alert"
          icon="i-lucide-circle-alert"
          :description="loadError || actionError"
        />
      </div>

      <div
        v-if="showSkeleton"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-22 rounded-2xl bg-white/70"
        />
      </div>

      <div
        v-else-if="!members.length && !error"
        class="mt-2 flex flex-col items-center rounded-3xl border border-dashed border-[#C3CDF9] bg-white/60 px-6 py-10 text-center"
      >
        <div class="grid size-14 place-items-center rounded-full bg-[#DFE5FC] text-[#2A41CB]">
          <UIcon
            name="i-lucide-users-round"
            class="size-7"
          />
        </div>
        <p class="mt-4 text-sm font-bold text-slate-900">
          {{ debouncedQuery || filter !== 'ALL' ? 'Tidak ada anggota yang cocok' : 'Belum ada anggota' }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          {{ debouncedQuery || filter !== 'ALL' ? 'Ubah kata kunci atau filter status.' : 'Tambahkan anggota pertama untuk memulai.' }}
        </p>
        <UButton
          type="button"
          color="primary"
          variant="solid"
          class="mt-4 h-10 rounded-full bg-[#2A41CB] px-5 text-xs font-bold text-white"
          @click="openCreate"
        >
          Tambah pengguna
        </UButton>
      </div>

      <!-- Daftar tetap tampil saat pindah halaman/filter (hanya diredupkan) → tidak berkedip -->
      <div
        v-else
        class="space-y-3 transition-opacity"
        :class="isRefreshing ? 'opacity-60' : 'opacity-100'"
        :aria-busy="isRefreshing"
      >
        <article
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3 rounded-2xl border border-[#DFE5FC]/70 bg-white p-3 shadow-sm"
        >
          <span
            class="grid size-14 shrink-0 place-items-center rounded-2xl text-base font-extrabold"
            :class="avatarTone(member.status)"
          >
            {{ initials(member.name) }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate text-sm font-extrabold text-slate-900">
                {{ member.name }}
              </h2>
              <UBadge
                :color="membershipColor(member.role)"
                variant="soft"
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
              >
                {{ membershipLabel(member.role) }}
              </UBadge>
            </div>
            <p class="mt-0.5 truncate text-xs text-slate-500">
              {{ member.email ?? 'Email belum diisi' }}
            </p>
            <p class="text-xs font-medium text-slate-500">
              {{ formatPhone(member.phone) }}
            </p>
          </div>
          <UButton
            type="button"
            variant="ghost"
            color="primary"
            square
            :aria-label="`Aksi untuk ${member.name}`"
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EFF2FE] text-[#2A41CB] transition hover:bg-[#2A41CB] hover:text-white"
            @click="openActions(member)"
          >
            <UIcon
              name="i-lucide-ellipsis-vertical"
              class="size-5"
            />
          </UButton>
        </article>
      </div>

      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between gap-2 rounded-2xl border border-[#DFE5FC] bg-white px-4 py-2.5"
      >
        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          :disabled="!hasPrev || isRefreshing"
          class="h-9 rounded-xl px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
          @click="prevPage"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-4"
          /> Sebelumnya
        </UButton>
        <span class="text-xs font-semibold text-slate-500">{{ page }} / {{ totalPages }}</span>
        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          :disabled="!hasNext || isRefreshing"
          class="h-9 rounded-xl px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
          @click="nextPage"
        >
          Berikutnya <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </UButton>
      </div>
    </section>

    <UButton
      type="button"
      color="primary"
      variant="solid"
      class="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] right-5 z-10 flex h-14 items-center gap-2 rounded-full bg-[#2A41CB] pl-5 pr-6 text-sm font-bold text-white shadow-xl shadow-[#2A41CB]/40 transition hover:bg-[#2234A6] active:scale-95 sm:bottom-6"
      @click="openCreate"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-5"
      />Tambah pengguna
    </UButton>

    <UDrawer
      v-model:open="actionDrawerOpen"
      direction="bottom"
      :handle="false"
      :overlay="true"
      :ui="{ content: 'mx-auto w-full max-w-md rounded-t-[32px] bg-white' }"
    >
      <template #body>
        <div
          v-if="actionTarget"
          class="space-y-2 p-5 pb-7"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-500">
                Aksi pengguna
              </p>
              <h2 class="mt-1 text-lg font-extrabold text-slate-900">
                {{ actionTarget.name }}
              </h2>
            </div>
            <UButton
              type="button"
              variant="ghost"
              color="neutral"
              square
              aria-label="Tutup menu aksi"
              class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600"
              @click="actionDrawerOpen = false"
            >
              <UIcon name="i-lucide-x" />
            </UButton>
          </div>
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            block
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-[#EFF2FE]"
            @click="goToForm()"
          >
            <UIcon
              name="i-lucide-pencil"
              class="size-5 text-[#2A41CB]"
            /> Edit pengguna
          </UButton>
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            block
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-[#EFF2FE]"
            @click="goToForm('reset')"
          >
            <UIcon
              name="i-lucide-key-round"
              class="size-5 text-[#2A41CB]"
            /> Reset password
          </UButton>
          <UButton
            type="button"
            variant="ghost"
            :color="actionTarget.status === 'ACTIVE' ? 'error' : 'primary'"
            block
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition"
            :class="actionTarget.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-[#2A41CB] hover:bg-[#EFF2FE]'"
            @click="requestStatusChange"
          >
            <UIcon
              :name="actionTarget.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              class="size-5"
            />
            {{ actionTarget.status === 'ACTIVE' ? 'Nonaktifkan pengguna' : 'Aktifkan pengguna' }}
          </UButton>
        </div>
      </template>
    </UDrawer>

    <UModal
      :open="!!statusTarget"
      :dismissible="!saving"
      :ui="{ content: 'max-w-xs rounded-3xl' }"
      @update:open="(open) => { if (!open && !saving) statusTarget = null }"
    >
      <template #content>
        <div
          v-if="statusTarget"
          class="p-6 text-center"
        >
          <div class="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <UIcon
              :name="statusTarget.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              class="size-6"
            />
          </div>
          <h2 class="mt-4 text-base font-extrabold text-slate-900">
            {{ statusTarget.status === 'ACTIVE' ? 'Nonaktifkan anggota?' : 'Aktifkan anggota?' }}
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-slate-500">
            {{ statusTarget.name }} {{ statusTarget.status === 'ACTIVE' ? 'tidak dapat dipilih untuk transaksi baru.' : 'dapat dipilih kembali untuk transaksi.' }}
          </p>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <UButton
              type="button"
              variant="soft"
              color="neutral"
              block
              :disabled="saving"
              class="rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700"
              @click="statusTarget = null"
            >
              Batal
            </UButton>
            <UButton
              type="button"
              :loading="saving"
              :disabled="saving"
              variant="solid"
              color="error"
              block
              class="rounded-xl bg-rose-600 py-3 text-xs font-bold text-white disabled:opacity-50"
              @click="toggleStatus"
            >
              Ya, lanjutkan
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </main>
</template>
