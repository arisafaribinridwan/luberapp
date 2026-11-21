<script setup lang="ts">
useSeoMeta({ title: 'Data Anggota & Mutasi | Luber' })
</script>

<template>
  <AppShell
    title="Data Anggota & Mutasi"
    subtitle="Pencarian anggota & saldo simpanan"
    back-to="/"
    back-label="Kembali ke Launchpad"
  >
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <UIcon
            name="i-lucide-users"
            class="size-7"
          />
        </div>
        <h2 class="mt-4 text-base font-bold text-[#0C2541]">
          Data Anggota & Riwayat Mutasi
        </h2>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
          Modul data anggota, auto-complete pencarian nama/ID, dan saldo simpanan bersih akan diimplementasikan pada <strong>Task 8 & Task 16</strong>.
        </p>

        <NuxtLink
          to="/"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2A41CB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          <span>Kembali ke Launchpad</span>
        </NuxtLink>
      </div>
    </div>
  </AppShell>
</template>
