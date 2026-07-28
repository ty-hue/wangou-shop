import simpleData from "./simple-data";
import prisma from "@/db/db";

async function seed() {
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();

  await prisma.product.createMany({
    data: simpleData.products,
  });
  await prisma.user.createMany({
    data: simpleData.users,
  });
}
seed();
