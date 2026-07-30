"use client";
import React from "react";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addItemToCart } from "@/lib/actions/cart-actions";
const AddToCart = ({ item }: { item: CartItem }) => {
  const router = useRouter();
  const handleAddToCart = async () => {
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
  };
  return (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      <Plus />
      加入购物车
    </Button>
  );
};

export default AddToCart;
