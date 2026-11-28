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
const { hasRole } = useRole()

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
  <div class="relative flex h-full min-h-0 flex-col bg-[#F7F8FA] text-[#0C2541]">
    <!-- Top Bar Header -->
    <header class="sticky top-0 z-30 bg-linear-to-b from-[#2234A6] to-[#2A41CB] flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          aria-label="Kembali ke menu utama"
          class="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20 active:scale-95"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-5 text-white"
          />
        </NuxtLink>

        <div>
          <h1
            v-if="props.title"
            class="text-base font-bold leading-tight text-white"
          >
            {{ props.title }}
          </h1>
          <p
            v-if="props.subtitle"
            class="text-xs text-white/70"
          >
            {{ props.subtitle }}
          </p>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 pb-28">
      <slot />
    </main>

    <!-- Bottom Navigation Bar for Mobile-First Flow -->
    <div
      v-if="!props.hideBottomNav"
      class="pointer-events-auto absolute bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2"
    >
      <nav
        class="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/90 p-1.5 shadow-[0_20px_50px_-12px_rgb(15_23_42/45%)] backdrop-blur-xl"
        aria-label="Navigasi Floating"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group relative flex size-11 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:scale-105 hover:text-white active:scale-95"
          :class="isNavActive(item) ? 'text-white' : ''"
          :aria-label="item.label"
        >
          <span
            v-if="isNavActive(item)"
            class="absolute inset-0 rounded-full bg-white/20 shadow-[inset_0_1px_1px_rgb(255_255_255/40%)]"
          />
          <UIcon
            :name="item.icon"
            class="relative z-10 size-5 transition-transform duration-200"
            :class="isNavActive(item) ? 'scale-110' : ''"
          />
          <span
            class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>
