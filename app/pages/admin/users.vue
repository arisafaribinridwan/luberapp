<script setup lang="ts">
/* eslint-disable better-tailwindcss/no-unknown-classes */
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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
const formOpen = shallowRef(false)
const editing = shallowRef<MemberDto | null>(null)
const deactivateTarget = shallowRef<MemberDto | null>(null)
const form = reactive({ id: '', name: '', email: '', phone: '', role: 'member' as 'admin' | 'pengurus' | 'member', password: '' })
const photoPreview = shallowRef('')
const photoInput = shallowRef<HTMLInputElement | null>(null)

const userSchema = z.object({
  name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
  email: z.string().trim().email('Format email belum benar.'),
  phone: z.string().trim().regex(/^08\d{8,11}$/, 'Nomor HP harus diawali 08 dan berisi 10–13 digit.'),
  role: z.enum(['admin', 'pengurus', 'member'], { message: 'Pilih tipe anggota.' }),
  password: z.string().min(8, 'Password minimal 8 karakter.')
})
type UserForm = z.infer<typeof userSchema>
const roleOptions = [
  { value: 'admin' as const, label: 'Admin', description: 'Akses penuh', icon: 'i-lucide-shield-check' },
  { value: 'pengurus' as const, label: 'Pengurus', description: 'Input & transaksi', icon: 'i-lucide-briefcase-business' },
  { value: 'member' as const, label: 'Member', description: 'Hanya melihat', icon: 'i-lucide-user' }
]

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
  editing.value = null
  Object.assign(form, { id: '', name: '', email: '', phone: '', role: 'member', password: '' })
  photoPreview.value = ''
  notice.value = ''
  errorMessage.value = ''
  formOpen.value = true
}

function openEdit(member: MemberDto) {
  editing.value = member
  Object.assign(form, { id: member.id, name: member.name, email: '', phone: member.phone ?? '', role: 'member', password: '' })
  photoPreview.value = ''
  notice.value = ''
  errorMessage.value = ''
  formOpen.value = true
}

function selectPhoto() {
  photoInput.value?.click()
}

function handlePhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Foto profil harus berupa gambar.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}

