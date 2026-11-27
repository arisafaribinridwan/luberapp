<script setup lang="ts">
useSeoMeta({ title: 'Transfer Antar Rekening | Luber' })

definePageMeta({
  layout: {
    name: 'default',
    props: {
      title: 'Transfer Rekening Pusat',
      subtitle: 'Pemindahan internal antar rekening fisik',
      backTo: '/',
      backLabel: 'Kembali ke Launchpad'
    }
  }
})
</script>

<template>
  <div>
    <div class="px-5 py-6">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <UIcon
            name="i-lucide-arrow-left-right"
            class="size-7"
          />
        </div>
        <h2 class="mt-4 text-base font-bold text-[#0C2541]">
          Transfer Antar Rekening Pusat
        </h2>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
          Form transfer internal antar rekening manual aktif dengan bukti transfer atomik akan diimplementasikan pada <strong>Task 13 & Task 17</strong>.
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
  </div>
</template>
