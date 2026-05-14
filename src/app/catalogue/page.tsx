import { ProductGrid } from "@/components/catalogue/product-card";

export default function CataloguePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
          Ready-made catalogue
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Preprinted 3D parts</h1>
        <p className="mt-4 text-zinc-600">
          Useful, tested parts for makers, homes, workspaces, creator gear, and prototyping.
        </p>
      </div>
      <ProductGrid />
    </div>
  );
}
