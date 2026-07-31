import { z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  paymentResultSchema,
} from "@/lib/validators";

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: number;
  numReviews: number;
  createdAt: Date;
};

export type Cart = z.infer<typeof insertCartSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export type OrderItem = z.infer<typeof insertOrderItemSchema>;

// Defines a TypeScript type 'Order' based on the Zod schema 'insertOrderSchema' and extends it with additional fields.
export type Order = z.infer<typeof insertOrderSchema> & {
  id: string; // Adds an 'id' field of type string to the Order type.
  createdAt: Date; // Adds a 'createdAt' field of type Date to the Order type.
  isPaid: boolean; // Adds an 'isPaid' field of type boolean to the Order type.
  paidAt: Date | null; // Adds a 'paidAt' field of type Date or null to the Order type.
  isDelivered: boolean; // Adds an 'isDelivered' field of type boolean to the Order type.
  deliveredAt: Date | null; // Adds a 'deliveredAt' field of type Date or null to the Order type.
  orderitems: OrderItem[]; // Adds an 'orderitems' field which is an array of OrderItem type to the Order type.
  user: { name: string; email: string }; // Adds a 'user' field which is an object containing 'name' and 'email' fields of type string to the Order type.
  paymentResult: PaymentResult;
};

export type PaymentResult = z.infer<typeof paymentResultSchema>;
