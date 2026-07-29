"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpDefaultValues } from "@/lib/constants";
import Link from "next/link";
import React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpUser } from "@/lib/actions/user-actions";
import { useSearchParams } from "next/navigation";

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: "",
  });
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const SignButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button
        className="w-full py-4 md:py-5"
        variant="default"
        disabled={pending}
      >
        {pending ? "注册中..." : "注册"}
      </Button>
    );
  };
  return (
    <form className="space-y-6" action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="name" className="mb-2">
          昵称
        </Label>
        <Input
          id="name"
          type="text"
          name="name"
          required
          autoComplete="name"
          defaultValue={signUpDefaultValues.name}
        />
      </div>
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
          defaultValue={signUpDefaultValues.email}
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
          defaultValue={signUpDefaultValues.password}
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="mb-2">
          确认密码
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          autoComplete="confirmPassword"
          defaultValue={signUpDefaultValues.confirmPassword}
        />
      </div>
      <SignButton />
      {data && !data.success && (
        <div className="text-center text-destructive text-sm">
          {data.message}
        </div>
      )}
      <div className="text-center text-sm text-muted-foreground">
        已有账号？
        <Link href="/sign-in" target="_self" className="text-destructive/50">
          登录
        </Link>
      </div>
    </form>
  );
};

export default SignUpForm;
