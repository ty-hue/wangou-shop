import { SERVER_URL } from "@/lib/constants";
import React from "react";
import ProductList from "@/components/shared/product/product-list";
import { getLatestProducts } from "@/lib/actions/product-actions";
export const metadata = {
  title: "首页",
  description: "商城的首页，展示许多丰富的内容",
  metadataBase: new URL(SERVER_URL),
};
const HomePage = async () => {
  const products = await getLatestProducts();
  return (
    <>
      <ProductList data={products} title="商品列表" />
    </>
  );
};

export default HomePage;
