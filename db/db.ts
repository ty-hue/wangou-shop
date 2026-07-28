import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 创建数据库连接实例
function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter }).$extends(withAccelerate());
  return prisma;
}
const prisma = globalForPrisma.prisma || createPrismaClient();
export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
