import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

// 商品价格验证器
const currency = z
  .string()
  .refine(
    (value) => /^\d(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    "商品价格必须精确为两位小数",
  );

export const insertProductSchema = z.object({
  name: z.string().min(3, "商品名称不能小于3个字符"),
  slug: z.string().min(3, "商品slug不能小于3个字符"),
  category: z.string().min(3, "商品分类不能小于3个字符"),
  brand: z.string().min(3, "商品品牌不能小于3个字符"),
  description: z.string().min(3, "商品描述不能小于3个字符"),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, "商品上传图片不能为空"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

export const signInFormSchema = z.object({
  email: z.string().email("请输入正确的邮箱格式"),
  password: z.string().min(6, "密码不能小于6个字符"),
});

export const signUpFormSchema = z
  .object({
    name: z.string().min(3, "用户名不能小于3个字符"),
    email: z.string().email("请输入正确的邮箱格式"),
    password: z.string().min(6, "密码不能小于6个字符"),
    confirmPassword: z.string().min(6, "确认密码不能小于6个字符"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入密码不一致",
    path: ["confirmPassword"],
  });
