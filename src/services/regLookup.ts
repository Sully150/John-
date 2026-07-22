/**
 * Reg Lookup Service
 *
 * Currently returns mock data based on Irish reg format.
 * Structure the response to match Cartell.ie API shape so swapping
 * is trivial: just replace this module's fetch implementation.
 *
 * Irish reg format: YY-CC-SSSSSS (e.g. 12-D-123456) or YY-CCC-SSSS (e.g. 221-D-12345)
 * - YY: Year (12 = 2012, 22 = 2022, 221 = first half 2022)
 * - CC/CCC: County code
 * - SSSSSS/SSSS: Sequence number
 */

import type { VehicleDetails } from "./types";

// County code → county name mapping (common Irish reg county codes)
const COUNTY_MAP: Record<string, string> = {
  C: "Cork",
  CE: "Clare",
  CN: "Cavan",
  CW: "Carlow",
  D: "Dublin",
  DL: "Donegal",
  G: "Galway",
  KE: "Kildare",
  KK: "Kilkenny",
  KY: "Kerry",
  L: "Limerick",
  LD: "Longford",
  LH: "Louth",
  LM: "Leitrim",
  LS: "Laois",
  MH: "Meath",
  MN: "Monaghan",
  MO: "Mayo",
  OY: "Offaly",
  RN: "Roscommon",
  SO: "Sligo",
  T: "Tipperary",
  W: "Waterford",
  WH: "Westmeath",
  WW: "Wicklow",
  WX: "Wexford",
};

// Common Irish car makes and models for realistic mock data
const MOCK_MAKES: Array<{ make: string; models: string[] }> = [
  {
    make: "Volkswagen",
    models: ["Golf", "Passat", "Polo", "Tiguan", "T-Roc", "ID.4"],
  },
  { make: "Toyota", models: ["Corolla", "Yaris", "RAV4", "C-HR", "Auris"] },
  { make: "Hyundai", models: ["Tucson", "i30", "Kona", "Ioniq", "Santa Fe"] },
  { make: "Ford", models: ["Focus", "Fiesta", "Kuga", "Puma", "Mondeo"] },
  {
    make: "BMW",
    models: ["3 Series", "5 Series", "X3", "X5", "1 Series", "4 Series"],
  },
  { make: "Audi", models: ["A3", "A4", "A6", "Q3", "Q5", "e-tron"] },
  { make: "Mercedes-Benz", models: ["C-Class", "E-Class", "A-Class", "GLC"] },
  { make: "Skoda", models: ["Octavia", "Superb", "Kodiaq", "Karoq", "Fabia"] },
  { make: "Kia", models: ["Sportage", "Niro", "Ceed", "Sorento", "EV6"] },
  { make: "Nissan", models: ["Qashqai", "Juke", "Leaf", "Micra", "X-Trail"] },
];

// Irish colour distribution weights
const COLOURS = [
  { colour: "Silver", weight: 18 },
  { colour: "Grey", weight: 16 },
  { colour: "Black", weight: 15 },
  { colour: "White", weight: 14 },
  { colour: "Blue", weight: 12 },
  { colour: "Red", weight: 10 },
  { colour: "Navy", weight: 8 },
  { colour: "Green", weight: 3 },
  { colour: "Beige", weight: 2 },
  { colour: "Burgundy", weight: 2 },
];

function weightedRandom<T>(items: T[], weightFn: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + weightFn(item), 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[0];
}

/** Deterministic-ish hash for consistent results per reg */
function hashReg(reg: string): number {
  let hash = 0;
  for (let i = 0; i < reg.length; i++) {
    hash = ((hash * 31 + reg.charCodeAt(i)) | 0) >>> 0;
  }
  return hash % 2147483646;
}

/** Seeded PRNG for deterministic results — uses BigInt to avoid overflow */
function seededRandom(seed: number): () => number {
  let s = BigInt(Math.abs(seed) % 2147483646);
  const MOD = 2147483647n;
  const MULT = 16807n;
  return () => {
    s = (s * MULT) % MOD;
    return Number(s) / 2147483647;
  };
}

/** Parse year from Irish reg */
function parseYear(yearStr: string): number {
  const yy = parseInt(yearStr, 10);
  // 3-digit year: first two digits = year, last digit = half (1 or 2)
  // e.g. 211 → 2021, 212 → 2021, 221 → 2022
  if (yy >= 100) {
    return 2000 + Math.floor(yy / 10);
  }
  // 2-digit year: < 50 → 20xx, >= 50 → 19xx
  // e.g. 12 → 2012, 99 → 1999, 03 → 2003
  return yy >= 50 ? 1900 + yy : 2000 + yy;
}

/** Validate Irish reg format */
function isValidReg(reg: string): boolean {
  const cleaned = reg.replace(/\s+/g, "").toUpperCase();
  return /^\d{2,3}-?[A-Z]{1,3}-?\d{4,6}$/.test(cleaned);
}

