import React from "react";
import CartTable from "./cart-table";
import { getMyCart } from "@/lib/actions/cart-actions";
export const metadata = {
  title: "购物车",
};

const CartPage = async () => {
  const cart = await getMyCart();
  return (
    <>
      <CartTable cart={cart} />
    </>
  );
};

export default CartPage;
