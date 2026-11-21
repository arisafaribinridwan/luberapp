<script setup lang="ts">
useSeoMeta({ title: 'Log Aktivitas | Luber' })
</script>

<template>
  <AppShell
    title="Log Aktivitas"
    subtitle="Catatan riwayat audit trail sistem"
    back-to="/"
    back-label="Kembali ke Launchpad"
  >
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <UIcon
            name="i-lucide-clipboard-list"
            class="size-7"
          />
        </div>
        <h2 class="mt-4 text-base font-bold text-[#0C2541]">
          Log Aktivitas Admin
        </h2>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
          Riwayat log append-only untuk memantau aktivitas penting (login, transaksi, transfer, dan mutasi akun) akan diimplementasikan pada <strong>Task 7 & Task 18</strong>.
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
