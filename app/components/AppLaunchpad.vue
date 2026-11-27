<script setup lang="ts">
const { user } = useUserSession()
const { role, hasRole, isAdmin } = useRole()
const { execute: signOut, status: signOutStatus } = useSignOut()

interface MenuItem {
  id: string
  label: string
  to: string
  icon: string
  tone: 'brand' | 'in' | 'out'
  visible: boolean
}

const roleDisplay = computed(() => {
  switch (role.value) {
    case 'admin':
      return { label: 'Admin', initials: 'AD' }
    case 'pengurus':
      return { label: 'Pengurus', initials: 'PG' }
    case 'member':
    default:
      return { label: 'Member', initials: 'MB' }
  }
})

const userInitials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return roleDisplay.value.initials

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
})

const menuItems = computed<MenuItem[]>(() => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'i-lucide-chart-pie',
    tone: 'brand',
    visible: true
  },
  {
    id: 'members',
    label: 'Mutasi',
    to: '/members',
    icon: 'i-lucide-id-card',
    tone: 'brand',
    visible: true
  },
  {
    id: 'transactions',
    label: 'Transaksi',
    to: '/transactions',
    icon: 'i-lucide-wallet-cards',
    tone: 'in',
    visible: hasRole('pengurus', 'admin')
  },
  {
    id: 'transfers',
    label: 'Transfer',
    to: '/transfers',
    icon: 'i-lucide-arrow-left-right',
    tone: 'brand',
    visible: isAdmin.value
  },
  {
    id: 'accounts',
    label: 'Rekening',
    to: '/settings/manual-accounts',
    icon: 'i-lucide-landmark',
    tone: 'brand',
    visible: isAdmin.value
  },
  {
    id: 'users',
    label: 'Pengguna',
    to: '/admin/users',
    icon: 'i-lucide-users-round',
    tone: 'brand',
    visible: isAdmin.value
  },
  {
    id: 'audit-logs',
    label: 'Aktivitas',
    to: '/admin/audit-logs',
    icon: 'i-lucide-clipboard-list',
    tone: 'brand',
    visible: isAdmin.value
  },
  {
    id: 'security',
    label: 'Keamanan',
    to: '/security',
    icon: 'i-lucide-shield-check',
    tone: 'brand',
    visible: true
  }
])

const visibleMenuItems = computed(() => menuItems.value.filter(item => item.visible))

const memberNotice = computed(() => role.value === 'member')

const menuToneClasses = (tone: MenuItem['tone']) => ({
  brand: 'border-brand-100 bg-brand-50 text-brand-600 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white group-focus-visible:border-brand-600 group-focus-visible:bg-brand-600 group-focus-visible:text-white',
  in: 'border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-focus-visible:border-emerald-600 group-focus-visible:bg-emerald-600 group-focus-visible:text-white',
  out: 'border-rose-100 bg-rose-50 text-rose-600 group-hover:border-rose-600 group-hover:bg-rose-600 group-hover:text-white group-focus-visible:border-rose-600 group-focus-visible:bg-rose-600 group-focus-visible:text-white'
}[tone])
</script>

