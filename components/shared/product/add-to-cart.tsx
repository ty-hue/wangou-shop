"use client";
import React from "react";
import type { Cart, CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Minus, Loader } from "lucide-react";
import { toast } from "sonner";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart-actions";
import { useTransition } from "react";
const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addItemToCart(item);
      if (!res.success) {
        toast.error("", {
          description: res.message,
        });
        return;
      }
      toast.success("", {
        description: res.message,
        action: {
          label: "查看购物车",
          onClick: () => router.push("/cart"),
        },
      });
    });
  };
  const existItem =
    cart && cart.items.find((i) => i.productId === item.productId);
  const handleRemoveFormCart = async () => {
    startTransition(async () => {
      const res = await removeItemFromCart(item.productId);
      if (res.success) {
        toast.success("", {
          description: res.message,
        });
      } else {
        toast.error("", {
          description: res.message,
        });
      }
      return;
    });
  };
  return existItem ? (
    <div className="flex items-center ">
      <Button type="button" variant="outline" onClick={handleRemoveFormCart}>
        {isPending ? (
          <Loader className="w-4 h-4" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </Button>
      <span className="px-2">{existItem.qty}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        {isPending ? (
          <Loader className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      <Plus />
      加入购物车
    </Button>
  );
};

export default AddToCart;
