import Link from "next/link";
import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { ShoppingCart, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
const Header = () => {
  return (
    <div className="w-full border-b">
      <div className="wrapper flex-between">
        <div className="flex-start">
          <Link href="/" className="flex-start">
            <Image
              src="/images/logo.svg"
              alt={`${APP_NAME} logo}`}
              width={48}
              height={48}
              priority
            />
            <span className="hidden lg:block text-2xl font-bold ml-3">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div className="flex-start space-x-2">
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
        </div>
      </div>
    </div>
  );
};

export default Header;
