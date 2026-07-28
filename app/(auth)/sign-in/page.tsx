import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import CredentialsSignInForm from "@/app/(auth)/sign-in/credentials-signin-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
export const metadata = {
  title: "登录",
};
const SignInPage = async () => {
  const session = await auth();
  if (session) {
    redirect("/");
  }
  return (
    <div className="h-screen flex-center p-8">
      <Card className="w-full p-8 md:max-w-sm">
        <CardHeader className="flex justify-center">
          <Image
            src="/images/logo.svg"
            alt={`${APP_NAME} logo`}
            width={80}
            height={80}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <h1 className="text-center font-bold text-2xl">登录</h1>
          <p className="text-center text-sm text-gray-500">
            登录即可进入{APP_NAME}
          </p>
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
