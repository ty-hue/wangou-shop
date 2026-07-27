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