/** Normalise reg to standard format */
function normaliseReg(reg: string): string {
  const cleaned = reg.replace(/\s+/g, "").toUpperCase();
  const parts = cleaned.match(/^(\d{2,3})([A-Z]{1,3})(\d{4,6})$/);
  if (!parts) throw new Error("Invalid registration format");
  return `${parts[1]}-${parts[2]}-${parts[3]}`;
}

function dateAddDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatIrishDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Mock reg lookup — returns realistic vehicle data.
 *
 * SWAP INSTRUCTIONS:
 * Replace this function's body with a fetch to Cartell.ie API:
 *   POST https://api.cartell.ie/v2/vehicle/lookup
 *   Headers: { Authorization: "Bearer <key>", Content-Type: "application/json" }
 *   Body: { registration: "12-D-123456" }
 * Map the Cartell response fields to the VehicleDetails interface.
 */
export async function lookupReg(
  registration: string,
): Promise<VehicleDetails> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  if (!isValidReg(registration)) {
    throw new Error(
      "Invalid Irish registration format. Expected: YY-CC-SSSSSS or YY-CCC-SSSS",
    );
  }

  const reg = normaliseReg(registration);
  const seed = hashReg(reg);
  const rng = seededRandom(seed);

  const parts = reg.split("-");
  const year = parseYear(parts[0]);
  const countyCode = parts[1];
  // COUNTY_MAP lookup for future use (county-based market adjustments)
  void (COUNTY_MAP[countyCode] || "Unknown");

  // Pick make/model deterministically
  const makeIdx = Math.floor(rng() * MOCK_MAKES.length);
  const makeData = MOCK_MAKES[makeIdx];
  const modelIdx = Math.floor(rng() * makeData.models.length);
  const model = makeData.models[modelIdx];

  // Engine: weighted towards efficient engines for newer cars
  const engineOptions =
    year >= 2020
      ? [
          "1.0 TSI",
          "1.5 TSI",
          "1.6 TDI",
          "2.0 TDI",
          "1.5 eTSI",
          "Electric",
          "1.6 Hybrid",
        ]
      : year >= 2015
        ? [
            "1.2 TSI",
            "1.4 TSI",
            "1.6 TDI",
            "2.0 TDI",
            "1.0 EcoBoost",
            "1.5 dCi",
          ]
        : [
            "1.4 TSI",
            "1.6 TDI",
            "2.0 TDI",
            "1.6 Petrol",
            "1.8 TDI",
            "2.0 Petrol",
          ];

  const engine = engineOptions[Math.floor(rng() * engineOptions.length)];
  const fuelType = engine.toLowerCase().includes("d")
    ? "Diesel"
    : engine.toLowerCase().includes("electric") || engine.toLowerCase().includes("hybrid")
      ? engine.includes("Hybrid") ? "Petrol Hybrid" : "Electric"
      : "Petrol";

  const colourData = weightedRandom(COLOURS, (c) => c.weight);
  const bodyTypes = ["Hatchback", "Saloon", "Estate", "SUV", "Coupe", "MPV"];
  const bodyType = bodyTypes[Math.floor(rng() * bodyTypes.length)];
  const transmissions = ["Manual", "Automatic", "Automatic", "Automatic"]; // bias towards auto for newer
  const transmission = transmissions[Math.floor(rng() * transmissions.length)];

  // Mileage: roughly 15,000 km/year with some variance
  const carAge = new Date().getFullYear() - year;
  const mileage = Math.round(
    carAge * 15000 + rng() * 30000 - 15000 + 15000,
  );

  // NCT: cars over 4 years need NCT
  const nctDueDays = carAge < 4 ? 365 * (4 - carAge) : rng() * 365 - 180;
  const nctStatus = nctDueDays < 0 ? "Expired" : nctDueDays < 90 ? "Due Soon" : "Valid";
  const nctDueDate = nctDueDays > 0 ? dateAddDays(Math.floor(nctDueDays)) : dateAddDays(Math.floor(nctDueDays));

  const taxDueDays = Math.floor(rng() * 365);
  const taxStatus = taxDueDays < 30 ? "Due Soon" : "Taxed";
  const taxDueDate = dateAddDays(taxDueDays);

  const co2Options = [98, 109, 115, 121, 129, 139, 145, 156, 168, 180];
  const co2Emissions = co2Options[Math.floor(rng() * co2Options.length)];

  return {
    registration: reg,
    make: makeData.make,
    model,
    year,
    engine,
    colour: colourData.colour,
    bodyType,
    taxStatus,
    taxDueDate: formatIrishDate(taxDueDate),
    nctStatus,
    nctDueDate: formatIrishDate(nctDueDate),
    co2Emissions,
    fuelType,
    transmission,
    mileage,
  };
}
