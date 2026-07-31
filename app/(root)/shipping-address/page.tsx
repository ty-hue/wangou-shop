import React from "react";
import { getMyCart } from "@/lib/actions/cart-actions";
import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShippingAddress } from "@/types";
import { getUserById } from "@/lib/actions/user-actions";
import ShippingAddressForm from "./shipping-address-form";
export const metadata: Metadata = {
  title: "收货地址",
};
const ShippingAddressPage = async () => {
  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) redirect("/cart");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("用户id不存在");
  const user = await getUserById(userId);

  return (
    <>
      <ShippingAddressForm address={user.address as ShippingAddress} />
    </>
  );
};

export default ShippingAddressPage;
