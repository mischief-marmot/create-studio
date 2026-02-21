/**
 * Extend nuxt-auth-utils session types for admin portal
 */
declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    role: string
    firstname?: string | null
    lastname?: string | null
  }

  interface UserSession {
    // Add custom session properties if needed
  }
}

export {}
