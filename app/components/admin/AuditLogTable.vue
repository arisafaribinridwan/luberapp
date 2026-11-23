<script setup lang="ts">
import type { AuditLogDto } from '~~/shared/types/audit-log'

defineProps<{
  items: AuditLogDto[]
  pending: boolean
}>()

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
    <table class="min-w-full text-left text-xs">
      <thead class="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
        <tr>
          <th class="px-4 py-3 font-semibold">
            Waktu
          </th>
          <th class="px-4 py-3 font-semibold">
            Kejadian
          </th>
          <th class="px-4 py-3 font-semibold">
            Ringkasan
          </th>
          <th class="px-4 py-3 font-semibold">
            Pelaku
          </th>
          <th class="px-4 py-3 font-semibold">
            Target
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-slate-700">
        <tr v-if="pending">
          <td
            colspan="5"
            class="px-4 py-10 text-center text-slate-500"
          >
            Memuat log aktivitas...
          </td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td
            colspan="5"
            class="px-4 py-10 text-center text-slate-500"
          >
            Belum ada log yang cocok dengan filter.
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="item in items"
            :key="item.id"
            class="align-top"
          >
            <td class="whitespace-nowrap px-4 py-3">
              {{ formatDate(item.createdAt) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 font-semibold text-[#0C2541]">
              {{ item.eventType }}
            </td>
            <td class="min-w-56 px-4 py-3">
              {{ item.summary }}
            </td>
            <td class="px-4 py-3">
              <template v-if="item.actor">
                <div class="font-medium text-[#0C2541]">
                  {{ item.actor.name }}
                </div>
                <div class="text-[11px] text-slate-500">
                  {{ item.actor.email }}
                </div>
              </template>
              <span
                v-else
                class="text-slate-400"
              >Sistem / anonim</span>
            </td>
            <td class="px-4 py-3 text-slate-500">
              <span v-if="item.targetType">{{ item.targetType }}: {{ item.targetId }}</span>
              <span v-else>—</span>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
