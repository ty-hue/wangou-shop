"use client";
import { ShippingAddress } from "@/types";
import React from "react";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validators";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { updateUserAddress } from "@/lib/actions/user-actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader } from "lucide-react";
const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: address || shippingAddressDefaultValues,
  });
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (
    data,
  ) => {
    startTransition(async () => {
      const { success, message } = await updateUserAddress(data);
      if (success) {
        toast.success(message);
        router.push("/payment-method");
      } else {
        toast.error(message);
      }
    });
  };
  return (
    <>
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="h2-bold mt-4">收货地址</h2>
        <p className="text-sm text-muted-foreground">请填写您的收货地址</p>
        <Form {...form}>
          <form
            method="post"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>收获人姓名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入收获人姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>所属街道</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入所属街道" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>所属城市</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入所属城市" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>邮政编码</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入邮政编码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>所属国家</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入所属国家" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader className=" w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className=" w-4 h-4" />
                )}
                继续
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ShippingAddressForm;
