import type { Product } from "@/data/products";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "catalogue" | "custom";
  image?: string;
  meta?: Record<string, string | number>;
};

export function productToCartItem(product: Product): CartItem {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    type: "catalogue",
    meta: {
      material: product.material,
      color: product.color,
    },
  };
}
