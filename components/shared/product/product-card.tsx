import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import ProductPrice from "./product-price";
import { Product } from "@/types";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="p-0 items-center">
          <Link href={`/product/${product.id}`}>
            <Image
              src={product.images[0]}
              alt={product.slug}
              width={300}
              height={300}
              priority
            />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        <div className="text-xs">{product.brand}</div>
        <Link href={`/product/${product.id}`}>
          <h2 className="text-sm font-medium ">{product.slug}</h2>
        </Link>
        <div className="flex-between gap-4">
          <p>{product.rating} 星</p>
          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} />
          ) : (
            <p className="text-destructive">已售罄</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default ProductCard;
