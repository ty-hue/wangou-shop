import simpleData from "./simple-data";
import { createPrismaClient } from "@/lib/db";

async function seed() {
  const prisma = await createPrismaClient();

  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: simpleData.products,
  });
}
seed();
