/**
 * Augment nuxt-auth-utils session types
 */
declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    validEmail: boolean
    firstname?: string
    lastname?: string
    avatar?: string
  }

  interface UserSession {
    user: User
  }
}

export {}
