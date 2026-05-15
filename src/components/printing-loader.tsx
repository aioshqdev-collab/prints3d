"use client";

import { cn } from "@/lib/utils";

export function PrintingLoader({ className, label = "Loading..." }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-live="polite">
      <div className="relative h-24 w-32">
        <div className="absolute left-2 right-2 top-3 h-2 rounded-full bg-zinc-800" />
        <div className="absolute left-5 top-3 h-16 w-2 rounded-full bg-zinc-700" />
        <div className="absolute right-5 top-3 h-16 w-2 rounded-full bg-zinc-700" />
        <div className="absolute bottom-4 left-3 right-3 h-3 rounded-md bg-zinc-900" />
        <div className="printer-head absolute left-1/2 top-5 h-8 w-11 -translate-x-1/2 rounded-md bg-zinc-950 shadow-lg">
          <div className="absolute left-1/2 top-8 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[13px] border-x-transparent border-t-amber-500" />
        </div>
        <div className="absolute bottom-7 left-1/2 h-8 w-16 -translate-x-1/2 overflow-hidden rounded-md border border-emerald-700 bg-emerald-100">
          <div className="print-fill absolute bottom-0 left-0 right-0 bg-emerald-500" />
          <div className="absolute inset-x-2 bottom-3 h-1 rounded-full bg-emerald-300" />
        </div>
        <div className="print-line absolute left-1/2 top-[52px] h-7 w-0.5 -translate-x-1/2 bg-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-800">{label}</p>
      <style jsx>{`
        .printer-head {
          animation: head-sweep 1.35s ease-in-out infinite;
        }

        .print-fill {
          height: 0%;
          animation: print-build 1.35s ease-in-out infinite;
        }

        .print-line {
          animation: line-pulse 1.35s ease-in-out infinite;
        }

        @keyframes head-sweep {
          0%,
          100% {
            transform: translateX(-44px);
          }
          50% {
            transform: translateX(12px);
          }
        }

        @keyframes print-build {
          0% {
            height: 18%;
          }
          60% {
            height: 82%;
          }
          100% {
            height: 18%;
          }
        }

        @keyframes line-pulse {
          0%,
          100% {
            opacity: 0.25;
            height: 14px;
          }
          50% {
            opacity: 1;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}

export function PrintingLoaderOverlay({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-white/85 backdrop-blur-sm">
      <div className="rounded-lg border border-zinc-200 bg-white px-8 py-6 shadow-sm">
        <PrintingLoader label={label} />
      </div>
    </div>
  );
}
