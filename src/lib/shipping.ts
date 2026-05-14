import "server-only";

type PincodeZone = {
  prefix: string;
  district: string;
  lat: number;
  lng: number;
};

export type ShippingQuote =
  | {
      allowed: true;
      pincode: string;
      district: string;
      origin: string;
      distanceKm: number;
      charge: number;
    }
  | {
      allowed: false;
      reason: string;
    };

const origin = {
  name: "Tripunithura, Ernakulam",
  lat: 9.943,
  lng: 76.349,
};

const keralaZones: PincodeZone[] = [
  { prefix: "670", district: "Kannur", lat: 11.874, lng: 75.37 },
  { prefix: "671", district: "Kasaragod", lat: 12.5, lng: 75.0 },
  { prefix: "673", district: "Kozhikode / Wayanad", lat: 11.258, lng: 75.78 },
  { prefix: "674", district: "Kozhikode", lat: 11.25, lng: 75.88 },
  { prefix: "675", district: "Malappuram", lat: 11.05, lng: 76.08 },
  { prefix: "676", district: "Malappuram", lat: 10.98, lng: 76.1 },
  { prefix: "678", district: "Palakkad", lat: 10.786, lng: 76.654 },
  { prefix: "679", district: "Palakkad / Malappuram", lat: 10.77, lng: 76.28 },
  { prefix: "680", district: "Thrissur", lat: 10.527, lng: 76.214 },
  { prefix: "681", district: "Thrissur", lat: 10.52, lng: 76.2 },
  { prefix: "682", district: "Ernakulam", lat: 9.982, lng: 76.299 },
  { prefix: "683", district: "Ernakulam", lat: 10.108, lng: 76.354 },
  { prefix: "684", district: "Ernakulam / Idukki", lat: 10.06, lng: 76.52 },
  { prefix: "685", district: "Idukki", lat: 9.85, lng: 77.05 },
  { prefix: "686", district: "Kottayam", lat: 9.592, lng: 76.522 },
  { prefix: "688", district: "Alappuzha", lat: 9.498, lng: 76.338 },
  { prefix: "689", district: "Pathanamthitta / Alappuzha", lat: 9.264, lng: 76.787 },
  { prefix: "690", district: "Alappuzha / Kollam", lat: 9.15, lng: 76.53 },
  { prefix: "691", district: "Kollam", lat: 8.893, lng: 76.614 },
  { prefix: "695", district: "Thiruvananthapuram", lat: 8.524, lng: 76.936 },
];

const defaultRemotePrefixes = ["6735", "6855", "6856"];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: typeof origin, b: PincodeZone) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function listFromEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getShippingQuote(pincode: string): ShippingQuote {
  const cleaned = pincode.trim();

  if (!/^\d{6}$/.test(cleaned)) {
    return { allowed: false, reason: "Enter a valid 6 digit pincode." };
  }

  const zone = keralaZones.find((item) => cleaned.startsWith(item.prefix));
  if (!zone) {
    return { allowed: false, reason: "We are shipping only inside Kerala right now." };
  }

  const remotePincodes = listFromEnv("REMOTE_PINCODES");
  const remotePrefixes = [...defaultRemotePrefixes, ...listFromEnv("REMOTE_PINCODE_PREFIXES")];

  if (remotePincodes.includes(cleaned) || remotePrefixes.some((prefix) => cleaned.startsWith(prefix))) {
    return {
      allowed: false,
      reason: "This pincode is currently marked as a remote area. Please contact us before ordering.",
    };
  }

  const distance = distanceKm(origin, zone);
  const charge = Math.max(80, Math.ceil((70 + distance * 1.8) / 10) * 10);

  return {
    allowed: true,
    pincode: cleaned,
    district: zone.district,
    origin: origin.name,
    distanceKm: distance,
    charge,
  };
}
