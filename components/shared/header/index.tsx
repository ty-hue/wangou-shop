import Link from "next/link";
import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

import Menu from "./menu";
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
        <Menu />
      </div>
    </div>
  );
};

export default Header;
