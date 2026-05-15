import { PrintingLoader } from "@/components/printing-loader";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="rounded-lg border border-zinc-200 bg-white px-8 py-6 shadow-sm">
        <PrintingLoader />
      </div>
    </div>
  );
}
