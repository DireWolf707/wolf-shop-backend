import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: process.env.DEBUG ? ["query", "info", "warn", "error"] : undefined,
  datasources: { db: { url: process.env.DATABASE_POOL_URL } },
})

try {
  await prisma.$connect()
  console.log("PostgresDB connection successful!")
} catch (err) {
  console.error("Error in PostgresDB Connection!")
  console.error(err.name, err.message)
  process.exit(1)
}

export default prisma
