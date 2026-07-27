import React from "react";
import { getProductById } from "@/lib/actions/product-actions";
import { notFound } from "next/navigation";
import ProductPrice from "@/components/shared/product/product-price";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProdcutImages from "@/components/shared/product/product-images";

const ProductDetailPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) {
    return notFound();
  }
  return (
    <>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* 商品图片 */}
          <div className="col-span-2">
            <ProdcutImages images={product.images} />
          </div>
          {/* 商品信息 */}
          <div className="col-span-2 p-5">
            <div className="flex flex-col gap-6">
              <p>
                {product.brand} {product.category}
              </p>
              <h1 className="h3-bold">{product.name}</h1>
              <p>
                {product.rating} of {product.numReviews} Reviews
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <ProductPrice
                  value={Number(product.price)}
                  className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
                />
              </div>
            </div>
            <div className="mt-10">
              <p className="font-semibold">Description</p>
              <p>{product.description}</p>
            </div>
          </div>
          {/* 操作 */}
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex justify-between">
                  <div>Price</div>
                  <div>
                    <ProductPrice value={Number(product.price)} />
                  </div>
                </div>
                <div className="mb-2 flex justify-between">
                  <div>库存</div>
                  {product.stock > 0 ? (
                    <Badge variant="outline">有库存</Badge>
                  ) : (
                    <Badge variant="destructive">无库存</Badge>
                  )}
                </div>
                {product.stock > 0 && (
                  <div className="flex-center">
                    <Button className="w-full">加入购物车</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductDetailPage;
