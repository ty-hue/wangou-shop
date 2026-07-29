"use server";

import { signInFormSchema } from "@/lib/validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// 邮箱密码登录
export async function signInWithCredentials(
  preState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", {
      ...user,
      redirectTo: (formData.get("callbackUrl") as string) || "/",
    });
    return { success: true, message: "登录成功" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: "登录失败，邮箱或密码错误" };
  }
}

// 退出登录
export async function signOutUser() {
  await signOut();
}
