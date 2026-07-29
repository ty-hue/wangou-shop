import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutUser } from "@/lib/actions/user-actions";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const UserButton = async () => {
  const session = await auth();
  if (!session)
    return (
      <Button asChild>
        <Link href="/sign-in" className="flex items-center">
          <UserIcon />
          登录/注册
        </Link>
      </Button>
    );
  const firstInitail = session.user?.name?.charAt(0).toUpperCase() ?? "U";
  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200"
            >
              {firstInitail}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 align-end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium leading-none">
              {session.user?.name}
            </div>
            <div className="text-sm text-muted-foreground leading-none">
              {session.user?.email}
            </div>
          </DropdownMenuLabel>
          <div className="p-0 mb-1">
            <form action={signOutUser}>
              <Button
                className="w-full py-4 px-2 h-4 justify-start"
                variant="ghost"
                type="submit"
              >
                退出登录
              </Button>
            </form>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
