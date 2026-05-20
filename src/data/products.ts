export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  material: string;
  color: string;
  leadTime: string;
  description: string;
  availability: "preprinted" | "print-on-order";
  stock: number;
};

export const products: Product[] = [
  {
    id: "desk-organizer-grid",
    name: "Modular Desk Organizer",
    category: "Workspace",
    price: 649,
    material: "PLA+",
    color: "Graphite",
    leadTime: "Ready to ship",
    description: "Interlocking trays for tools, stationery, and small electronics.",
    availability: "preprinted",
    stock: 7,
  },
  {
    id: "camera-mount-arm",
    name: "Adjustable Camera Mount",
    category: "Creator Gear",
    price: 899,
    material: "PETG",
    color: "Matte Black",
    leadTime: "2 days",
    description: "A rugged mount with heat-safe PETG construction and brass inserts.",
    availability: "print-on-order",
    stock: 0,
  },
  {
    id: "plant-wall-clips",
    name: "Plant Wall Clip Set",
    category: "Home",
    price: 349,
    material: "PLA",
    color: "Moss",
    leadTime: "Ready to ship",
    description: "Low-profile clips for vine support, cable routing, or light decor.",
    availability: "preprinted",
    stock: 14,
  },
  {
    id: "prototype-enclosure",
    name: "Electronics Enclosure",
    category: "Prototyping",
    price: 1199,
    material: "ABS",
    color: "White",
    leadTime: "3 days",
    description: "Ventilated enclosure with standoff posts for custom PCB projects.",
    availability: "print-on-order",
    stock: 0,
  },
  {
    id: "rc-spacer-kit",
    name: "RC Spacer Kit",
    category: "Mechanical",
    price: 499,
    material: "Nylon",
    color: "Natural",
    leadTime: "2 days",
    description: "Assorted lightweight spacers for drones, RC cars, and repairs.",
    availability: "print-on-order",
    stock: 0,
  },
  {
    id: "miniature-display-riser",
    name: "Miniature Display Riser",
    category: "Display",
    price: 749,
    material: "PLA Silk",
    color: "Copper",
    leadTime: "Ready to ship",
    description: "Tiered display base for collectibles, models, and product samples.",
    availability: "preprinted",
    stock: 4,
  },
];

export const preprintedProducts = products.filter((product) => product.availability === "preprinted");
export const printOnOrderProducts = products.filter((product) => product.availability === "print-on-order");

export const filamentRates: Record<string, number> = {
  PLA: 2.4,
  "PLA+": 2.8,
  PETG: 3.2,
  ABS: 3.6,
  Nylon: 5.4,
};

export const colors = ["Graphite", "White", "Signal Red", "Moss", "Copper", "Custom"];
