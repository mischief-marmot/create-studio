export default defineEventHandler(async (event) => {
  // Get current session
  const session = await getUserSession(event)

  if (!session?.user) {
    return {
      authenticated: false,
      user: null,
    }
  }

  return {
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      firstname: session.user.firstname,
      lastname: session.user.lastname,
    },
  }
})
