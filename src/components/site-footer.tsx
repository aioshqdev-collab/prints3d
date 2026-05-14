import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold">Prints3D</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">
            Custom prototypes, useful printed parts, and small-batch production with fast quote
            turnaround.
          </p>
        </div>
        <div className="space-y-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-300" /> +91 98765 43210
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-300" /> orders@prints3d.example
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-300" /> India-wide delivery
          </p>
        </div>
        <div className="flex gap-4 text-sm text-zinc-300 md:justify-end">
          <Link href="/custom-print" className="hover:text-white">
            Upload STL
          </Link>
          <Link href="/catalogue" className="hover:text-white">
            Shop parts
          </Link>
          <Link href="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
