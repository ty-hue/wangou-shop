"use server";
import type { CartItem } from "@/types";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { converToPlainObject, formatError, round2 } from "../utils";
import prisma from "@/db/db";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";

const calcPrice = (items: CartItem[]) => {
  // 商品总价
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );
  const shippingPrice = round2(itemsPrice > 100 ? 0 : 10); // 运费
  const taxPrice = round2(itemsPrice * 0.15); // 税费
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

// 加入购物车
export async function addItemToCart(data: CartItem) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      throw new Error("sessionCartId不存在");
    }
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;
    const cart = await getMyCart();
    const item = cartItemSchema.parse(data);
    const product = await prisma.product.findFirst({
      where: {
        id: item.productId,
      },
    });
    if (!product) {
      throw new Error("商品不存在");
    }
    if (!cart) {
      const newCart = insertCartSchema.parse({
        userId,
        sessionCartId,
        items: [item],
        ...calcPrice([item]),
      });
      await prisma.cart.create({
        data: newCart,
      });
      revalidatePath(`/product/${product.id}`);
      return {
        success: true,
        message: `添加${product.name}到购物车成功`,
      };
    } else {
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId,
      );
      if (existItem) {
        if (product.stock < existItem.qty + 1) {
          throw new Error("商品库存不足");
        }
        existItem.qty += 1;
      } else {
        if (product.stock < 1) throw new Error("商品库存不足");
        cart.items.push(item);
      }

      await prisma.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items: cart.items,
          ...calcPrice(cart.items),
        },
      });
      revalidatePath(`/product/${product.id}`);
      return {
        success: true,
        message: `${product.name} 已在购物车 ${existItem ? "更新" : "添加"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// 获取购物车
export async function getMyCart() {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) {
    throw new Error("sessionCartId不存在");
  }
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;
  // 从数据库中获取用户购物车
  const cart = await prisma.cart.findFirst({
    where: userId
      ? {
          userId,
        }
      : { sessionCartId },
  });
  if (!cart) {
    return undefined;
  }
  return converToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

// 从购物车移除商品
export async function removeItemFromCart(productId: string) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      throw new Error("sessionCartId不存在");
    }
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
      },
    });
    if (!product) {
      throw new Error("商品不存在");
    }
    const cart = await getMyCart();
    if (!cart) {
      throw new Error("购物车不存在");
    }
    const existItem = (cart.items as CartItem[]).find(
      (x) => x.productId === productId,
    );
    if (!existItem) {
      throw new Error("商品不存在购物车中");
    }
    if (existItem.qty === 1) {
      cart.items = cart.items.filter((x) => x.productId !== productId);
    } else {
      existItem.qty -= 1;
    }
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        items: cart.items,
        ...calcPrice(cart.items),
      },
    });
    revalidatePath(`/product/${product.id}`);
    return {
      success: true,
      message: `${product.name} 已从购物车移除`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
