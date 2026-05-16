import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="text-lg font-semibold">Prints3D</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">
            Kerala-wide delivery for custom and catalogue 3D printed parts. India-wide delivery
            coming soon.
          </p>
        </div>
        <div className="space-y-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-300" /> 7907581773
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-300" /> aios.hq.dev@gmail.com
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-300" /> Currently Kerala-wide delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
