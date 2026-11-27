<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  showBack?: boolean
  backTo?: string
  backLabel?: string
  hideBottomNav?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  showBack: true,
  backTo: '/',
  backLabel: 'Kembali',
  hideBottomNav: false
})

const route = useRoute()
const { role, hasRole } = useRole()
const { execute: signOut, status: signOutStatus } = useSignOut()

const roleDisplay = computed(() => {
  switch (role.value) {
    case 'admin':
      return { label: 'Admin', class: 'bg-indigo-50 text-[#2A41CB] border-indigo-200' }
    case 'pengurus':
      return { label: 'Pengurus', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'member':
    default:
      return { label: 'Anggota', class: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
})

const navItems = computed(() => {
  const items = [
    {
      to: '/',
      label: 'Beranda',
      icon: 'i-lucide-layout-grid',
      exact: true
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      exact: false
    }
  ]

  if (hasRole('pengurus', 'admin')) {
    items.push({
      to: '/transactions',
      label: 'Transaksi',
      icon: 'i-lucide-wallet',
      exact: false
    })
  }

  items.push({
    to: '/security',
    label: 'Keamanan',
    icon: 'i-lucide-shield-check',
    exact: false
  })

  return items
})

function isNavActive(item: { to: string, exact: boolean }) {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-[#F7F8FA] text-[#0C2541]">
    <!-- Top Bar Header -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="props.showBack"
          :to="props.backTo"
          class="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#2A41CB] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#2A41CB]"
          :aria-label="props.backLabel"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-5"
          />
        </NuxtLink>

        <div>
          <h1
            v-if="props.title"
            class="text-base font-bold leading-tight text-[#0C2541]"
          >
            {{ props.title }}
          </h1>
          <NuxtLink
            v-else
            to="/"
            class="flex items-center gap-2 text-base font-bold text-[#0C2541] hover:text-[#2A41CB]"
          >
            <img
              src="/logo.svg"
              alt="Luber"
              class="h-6 w-auto"
            >
          </NuxtLink>
          <p
            v-if="props.subtitle"
            class="text-xs text-slate-500"
          >
            {{ props.subtitle }}
          </p>
        </div>
      </div>

      <!-- Right Header Actions: Role Badge & Quick Sign Out -->
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          :class="roleDisplay.class"
        >
          {{ roleDisplay.label }}
        </span>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
          title="Keluar"
          aria-label="Keluar dari akun"
          :disabled="signOutStatus === 'pending'"
          @click="signOut()"
        >
          <UIcon
            name="i-lucide-log-out"
            class="size-4"
          />
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 pb-20">
      <slot />
    </main>

    <!-- Bottom Navigation Bar for Mobile-First Flow -->
    <nav
      v-if="!props.hideBottomNav"
      class="fixed bottom-0 z-30 w-full max-w-md sm:max-w-lg border-t border-slate-200/80 bg-white/95 backdrop-blur-md"
      aria-label="Navigasi Utama"
    >
      <div class="grid grid-cols-4 items-center justify-around py-1.5 px-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center py-1 text-center transition-all duration-150 active:scale-95"
          :class="isNavActive(item) ? 'text-[#2A41CB]' : 'text-slate-500 hover:text-slate-900'"
        >
          <div
            class="relative flex items-center justify-center"
          >
            <UIcon
              :name="item.icon"
              class="size-5 transition-transform"
              :class="isNavActive(item) ? 'scale-110' : ''"
            />
            <span
              v-if="isNavActive(item)"
              class="absolute -bottom-1 size-1 rounded-full bg-[#2A41CB]"
            />
          </div>
          <span
            class="mt-1 text-[11px] leading-none"
            :class="isNavActive(item) ? 'font-bold' : 'font-medium'"
          >
            {{ item.label }}
          </span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
