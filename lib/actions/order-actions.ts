"use server";

import { auth } from "@/auth";
import { formatError } from "../utils";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getMyCart } from "./cart-actions";
import { getUserById } from "./user-actions";
import { insertOrderSchema } from "../validators";
import { CartItem } from "@/types";
import prisma from "@/db/db";

export async function createOrder() {
  try {
    const session = await auth();
    if (!session) throw new Error("未登录");
    const cart = await getMyCart();
    const userId = session.user?.id;
    if (!userId) throw new Error("未登录");
    const user = await getUserById(userId);
    if (!cart || cart.items.length === 0) {
      return { success: false, message: "购物车为空", redirectTo: "/cart" };
    }
    if (!user.address) {
      return {
        success: false,
        message: "收货地址为空",
        redirectTo: "/shipping-address",
      };
    }
    if (!user.paymentMethod) {
      return {
        success: false,
        message: "支付方式为空",
        redirectTo: "/payment-method",
      };
    }
    const order = insertOrderSchema.parse({
      userId,
      cartId: cart.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      totalPrice: cart.totalPrice,
      taxPrice: cart.taxPrice,
      shippingPrice: cart.shippingPrice,
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({
        data: order,
      });
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: insertedOrder.id,
          },
        });
      }
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      });
      return insertedOrder.id;
    });
    if (!insertedOrderId) throw new Error("订单创建失败");
    return {
      success: true,
      message: "订单创建成功",
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}
