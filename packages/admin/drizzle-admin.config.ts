import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/admin-schema.ts',
  out: './server/db/migrations-admin'
})
