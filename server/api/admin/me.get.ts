export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'admin')

  return { id: user.id, role: user.role }
})