async function saveMember(event: FormSubmitEvent<UserForm>) {
  if (saving.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/admin/members/${encodeURIComponent(editing.value.id)}`, { method: 'PATCH', body: { name: event.data.name, phone: event.data.phone } })
      notice.value = 'Data anggota berhasil diperbarui.'
    } else {
      await $fetch('/api/admin/members', { method: 'POST', body: { id: form.id || `USR-${Date.now().toString(36).toUpperCase()}`, name: event.data.name, phone: event.data.phone } })
      notice.value = 'Anggota baru berhasil ditambahkan.'
    }
    formOpen.value = false
    await loadMembers()
  } catch (error: unknown) {
    const message = error as { data?: { statusMessage?: string } }
    errorMessage.value = message.data?.statusMessage ?? 'Data anggota tidak dapat disimpan.'
  } finally {
    saving.value = false
  }
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
  <main class="users-shell relative flex w-full flex-col overflow-hidden bg-[#EFF2FE] text-slate-800 sm:min-h-211 sm:rounded-[40px] sm:border sm:border-white/10 sm:shadow-2xl">
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
              ID: {{ member.id }}
            </p><p class="text-xs font-medium text-slate-500">
              {{ formatPhone(member.phone) }}
            </p>
          </div><div class="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              :aria-label="`Ubah ${member.name}`"
              class="grid size-9 place-items-center rounded-xl bg-[#EFF2FE] text-[#2A41CB] transition hover:bg-[#2A41CB] hover:text-white"
              @click="openEdit(member)"
            >
              <UIcon
                name="i-lucide-pencil"
                class="size-4"
              />
            </button><button
              type="button"
              :aria-label="member.status === 'ACTIVE' ? `Nonaktifkan ${member.name}` : `Aktifkan ${member.name}`"
              class="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
              @click="deactivateTarget = member"
            >
              <UIcon
                :name="member.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                class="size-4"
              />
            </button>
          </div>
        </article>
      </template>
    </section>

    <button
      type="button"
      class="absolute bottom-5 right-5 z-10 flex h-14 items-center gap-2 rounded-full bg-[#2A41CB] pl-5 pr-6 text-sm font-bold text-white shadow-xl shadow-[#2A41CB]/40 transition hover:bg-[#2234A6] active:scale-95"
      @click="openCreate"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-5"
      />Tambah pengguna
    </button>

    <UDrawer
      v-model:open="formOpen"
      direction="bottom"
      :handle="false"
      :overlay="true"
      :ui="{ content: 'mx-auto max-h-[94dvh] w-full max-w-lg rounded-t-[32px] bg-white' }"
    >
      <template #body>
        <UForm
          :schema="userSchema"
          :state="form"
          class="px-5 pb-6 pt-2"
          @submit="saveMember"
        >
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-xl font-extrabold text-slate-900">
              {{ editing ? 'Ubah pengguna' : 'Tambah pengguna' }}
            </h2><button
              type="button"
              aria-label="Tutup formulir"
              class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600"
              @click="formOpen = false"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </div>

          <div class="mb-5 flex items-center gap-4">
            <div class="relative">
              <button
                type="button"
                class="grid size-22 place-items-center overflow-hidden rounded-3xl bg-[#DFE5FC] text-[#2A41CB]"
                aria-label="Pilih foto profil"
                @click="selectPhoto"
              >
                <img
                  v-if="photoPreview"
                  :src="photoPreview"
                  alt="Pratinjau foto profil"
                  class="size-full object-cover"
                >
                <UIcon
                  v-else
                  name="i-lucide-user-round"
                  class="size-11"
                />
              </button>
              <button
                type="button"
                class="absolute -bottom-1.5 -right-1.5 grid size-9 place-items-center rounded-full bg-[#2A41CB] text-white ring-4 ring-white"
                aria-label="Pilih foto profil"
                @click="selectPhoto"
              >
                <UIcon
                  name="i-lucide-camera"
                  class="size-4"
                />
              </button>
              <input
                ref="photoInput"
                type="file"
                accept="image/png,image/jpeg"
                class="hidden"
                @change="handlePhoto"
              >
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900">
                Foto profil
              </p><p class="mt-0.5 text-xs text-slate-500">
                JPG atau PNG. Otomatis dipangkas persegi.
              </p><button
                v-if="photoPreview"
                type="button"
                class="mt-1.5 text-xs font-bold text-rose-600"
                @click="photoPreview = ''"
              >
                Hapus foto
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <UFormField
              label="Nama lengkap"
              name="name"
            >
              <UInput
                v-model="form.name"
                class="w-full"
                size="xl"
                placeholder="Contoh: Ari Safari"
              />
            </UFormField>
            <UFormField
              label="Email"
              name="email"
            >
              <UInput
                v-model="form.email"
                class="w-full"
                size="xl"
                type="email"
                placeholder="nama@email.com"
              />
            </UFormField>
            <UFormField
              label="No. HP"
              name="phone"
            >
              <UInput
                v-model="form.phone"
                class="w-full"
                size="xl"
                type="tel"
                placeholder="0812 3456 7890"
              />
            </UFormField>
            <UFormField
              label="Tipe anggota"
              name="role"
            >
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in roleOptions"
                  :key="option.value"
                  type="button"
                  class="flex min-h-22 flex-col items-center justify-center rounded-2xl border px-1 text-center transition"
                  :class="form.role === option.value ? 'border-[#2A41CB] bg-[#EFF2FE] text-[#1F2E85] ring-1 ring-[#2A41CB]' : 'border-slate-200 text-slate-900 hover:border-[#99A9F3]'"
                  @click="form.role = option.value"
                >
                  <UIcon
                    :name="option.icon"
                    class="size-5 text-[#2A41CB]"
                  /><span class="mt-1 text-xs font-bold">{{ option.label }}</span><span class="text-[10px] text-slate-500">{{ option.description }}</span>
                </button>
              </div>
            </UFormField>
            <UFormField
              label="Password"
              name="password"
            >
              <UInput
                v-model="form.password"
                class="w-full"
                size="xl"
                type="password"
                placeholder="Minimal 8 karakter"
              />
            </UFormField>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="h-12 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700"
              @click="formOpen = false"
            >
              Batal
            </button><button
              type="submit"
              :disabled="saving"
              class="h-12 rounded-2xl bg-[#2A41CB] text-sm font-bold text-white shadow-lg shadow-[#2A41CB]/30 disabled:opacity-50"
            >
              {{ saving ? 'Menyimpan...' : editing ? 'Simpan perubahan' : 'Tambah pengguna' }}
            </button>
          </div>
        </UForm>
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
.users-shell { min-height: 100vh; min-height: 100dvh; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.member-field { width: 100%; height: 3rem; border: 1px solid #e2e8f0; border-radius: .75rem; background: #fff; padding: 0 1rem; font-size: .875rem; font-weight: 500; color: #0f172a; outline: none; }
.member-field:focus { border-color: #2a41cb; box-shadow: 0 0 0 3px rgb(42 65 203 / .15); }
</style>
