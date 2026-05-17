import { ProductList } from "@/components/catalogue/product-card";
import { getCatalogueProducts } from "@/lib/catalogue-data";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const liveProducts = await getCatalogueProducts();
  const preprintedProducts = liveProducts.filter((product) => product.availability === "preprinted");
  const printOnOrderProducts = liveProducts.filter((product) => product.availability === "print-on-order");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
          Catalogue
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950">3D printed parts</h1>
        <p className="mt-4 text-zinc-600">
          Shop ready stock, or place an order for parts printed after checkout.
        </p>
      </div>
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-zinc-950">Pre printed</h2>
          <p className="mt-2 text-sm text-zinc-600">Ready stock with item counters.</p>
        </div>
        <ProductList items={preprintedProducts} />
      </section>
      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-zinc-950">Print on order</h2>
          <p className="mt-2 text-sm text-zinc-600">Made after checkout with the listed lead time.</p>
        </div>
        <ProductList items={printOnOrderProducts} />
      </section>
    </div>
  );
}
