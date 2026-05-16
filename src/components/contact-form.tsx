"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { PrintingLoaderOverlay } from "@/components/printing-loader";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Unable to send enquiry.");

      setForm({ name: "", email: "", message: "" });
      setMessage("Enquiry sent. We will get back to you soon.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send enquiry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      {loading ? <PrintingLoaderOverlay label="Sending enquiry..." /> : null}
      <input
        className="h-11 rounded-md border border-zinc-300 px-3"
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        required
      />
      <input
        className="h-11 rounded-md border border-zinc-300 px-3"
        name="email"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        required
      />
      <textarea
        className="min-h-32 rounded-md border border-zinc-300 px-3 py-2"
        name="message"
        placeholder="Tell us what you want to print"
        value={form.message}
        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        required
      />
      <Button type="submit" variant="dark" disabled={loading}>
        <Send className="h-4 w-4" />
        Send enquiry
      </Button>
      {message ? (
        <p className={`text-sm ${message.startsWith("Enquiry sent") ? "text-emerald-700" : "text-red-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
