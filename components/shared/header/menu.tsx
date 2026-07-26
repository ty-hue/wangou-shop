import React from "react";
import ModeToggle from "./mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EllipsisVertical, ShoppingCart, UserIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Menu = () => {
  return (
    <div className="flex justify-end gap-3">
      <nav className="hidden md:flex w-full max-w-xs gap-1">
        <ModeToggle />
        <Button variant="ghost" asChild>
          <Link href="/cart">
            <ShoppingCart />
            购物车
          </Link>
        </Button>
        <Button asChild>
          <Link href="/sign-in">
            <UserIcon />
            登录
          </Link>
        </Button>
      </nav>
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="align-middle">
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className="flex flex-col items-start p-4">
            <SheetTitle>菜单</SheetTitle>
            <ModeToggle />
            <Button asChild variant="ghost">
              <Link href="/cart">
                <ShoppingCart />
                购物车
              </Link>
            </Button>
            <Button asChild>
              <Link href="/sign-in">
                <UserIcon />
                登录
              </Link>
            </Button>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
