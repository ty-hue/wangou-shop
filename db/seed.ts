import simpleData from "./simple-data";
import prisma from "@/db/db";

async function seed() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: simpleData.products,
  });
}
seed();
