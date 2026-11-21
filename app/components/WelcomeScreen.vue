<template>
  <main class="flex min-h-dvh w-full flex-col items-center justify-center gap-19.5 px-6 py-8">
    <img
      class="h-auto w-62.5 max-w-full"
      src="/brand.svg"
      width="250"
      height="169"
      alt="Luber, Lunas Bersama. Hidup Bebas Hutang Dan Riba"
    >
    <NuxtLink
      to="/login"
      class="flex min-h-12 w-full max-w-80.25 items-center justify-center gap-3 rounded-lg bg-[#2A41CB] text-sm font-semibold text-white no-underline hover:bg-[#2439B5] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#12192F]"
    >
      <span>Get Started</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        class="size-5"
      >
        <path
          d="M4 12h16m-7-7 7 7-7 7"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </NuxtLink>
  </main>
</template>
