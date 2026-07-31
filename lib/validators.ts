import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";

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
  fullName: z.string().min(2, "姓名不能小于2个字符"),
  streetAddress: z.string().min(2, "街道地址不能小于2个字符"),
  city: z.string().min(2, "城市不能小于2个字符"),
  postalCode: z.string().min(3, "邮政编码不能小于3个字符"),
  country: z.string().min(2, "国家不能小于2个字符"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, "支付方式不能为空"),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    message: "暂不支持该支付方式",
    path: ["type"],
  });

// Insert Order Schema
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User is required"), // Defines the 'userId' field as a non-empty string with a custom error message if it's empty.
  itemsPrice: currency, // Defines the 'itemsPrice' field and uses a predefined schema for currency validation.
  shippingPrice: currency, // Defines the 'shippingPrice' field and uses a predefined schema for currency validation.
  taxPrice: currency, // Defines the 'taxPrice' field and uses a predefined schema for currency validation.
  totalPrice: currency, // Defines the 'totalPrice' field and uses a predefined schema for currency validation.

  // Defines the 'paymentMethod' field as a string.
  // The refine method adds custom validation to ensure the value is included in the PAYMENT_METHODS array.
  // If the value is not valid, a custom error message "Invalid payment method" is returned.
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: "Invalid payment method",
  }),
  shippingAddress: shippingAddressSchema, // Defines the 'shippingAddress' field and uses a predefined schema for address validation.
});

// Insert Order Item Schema
export const insertOrderItemSchema = z.object({
  productId: z.string(), // Defines the 'productId' field as a string.
  slug: z.string(), // Defines the 'slug' field as a string.
  image: z.string(), // Defines the 'image' field as a string.
  name: z.string(), // Defines the 'name' field as a string.
  price: currency, // Defines the 'price' field and uses a predefined schema for currency validation.
  qty: z.number(), // Defines the 'qty' field as a number.
});

export const paymentResultSchema = z.object({
  id: z.string(), // Defines the 'id' field as a string.
  status: z.string(), // Defines the 'status' field as a string.
  email_address: z.string(), // Defines the 'email_address' field as a string.
  pricePaid: z.string(), // Defines the 'pricePaid' field as a string.
});
