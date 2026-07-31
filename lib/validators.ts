import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

// 商品价格验证器
const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
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

// 购物车单个商品验证器
export const cartItemSchema = z.object({
  productId: z.string().min(1, "商品ID不能为空"),
  name: z.string().min(1, "商品名称不能为空"),
  slug: z.string().min(1, "商品slug不能为空"),
  qty: z.number().int().nonnegative("数量必须是一个正数"),
  image: z.string().min(1, "商品图片不能为空"),
  price: currency,
});

// 购物车验证器
export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  sessionCartId: z.string().min(1, "购物车ID不能小于1个字符"),
  userId: z.string().optional().nullable(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "姓名不能小于3个字符"),
  streetAddress: z.string().min(3, "街道地址不能小于3个字符"),
  city: z.string().min(3, "城市不能小于3个字符"),
  postalCode: z.string().min(3, "邮政编码不能小于3个字符"),
  country: z.string().min(3, "国家不能小于3个字符"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
