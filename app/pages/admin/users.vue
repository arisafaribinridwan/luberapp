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

useSeoMeta({ title: 'Kelola Pengguna | Luber' })
</script>

<template>
  <AppShell
    title="Kelola Pengguna"
    subtitle="Pendaftaran akun & hak akses role"
    back-to="/"
    back-label="Kembali ke Launchpad"
  >
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <h2 class="text-base font-bold text-[#0C2541]">
          Buat Akun Pengguna Baru
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          Admin menetapkan password saat membuat akun. Sampaikan password tersebut kepada anggota melalui kanal yang aman.
        </p>

        <div
          v-if="notice"
          role="status"
          class="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
        >
          <UIcon
            name="i-lucide-badge-check"
            class="size-4 shrink-0 text-emerald-600"
          />
          <span>{{ notice }}</span>
        </div>

        <div
          v-if="errorMessage"
          role="alert"
          class="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
        >
          <UIcon
            name="i-lucide-circle-alert"
            class="size-4 shrink-0 text-red-600"
          />
          <span>{{ errorMessage }}</span>
        </div>

        <form
          class="mt-5 flex flex-col gap-3.5"
          @submit.prevent="submit"
        >
          <div>
            <label
              for="new-user-name"
              class="block text-xs font-semibold text-[#0C2541]"
            >
              Nama Lengkap
            </label>
            <input
              id="new-user-name"
              v-model="name"
              type="text"
              autocomplete="name"
              required
              placeholder="Contoh: Budi Santoso"
              class="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-[#0C2541] placeholder:text-slate-400 focus-visible:border-[#2A41CB] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </div>

          <div>
            <label
              for="new-user-email"
              class="block text-xs font-semibold text-[#0C2541]"
            >
              Alamat Email
            </label>
            <input
              id="new-user-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="anggota@luber.org"
              class="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-[#0C2541] placeholder:text-slate-400 focus-visible:border-[#2A41CB] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </div>

          <div>
            <label
              for="new-user-password"
              class="block text-xs font-semibold text-[#0C2541]"
            >
              Password Sementara (min. 8 karakter)
            </label>
            <input
              id="new-user-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
              placeholder="Minimal 8 karakter"
              class="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-[#0C2541] placeholder:text-slate-400 focus-visible:border-[#2A41CB] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
          </div>

          <div>
            <label
              for="new-user-role"
              class="block text-xs font-semibold text-[#0C2541]"
            >
              Role Hak Akses
            </label>
            <select
              id="new-user-role"
              v-model="role"
              class="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-[#0C2541] focus-visible:border-[#2A41CB] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
            >
              <option value="member">
                Member (Akses Baca & Data Pribadi)
              </option>
              <option value="pengurus">
                Pengurus (Akses Pencatatan Transaksi)
              </option>
              <option value="admin">
                Admin (Akses Penuh Seluruh Sistem)
              </option>
            </select>
          </div>

          <button
            type="submit"
            class="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#2A41CB] px-4 text-sm font-semibold text-white shadow-md shadow-[#2A41CB]/20 transition-all hover:bg-[#2439B5] active:scale-[0.98] disabled:opacity-50"
            :disabled="pending"
          >
            {{ pending ? 'Membuat akun...' : 'Buat Akun Pengguna' }}
          </button>
        </form>
      </div>
    </div>
  </AppShell>
</template>
