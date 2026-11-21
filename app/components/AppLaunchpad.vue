<script setup lang="ts">
const { user } = useUserSession()
const { role, hasRole, isAdmin } = useRole()
const { execute: signOut, status: signOutStatus } = useSignOut()

interface MenuItem {
  title: string
  description: string
  to: string
  icon: string
  iconColor: string
  iconBg: string
  badge?: string
  badgeClass?: string
  visible: boolean
}

const roleBadge = computed(() => {
  switch (role.value) {
    case 'admin':
      return {
        label: 'Administrator',
        icon: 'i-lucide-shield-check',
        class: 'bg-indigo-50 text-[#2A41CB] border-indigo-200'
      }
    case 'pengurus':
      return {
        label: 'Pengurus',
        icon: 'i-lucide-badge-check',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    case 'member':
    default:
      return {
        label: 'Anggota',
        icon: 'i-lucide-user',
        class: 'bg-blue-50 text-blue-700 border-blue-200'
      }
  }
})

const menuItems = computed<MenuItem[]>(() => [
  {
    title: 'Dashboard Keuangan',
    description: 'Ringkasan Kas Utama, piutang, modal hibah, dan status pemulihan defisit.',
    to: '/dashboard',
    icon: 'i-lucide-layout-dashboard',
    iconColor: 'text-[#2A41CB]',
    iconBg: 'bg-blue-50',
    visible: true
  },
  {
    title: 'Pencatatan Transaksi',
    description: 'Input kas masuk, kas keluar, dan mutasi operasional dengan bukti fisik.',
    to: '/transactions',
    icon: 'i-lucide-wallet',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    badge: 'Pengurus & Admin',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    visible: hasRole('pengurus', 'admin')
  },
  {
    title: 'Data & Mutasi Anggota',
    description: 'Pencarian anggota, catatan simpanan bersih, dan sisa saldo pinjaman tanpa riba.',
    to: '/members',
    icon: 'i-lucide-users',
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
    visible: true
  },
  {
    title: 'Transfer Antar Rekening',
    description: 'Pemindahan dana internal antar rekening manual komunitas secara atomik.',
    to: '/transfers',
    icon: 'i-lucide-arrow-left-right',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    badge: 'Admin',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    visible: isAdmin.value
  },
  {
    title: 'Rekening Manual',
    description: 'Kelola daftar rekening bank fisik, kas tunai operasional, dan status aktif.',
    to: '/settings/manual-accounts',
    icon: 'i-lucide-credit-card',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    badge: 'Admin',
    badgeClass: 'bg-indigo-50 text-[#2A41CB] border-indigo-200',
    visible: isAdmin.value
  },
  {
    title: 'Kelola Pengguna',
    description: 'Pendaftaran akun baru dan penetapan hak akses role anggota, pengurus, atau admin.',
    to: '/admin/users',
    icon: 'i-lucide-user-plus',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    badge: 'Admin',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    visible: isAdmin.value
  },
  {
    title: 'Log Aktivitas',
    description: 'Audit trail append-only seluruh kejadian, mutasi, dan aktivitas penting sistem.',
    to: '/admin/audit-logs',
    icon: 'i-lucide-clipboard-list',
    iconColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
    badge: 'Admin',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    visible: isAdmin.value
  },
  {
    title: 'Keamanan Akun & 2FA',
    description: 'Pengaturan verifikasi dua langkah dan keamanan kredensial akun Anda.',
    to: '/security',
    icon: 'i-lucide-shield-check',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    visible: true
  }
])
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-[#F7F8FA] pb-24 text-[#0C2541]">
    <!-- Top Header Profile Section -->
    <header class="border-b border-slate-200/80 bg-white px-5 pt-6 pb-5 shadow-xs">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Luber, Lunas Bersama"
            class="h-8 w-auto"
          >
        </div>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50"
          :disabled="signOutStatus === 'pending'"
          @click="signOut()"
        >
          <UIcon
            name="i-lucide-log-out"
            class="size-3.5"
          />
          <span>{{ signOutStatus === 'pending' ? 'Keluar...' : 'Keluar' }}</span>
        </button>
      </div>

      <!-- User Greeting & Role Badge -->
      <div class="mt-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">
            Assalamu’alaikum,
          </p>
          <h1 class="text-lg font-bold text-[#0C2541]">
            {{ user?.name || 'Sahabat Luber' }}
          </h1>
          <p class="text-xs text-slate-400">
            {{ user?.email }}
          </p>
        </div>

        <div
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-2xs"
          :class="roleBadge.class"
        >
          <UIcon
            :name="roleBadge.icon"
            class="size-3.5"
          />
          <span>{{ roleBadge.label }}</span>
        </div>
      </div>
    </header>

    <!-- Ta'awun & Trust Card -->
    <div class="px-4 pt-4">
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A41CB] to-[#1C2B85] p-4 text-white shadow-md shadow-[#2A41CB]/20">
        <div class="relative z-10 flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold tracking-wider text-blue-200 uppercase">
              Prinsip Ta’awun & Nir-Riba
            </span>
            <span class="rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
              Komunitas
            </span>
          </div>
          <h2 class="text-sm font-bold text-white">
            Pencatatan Keuangan Terbuka & Amanah
          </h2>
          <p class="mt-0.5 text-xs leading-relaxed text-blue-100">
            Setiap rupiah dicatat dengan teliti berpasangan (double-entry), tanpa bunga, denda, atau penalti.
          </p>
        </div>
        <!-- Decorative background shapes -->
        <div class="absolute -right-6 -bottom-8 size-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>
    </div>

    <!-- Launchpad Menu Navigation Section -->
    <div class="px-4 pt-5">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-xs font-bold tracking-wider text-slate-500 uppercase">
          Menu Aplikasi
        </h3>
        <span class="text-[11px] font-medium text-slate-400">
          Akses berdasarkan role
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <NuxtLink
          v-for="item in menuItems.filter(i => i.visible)"
          :key="item.to"
          :to="item.to"
          class="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:border-[#2A41CB]/40 hover:shadow-sm active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              :class="[item.iconBg, item.iconColor]"
            >
              <UIcon
                :name="item.icon"
                class="size-6"
              />
            </div>

            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[#0C2541] transition-colors group-hover:text-[#2A41CB]">
                  {{ item.title }}
                </span>
                <span
                  v-if="item.badge"
                  class="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                  :class="item.badgeClass"
                >
                  {{ item.badge }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-500 line-clamp-1">
                {{ item.description }}
              </p>
            </div>
          </div>

          <div class="shrink-0 text-slate-300 transition-colors group-hover:translate-x-0.5 group-hover:text-[#2A41CB]">
            <UIcon
              name="i-lucide-chevron-right"
              class="size-5"
            />
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Bottom Watermark & Brand Reminder -->
    <div class="mt-8 flex flex-col items-center justify-center px-4 text-center">
      <img
        src="/brand.svg"
        alt="Luber"
        class="h-10 w-auto opacity-40 grayscale"
      >
      <p class="mt-2 text-[11px] font-medium text-slate-400">
        Lunas Bersama • Hidup Bebas Hutang Dan Riba
      </p>
    </div>
  </div>
</template>
