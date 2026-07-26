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
