<script setup lang="ts">
const { ready, loggedIn } = useUserSession()
</script>

<template>
  <AuthenticatedHome v-if="ready && loggedIn" />
  <WelcomeScreen v-else-if="ready" />
  <main
    v-else
    class="min-h-dvh"
    aria-busy="true"
  />
</template>
