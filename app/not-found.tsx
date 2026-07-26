import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const NotFound = () => {
  return (
    <div className="flex-center flex-col h-screen w-screen">
      <Image
        src="/images/logo.svg"
        alt={`${APP_NAME} logo`}
        width={48}
        height={48}
        priority
      />
      <div className="w-1/3 p-6 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">404 Not Found</h1>
        <p className="text-destructive">
          亲, 页面不存在噢，检查一下路径是否拼写错误或已被删除。
        </p>
        <Button variant="outline" className="mt-4 ml-2">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
