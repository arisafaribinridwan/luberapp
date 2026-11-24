<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MemberDto, MemberListResponse } from '~~/shared/types/member'

const route = useRoute()
const saving = shallowRef(false)
const pending = shallowRef(false)
const editing = shallowRef<MemberDto | null>(null)
const errorMessage = shallowRef('')
const notice = shallowRef('')
const photoPreview = shallowRef('')
const photoInput = shallowRef<HTMLInputElement | null>(null)
const form = reactive({ id: '', name: '', email: '', phone: '', role: 'member' as 'admin' | 'pengurus' | 'member', password: '' })
const resetForm = reactive({ password: 'luber123' })

const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
  email: z.string().trim().email('Format email belum benar.'),
  phone: z.string().trim().regex(/^08\d{8,11}$/, 'Nomor HP harus diawali 08 dan berisi 10–13 digit.'),
  role: z.enum(['admin', 'pengurus', 'member'], { message: 'Pilih tipe anggota.' }),
  password: z.string().min(8, 'Password minimal 8 karakter.')
})
const editUserSchema = createUserSchema.pick({ name: true, phone: true, role: true })
const userSchema = computed(() => editing.value ? editUserSchema : createUserSchema)
type UserForm = z.infer<typeof createUserSchema>
const roleOptions = [
  { value: 'admin' as const, label: 'Admin', description: 'Akses penuh', icon: 'i-lucide-shield-check' },
  { value: 'pengurus' as const, label: 'Pengurus', description: 'Input & transaksi', icon: 'i-lucide-briefcase-business' },
  { value: 'member' as const, label: 'Member', description: 'Hanya melihat', icon: 'i-lucide-user' }
]
const isReset = computed(() => route.query.mode === 'reset')
const resetSchema = z.object({ password: z.string().min(8, 'Password minimal 8 karakter.').max(128, 'Password terlalu panjang.') })

async function loadEditingMember() {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  if (!id) return
  pending.value = true
  try {
    const result = await $fetch<MemberListResponse>('/api/admin/members', { query: { q: id, limit: 100 } })
    const found = result.items.find(item => item.id === id)
    if (!found) throw new Error('Anggota tidak ditemukan')
    editing.value = found
    Object.assign(form, { id: found.id, name: found.name, email: found.email ?? '', phone: found.phone ?? '', role: found.role ?? 'member', password: '' })
  } catch {
    errorMessage.value = 'Data pengguna tidak dapat dimuat.'
  } finally {
    pending.value = false
  }
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

async function saveMember(event: FormSubmitEvent<{ name: string, phone: string, role: UserForm['role'], email?: string, password?: string }>) {
  if (saving.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/admin/members/${encodeURIComponent(editing.value.id)}`, { method: 'PATCH', body: { name: event.data.name, phone: event.data.phone, role: event.data.role } })
      notice.value = 'Data anggota berhasil diperbarui.'
    } else {
      await $fetch('/api/admin/members', { method: 'POST', body: { id: form.id || `USR-${Date.now().toString(36).toUpperCase()}`, name: event.data.name, email: event.data.email, phone: event.data.phone, password: event.data.password, role: event.data.role } })
      notice.value = 'Anggota baru berhasil ditambahkan.'
    }
    await navigateTo('/admin/users')
  } catch (error: unknown) {
    const message = error as { data?: { statusMessage?: string } }
    errorMessage.value = message.data?.statusMessage ?? 'Data anggota tidak dapat disimpan.'
  } finally { saving.value = false }
}

async function saveReset(event: FormSubmitEvent<{ password: string }>) {
  if (saving.value || !editing.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/members/${encodeURIComponent(editing.value.id)}/reset-password`, { method: 'POST', body: { password: event.data.password } })
    await navigateTo('/admin/users')
  } catch (error: unknown) {
    const message = error as { data?: { statusMessage?: string } }
    errorMessage.value = message.data?.statusMessage ?? 'Password tidak dapat direset.'
  } finally { saving.value = false }
}

onMounted(loadEditingMember)
useSeoMeta({ title: computed(() => editing.value ? 'Ubah Pengguna | Luber' : 'Tambah Pengguna | Luber') })
</script>

<template>
  <main class="min-h-full w-full bg-[#EFF2FE] text-slate-800 sm:rounded-[40px] sm:border sm:border-white/10 sm:shadow-2xl">
    <header class="rounded-b-[28px] bg-linear-to-b from-[#2234A6] to-[#2A41CB] px-5 pb-5 pt-5 text-white shadow-lg shadow-[#1C2868]/20">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/users"
          aria-label="Kembali ke pengguna"
          class="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-5"
          />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-extrabold leading-none tracking-tight">
            {{ isReset ? 'Reset password' : editing ? 'Ubah pengguna' : 'Tambah pengguna' }}
          </h1><p class="mt-1 text-xs font-medium text-[#DFE5FC]">
            {{ editing?.email ?? 'Buat akun pengguna baru' }}
          </p>
        </div>
      </div>
    </header>
    <div
      v-if="pending"
      class="p-5"
    >
      <div class="h-96 animate-pulse rounded-3xl bg-white/70" />
    </div>
    <UForm
      v-if="isReset && editing"
      :schema="resetSchema"
      :state="resetForm"
      class="px-5 pb-8 pt-5"
      @submit="saveReset"
    >
      <UFormField
        label="Password baru"
        name="password"
      >
        <UInput
          v-model="resetForm.password"
          class="w-full"
          size="xl"
          type="password"
          placeholder="Minimal 8 karakter"
        />
      </UFormField>
      <button
        type="submit"
        :disabled="saving"
        class="mt-6 h-12 w-full rounded-2xl bg-[#2A41CB] text-sm font-bold text-white shadow-lg shadow-[#2A41CB]/30 disabled:opacity-50"
      >
        {{ saving ? 'Menyimpan...' : 'Reset password' }}
      </button>
      <p
        v-if="errorMessage"
        role="alert"
        class="mt-3 text-sm font-semibold text-red-700"
      >
        {{ errorMessage }}
      </p>
    </UForm>
    <UForm
      v-else
      :schema="userSchema"
      :state="form"
      class="px-5 pb-8 pt-5"
      @submit="saveMember"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-xl font-extrabold text-slate-900">
          {{ editing ? 'Ubah pengguna' : 'Tambah pengguna' }}
        </h2><button
          type="button"
          aria-label="Tutup formulir"
          class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600"
          @click="navigateTo('/admin/users')"
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
          @click="navigateTo('/admin/users')"
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
      <p
        v-if="notice"
        role="status"
        class="mt-3 text-sm font-semibold text-emerald-700"
      >
        {{ notice }}
      </p>
      <p
        v-if="errorMessage"
        role="alert"
        class="mt-3 text-sm font-semibold text-red-700"
      >
        {{ errorMessage }}
      </p>
    </UForm>
  </main>
</template>
