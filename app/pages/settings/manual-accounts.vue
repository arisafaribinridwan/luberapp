<script setup lang="ts">
useSeoMeta({ title: 'Rekening Manual | Luber' })

definePageMeta({
  layout: {
    name: 'default',
    props: {
      title: 'Rekening Manual',
      subtitle: 'Pengaturan daftar rekening bank & kas',
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
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <UIcon
            name="i-lucide-credit-card"
            class="size-7"
          />
        </div>
        <h2 class="mt-4 text-base font-bold text-[#0C2541]">
          Pengaturan Rekening Manual
        </h2>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
          Pengelolaan daftar rekening bank manual (BCA Bendahara, Mandiri Ketua, Kas Tunai) dan status aktif akan diimplementasikan pada <strong>Task 9 & Task 18</strong>.
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
