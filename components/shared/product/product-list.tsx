import React from "react";
import ProductCard from "./product-card";
import { Product } from "@/types";
const ProductList = ({ data, title }: { data: Product[]; title: string }) => {
  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title}</h2>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div>暂无商品</div>
      )}
    </div>
  );
};

export default ProductList;
