import Link from "next/link";
import { ArrowRight, BadgeCheck, Box, Clock3, PackageCheck, Upload } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { ProductGrid } from "@/components/catalogue/product-card";
import { HeroPrinterScene } from "@/components/three/hero-printer-scene";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              Custom 3D printing and ready parts
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
              Prints3D turns your STL files into clean, usable parts.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Upload a model for instant print estimates, choose material and finish, or shop a
              catalogue of practical 3D printed parts ready for delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/custom-print">
                  <Upload className="h-5 w-5" />
                  Upload STL
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/catalogue">
                  Browse catalogue
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Fast quotes", Clock3],
                ["Material choice", Box],
                ["Tracked delivery", PackageCheck],
              ].map(([label, Icon]) => (
                <div key={String(label)} className="flex items-center gap-2 text-sm text-zinc-700">
                  <Icon className="h-5 w-5 text-emerald-600" />
                  {String(label)}
                </div>
              ))}
            </div>
          </div>
          <HeroPrinterScene />
        </div>
      </section>

      <section id="intro" className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            ["Upload or choose", "Send your STL file, or pick from ready-made practical parts."],
            ["Tune the print", "Select filament, color, quantity, infill, and print quality."],
            ["Track the order", "Admin-ready order data covers customer, shipping, payment, and STL file links."],
          ].map(([title, body]) => (
            <div key={title}>
              <BadgeCheck className="h-7 w-7 text-emerald-600" />
              <h2 className="mt-4 text-xl font-semibold text-zinc-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              Custom print section
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950">Upload once. Price clearly.</h2>
            <p className="mt-4 text-zinc-600">
              The custom flow previews STL files in 3D and estimates cost from file size, material,
              infill, print quality, electricity, shipping, and quantity.
            </p>
            <Button asChild className="mt-6" variant="dark">
              <Link href="/custom-print">Start custom order</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["PLA+ prototypes", "PETG functional parts", "ABS enclosures", "Nylon mechanical kits"].map(
              (item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                  <p className="font-semibold text-zinc-950">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Tuned for strength, finish, and delivery speed.
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                Catalogue section
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-zinc-950">Preprinted parts</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/catalogue">View all products</Link>
            </Button>
          </div>
          <ProductGrid limit={3} />
        </div>
      </section>

      <section id="contact" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              Contact section
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950">Need a quote before ordering?</h2>
            <p className="mt-4 text-zinc-600">
              Send your use case, deadline, and material preference. We can help tune orientation,
              strength, and finish before printing.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
