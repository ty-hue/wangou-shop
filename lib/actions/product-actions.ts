import prisma from "@/db/db";
import { converToPlainObject } from "@/lib/utils";
import { LATEST_PRODUCT_LIMIT } from "../constants";
import { Product } from "@/types";

export async function getLatestProducts(): Promise<Product[]> {
  const data = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: LATEST_PRODUCT_LIMIT,
  });
  return converToPlainObject(data) as unknown as Product[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(id: string): Promise<Product | null> {
  if (!UUID_REGEX.test(id)) {
    return null;
  }
  const data = await prisma.product.findUnique({
    where: {
      id,
    },
  });
  return converToPlainObject(data) as unknown as Product | null;
}
