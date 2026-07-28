"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDefaultValues } from "@/lib/constants";
import Link from "next/link";
import React from "react";
import { SiGithub, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithCredentials } from "@/lib/actions/user-actions";
const CredentialsSignInForm = () => {
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: "",
  });
  const SignButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button
        className="w-full py-4 md:py-5"
        variant="default"
        disabled={pending}
      >
        {pending ? "登录中..." : "登录"}
      </Button>
    );
  };
  return (
    <form className="space-y-6" action={action}>
      <div>
        <Label htmlFor="email" className="mb-2">
          邮箱
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={signInDefaultValues.email}
        />
      </div>
      <div>
        <Label htmlFor="password" className="mb-2">
          密码
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="password"
          defaultValue={signInDefaultValues.password}
        />
      </div>
      <SignButton />
      {data && !data.success && (
        <div className="text-center text-destructive text-sm">
          {data.message}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          其他方式登录
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in/google">
              <SiGoogle className="w-8 h-8" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/sign-in/github">
              <SiGithub className="w-8 h-8" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/sign-in/twitter">
              <SiX className="w-8 h-8" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground">
        还没有账号？
        <Link href="/sign-up" target="_self" className="text-destructive/50">
          注册
        </Link>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