<template>
  <main class="relative flex h-dvh min-h-0 w-full flex-1 overflow-hidden bg-[#1c2868] sm:h-full">
    <div
      class="absolute inset-0 overflow-hidden bg-[linear-gradient(170deg,rgb(10_25_58/70%)_0%,rgb(24_54_112/64%)_45%,rgb(5_12_30/92%)_100%),url('/donny-jiang-42gFAgdIUC8-unsplash.jpg')] bg-cover bg-center"
      aria-hidden="true"
    />

    <div class="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <header class="flex items-center justify-between gap-3 px-5 pb-2 pt-5 md:pt-6 max-[365px]:px-4">
        <div class="flex min-w-0 items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 pl-1.5 text-white shadow-[0_12px_30px_rgb(14_20_64/12%)] backdrop-blur-[14px]">
          <div
            class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[0.7rem] font-extrabold text-brand-600"
            aria-hidden="true"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 leading-[1.2]">
            <p class="m-0 max-w-40 truncate text-sm font-bold">
              {{ user?.name || 'Sahabat Luber' }}
            </p>
            <p class="m-0 mt-0.5 truncate text-[0.6875rem] font-semibold text-[#dfe5fc]">
              {{ roleDisplay.label }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-[0.8125rem] font-bold text-white shadow-[0_12px_30px_rgb(14_20_64/12%)] backdrop-blur-[14px] transition-[background-color,transform,opacity] duration-150 hover:bg-white/20 active:scale-[0.96] disabled:cursor-wait disabled:opacity-[0.65] motion-reduce:transition-none max-[365px]:px-3"
          :disabled="signOutStatus === 'pending'"
          @click="signOut()"
        >
          <span>{{ signOutStatus === 'pending' ? 'Keluar...' : 'Keluar' }}</span>
          <UIcon
            name="i-lucide-log-out"
            class="size-4"
          />
        </button>
      </header>

      <section
        class="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-8 pt-7 text-center animate-logo-in motion-reduce:animate-none"
        aria-labelledby="launchpad-title"
      >
        <img
          src="/logo-dark-bg.svg"
          alt="Luber, Lunas Bersama"
          class="size-64 object-contain"
        >
      </section>

      <section
        class="mt-auto shrink-0 rounded-t-4xl text-white border border-white/20 bg-white/20 px-5 pb-5 pt-6 shadow-[0_-20px_60px_rgb(14_20_64/42%)] animate-sheet-in motion-reduce:animate-none max-[365px]:px-4"
        aria-labelledby="menu-title"
      >
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2
            id="menu-title"
            class="m-0 text-base font-extrabold "
          >
            Menu utama
          </h2>
          <span class="text-[0.6875rem] font-semibold ">Pilih layanan</span>
        </div>

        <nav
          class="grid grid-cols-4 gap-x-2 gap-y-5"
          aria-label="Menu utama aplikasi"
        >
          <NuxtLink
            v-for="item in visibleMenuItems"
            :key="item.id"
            :to="item.to"
            class="group flex min-w-0 flex-col items-center gap-2 rounded-2xl p-1 no-underline outline-none [-webkit-tap-highlight-color:transparent] focus-visible:shadow-[0_0_0_2px_#2a41cb,0_0_0_4px_white]"
          >
            <span
              class="grid size-14 place-items-center rounded-2xl border transition-[background-color,border-color,color,transform] duration-150 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transition-none max-[365px]:size-13"
              :class="menuToneClasses(item.tone)"
            >
              <UIcon
                :name="item.icon"
                class="size-6"
                aria-hidden="true"
              />
            </span>
            <span class="max-w-21 text-center text-[0.6875rem] font-bold leading-[1.15]">{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <p
          v-if="memberNotice"
          class="m-0 mt-5 rounded-xl bg-brand-50 px-3 py-2.5 text-center text-[0.6875rem] font-semibold leading-[1.45] text-brand-800"
        >
          Transaksi dikelola oleh pengurus komunitas. Anda dapat melihat dashboard dan mutasi.
        </p>

        <p class="m-0 mt-6 text-center text-[0.6875rem] font-semibold leading-[1.45] text-slate-400">
          LuberApp v1.0
        </p>

        <p class="m-0 mt-3 text-center text-[0.5625rem] leading-[1.4] text-slate-400">
          Photo by
          <a
            href="https://unsplash.com/@dotnny?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2"
          >Donny Jiang</a>
          on
          <a
            href="https://unsplash.com/photos/low-angle-photo-of-high-rise-buildings-under-white-sky-42gFAgdIUC8?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2"
          >Unsplash</a>
        </p>
      </section>
    </div>
  </main>
</template>
