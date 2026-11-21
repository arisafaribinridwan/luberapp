import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const { session, loggedIn, fetchSession } = useUserSession()
  let timer: ReturnType<typeof setTimeout> | undefined

  async function checkSession() {
    try {
      await fetchSession({ force: true })
      if (!loggedIn.value) await navigateTo('/')
    } catch {
      timer = setTimeout(checkSession, 15_000)
    }
  }

  watch([session, loggedIn], ([currentSession, isLoggedIn]) => {
    if (timer) clearTimeout(timer)
    if (!isLoggedIn || !currentSession) return

    const expiresAt = new Date(currentSession.expiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return

    timer = setTimeout(checkSession, Math.max(1000, expiresAt - Date.now() + 1000))
  }, { immediate: true })
})
