import { filamentRates } from "@/data/products";

export type QuoteInput = {
  fileSizeMb: number;
  filament: keyof typeof filamentRates | string;
  infill: number;
  quality: "draft" | "standard" | "fine";
  quantity: number;
  shipping: "pickup" | "standard" | "express";
};

const qualityMultiplier = {
  draft: 0.85,
  standard: 1,
  fine: 1.35,
};

const shippingPrice = {
  pickup: 0,
  standard: 120,
  express: 260,
};

export function calculateQuote(input: QuoteInput) {
  const normalizedSize = Math.max(input.fileSizeMb, 0.5);
  const estimatedGrams = Math.ceil(normalizedSize * 7.5 + input.infill * 1.8);
  const materialRate = filamentRates[input.filament] ?? filamentRates.PLA;
  const materialCost = estimatedGrams * materialRate;
  const machineHours = Math.max(1, estimatedGrams / 18) * qualityMultiplier[input.quality];
  const electricityCost = machineHours * 18;
  const setupCost = 149;
  const finishingCost = input.quality === "fine" ? 120 : 55;
  const subtotal =
    (materialCost + electricityCost + setupCost + finishingCost) * Math.max(input.quantity, 1);
  const shippingCost = shippingPrice[input.shipping];
  const platformBuffer = subtotal * 0.08;
  const total = Math.ceil(subtotal + shippingCost + platformBuffer);

  return {
    estimatedGrams,
    machineHours: Number(machineHours.toFixed(1)),
    materialCost: Math.ceil(materialCost),
    electricityCost: Math.ceil(electricityCost),
    shippingCost,
    total,
  };
}
