/**
 * Valuation Service
 *
 * Computes a trade-in valuation from vehicle details and condition report.
 * Uses Irish market reference data (mock values for MVP).
 *
 * SWAP INSTRUCTIONS:
 * When Cartell API key is available, replace `getBaseMarketValue` with
 * a call to Cartell Car Value API. The condition adjustment logic can stay
 * the same or be refined with real market depreciation data.
 */

import type { ConditionReport, ValuationResult, VehicleDetails } from "./types";

/**
 * Irish market reference values — rough trade-in base values by make/model/year.
 * These are illustrative MVP values. Replace with Cartell Car Value API data.
 */
const MARKET_BASE: Record<string, Record<string, Record<number, number>>> = {
  Volkswagen: {
    Golf: { 2024: 28000, 2023: 25000, 2022: 22000, 2021: 18500, 2020: 16000, 2019: 13500, 2018: 11500, 2017: 9500, 2016: 8000, 2015: 6500 },
    Passat: { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21000, 2020: 18000, 2019: 15000, 2018: 12500, 2017: 10500, 2016: 8500, 2015: 7000 },
    Polo: { 2024: 19000, 2023: 17000, 2022: 15000, 2021: 13000, 2020: 11000, 2019: 9000, 2018: 7500, 2017: 6000, 2016: 5000, 2015: 4000 },
    Tiguan: { 2024: 35000, 2023: 31000, 2022: 27000, 2021: 23000, 2020: 19500, 2019: 16500, 2018: 14000, 2017: 11500, 2016: 9500, 2015: 7500 },
    "T-Roc": { 2024: 28000, 2023: 25000, 2022: 22000, 2021: 19000, 2020: 16000, 2019: 13500, 2018: 11000, 2017: 9000, 2016: 7500, 2015: 6000 },
    "ID.4": { 2024: 42000, 2023: 37000, 2022: 32000, 2021: 27000, 2020: 23000, 2019: 20000, 2018: 18000, 2017: 15000, 2016: 13000, 2015: 10000 },
  },
  Toyota: {
    Corolla: { 2024: 24000, 2023: 21500, 2022: 19000, 2021: 16500, 2020: 14000, 2019: 11500, 2018: 9500, 2017: 8000, 2016: 6500, 2015: 5500 },
    Yaris: { 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12000, 2020: 10000, 2019: 8200, 2018: 6800, 2017: 5500, 2016: 4500, 2015: 3500 },
    RAV4: { 2024: 38000, 2023: 34000, 2022: 30000, 2021: 26000, 2020: 22500, 2019: 19000, 2018: 16000, 2017: 13500, 2016: 11500, 2015: 9500 },
    "C-HR": { 2024: 30000, 2023: 27000, 2022: 24000, 2021: 20500, 2020: 17500, 2019: 14500, 2018: 12000, 2017: 9500, 2016: 8000, 2015: 6500 },
    Auris: { 2024: 0, 2023: 0, 2022: 0, 2021: 0, 2020: 12000, 2019: 10000, 2018: 8500, 2017: 7000, 2016: 5800, 2015: 4800 },
  },
  Hyundai: {
    Tucson: { 2024: 34000, 2023: 30000, 2022: 26000, 2021: 22000, 2020: 18500, 2019: 15500, 2018: 13000, 2017: 10500, 2016: 8800, 2015: 7000 },
    i30: { 2024: 22000, 2023: 19500, 2022: 17000, 2021: 14500, 2020: 12000, 2019: 9800, 2018: 8200, 2017: 6500, 2016: 5500, 2015: 4200 },
    Kona: { 2024: 28000, 2023: 25000, 2022: 22000, 2021: 19000, 2020: 16000, 2019: 13500, 2018: 11000, 2017: 9000, 2016: 7500, 2015: 6000 },
    Ioniq: { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21500, 2020: 18500, 2019: 15500, 2018: 13000, 2017: 10500, 2016: 8500, 2015: 7000 },
    "Santa Fe": { 2024: 45000, 2023: 40000, 2022: 35000, 2021: 30000, 2020: 25500, 2019: 21500, 2018: 18000, 2017: 15000, 2016: 12500, 2015: 10000 },
  },
  Ford: {
    Focus: { 2024: 24000, 2023: 21500, 2022: 19000, 2021: 16500, 2020: 14000, 2019: 11500, 2018: 9500, 2017: 7800, 2016: 6200, 2015: 5000 },
    Fiesta: { 2024: 18000, 2023: 16000, 2022: 14000, 2021: 12000, 2020: 10000, 2019: 8200, 2018: 6500, 2017: 5200, 2016: 4200, 2015: 3200 },
    Kuga: { 2024: 34000, 2023: 30000, 2022: 26000, 2021: 22000, 2020: 18500, 2019: 15500, 2018: 13000, 2017: 10500, 2016: 8500, 2015: 6800 },
    Puma: { 2024: 27000, 2023: 24000, 2022: 21000, 2021: 18000, 2020: 15000, 2019: 12500, 2018: 10500, 2017: 8500, 2016: 7000, 2015: 5500 },
    Mondeo: { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21000, 2020: 17500, 2019: 14500, 2018: 12000, 2017: 9800, 2016: 8000, 2015: 6500 },
  },
  BMW: {
    "3 Series": { 2024: 42000, 2023: 37500, 2022: 33000, 2021: 28000, 2020: 23500, 2019: 19500, 2018: 16000, 2017: 13000, 2016: 10500, 2015: 8500 },
    "5 Series": { 2024: 55000, 2023: 49000, 2022: 43000, 2021: 36000, 2020: 30000, 2019: 25000, 2018: 20500, 2017: 16500, 2016: 13500, 2015: 10500 },
    X3: { 2024: 52000, 2023: 46500, 2022: 41000, 2021: 35000, 2020: 29000, 2019: 24000, 2018: 19500, 2017: 16000, 2016: 13000, 2015: 10500 },
    X5: { 2024: 75000, 2023: 67000, 2022: 59000, 2021: 51000, 2020: 43000, 2019: 36000, 2018: 29500, 2017: 24000, 2016: 19500, 2015: 15500 },
    "1 Series": { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21000, 2020: 17500, 2019: 14500, 2018: 11800, 2017: 9500, 2016: 7800, 2015: 6200 },
    "4 Series": { 2024: 48000, 2023: 43000, 2022: 37500, 2021: 32000, 2020: 27000, 2019: 22500, 2018: 18500, 2017: 15000, 2016: 12000, 2015: 9500 },
  },
  Audi: {
    A3: { 2024: 33000, 2023: 29500, 2022: 26000, 2021: 22000, 2020: 18500, 2019: 15500, 2018: 12800, 2017: 10500, 2016: 8500, 2015: 6800 },
    A4: { 2024: 42000, 2023: 37500, 2022: 33000, 2021: 28000, 2020: 23500, 2019: 19500, 2018: 16000, 2017: 13000, 2016: 10500, 2015: 8500 },
    A6: { 2024: 55000, 2023: 49000, 2022: 43000, 2021: 36000, 2020: 30000, 2019: 25000, 2018: 20500, 2017: 16500, 2016: 13500, 2015: 10500 },
    Q3: { 2024: 38000, 2023: 34000, 2022: 30000, 2021: 25500, 2020: 21500, 2019: 18000, 2018: 14800, 2017: 11800, 2016: 9500, 2015: 7500 },
    Q5: { 2024: 52000, 2023: 46500, 2022: 41000, 2021: 35000, 2020: 29000, 2019: 24000, 2018: 19500, 2017: 16000, 2016: 13000, 2015: 10500 },
    "e-tron": { 2024: 55000, 2023: 48000, 2022: 41000, 2021: 35000, 2020: 30000, 2019: 25000, 2018: 21000, 2017: 17500, 2016: 14500, 2015: 11500 },
  },
  "Mercedes-Benz": {
    "C-Class": { 2024: 43000, 2023: 38500, 2022: 34000, 2021: 29000, 2020: 24000, 2019: 20000, 2018: 16500, 2017: 13500, 2016: 11000, 2015: 8800 },
    "E-Class": { 2024: 56000, 2023: 50000, 2022: 44000, 2021: 37000, 2020: 31000, 2019: 26000, 2018: 21500, 2017: 17500, 2016: 14000, 2015: 11000 },
    "A-Class": { 2024: 30000, 2023: 27000, 2022: 24000, 2021: 20500, 2020: 17000, 2019: 14000, 2018: 11500, 2017: 9200, 2016: 7500, 2015: 6000 },
    GLC: { 2024: 52000, 2023: 46500, 2022: 41000, 2021: 35000, 2020: 29000, 2019: 24000, 2018: 19500, 2017: 16000, 2016: 13000, 2015: 10500 },
  },
  Skoda: {
    Octavia: { 2024: 25000, 2023: 22500, 2022: 20000, 2021: 17000, 2020: 14500, 2019: 12000, 2018: 9800, 2017: 7800, 2016: 6200, 2015: 5000 },
    Superb: { 2024: 34000, 2023: 30500, 2022: 27000, 2021: 23000, 2020: 19500, 2019: 16500, 2018: 13800, 2017: 11200, 2016: 9000, 2015: 7200 },
    Kodiaq: { 2024: 42000, 2023: 37500, 2022: 33000, 2021: 28000, 2020: 23500, 2019: 19500, 2018: 16000, 2017: 13000, 2016: 10500, 2015: 8500 },
    Karoq: { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21500, 2020: 18000, 2019: 15000, 2018: 12500, 2017: 10000, 2016: 8000, 2015: 6500 },
    Fabia: { 2024: 17000, 2023: 15000, 2022: 13000, 2021: 11000, 2020: 9000, 2019: 7500, 2018: 6200, 2017: 5000, 2016: 4000, 2015: 3200 },
  },
  Kia: {
    Sportage: { 2024: 32000, 2023: 28500, 2022: 25000, 2021: 21500, 2020: 18000, 2019: 15000, 2018: 12500, 2017: 10000, 2016: 8200, 2015: 6500 },
    Niro: { 2024: 30000, 2023: 27000, 2022: 24000, 2021: 20500, 2020: 17000, 2019: 14000, 2018: 11500, 2017: 9500, 2016: 8000, 2015: 6500 },
    Ceed: { 2024: 22000, 2023: 19500, 2022: 17000, 2021: 14500, 2020: 12000, 2019: 10000, 2018: 8200, 2017: 6800, 2016: 5500, 2015: 4200 },
    Sorento: { 2024: 50000, 2023: 45000, 2022: 40000, 2021: 34000, 2020: 28500, 2019: 24000, 2018: 20000, 2017: 16500, 2016: 13500, 2015: 10500 },
    EV6: { 2024: 48000, 2023: 43000, 2022: 38000, 2021: 33000, 2020: 28000, 2019: 24000, 2018: 20000, 2017: 16500, 2016: 13500, 2015: 11000 },
  },
  Nissan: {
    Qashqai: { 2024: 30000, 2023: 27000, 2022: 24000, 2021: 20500, 2020: 17000, 2019: 14000, 2018: 11500, 2017: 9500, 2016: 7800, 2015: 6200 },
    Juke: { 2024: 22000, 2023: 19500, 2022: 17000, 2021: 14500, 2020: 12000, 2019: 10000, 2018: 8200, 2017: 6800, 2016: 5500, 2015: 4200 },
    Leaf: { 2024: 25000, 2023: 22000, 2022: 19000, 2021: 16000, 2020: 13000, 2019: 10500, 2018: 8500, 2017: 6500, 2016: 5000, 2015: 4000 },
    Micra: { 2024: 16000, 2023: 14000, 2022: 12000, 2021: 10000, 2020: 8200, 2019: 6800, 2018: 5500, 2017: 4300, 2016: 3500, 2015: 2800 },
    "X-Trail": { 2024: 36000, 2023: 32000, 2022: 28000, 2021: 24000, 2020: 20000, 2019: 16800, 2018: 14000, 2017: 11500, 2016: 9500, 2015: 7500 },
  },
};

/** Condition adjustment per panel grade (EUR) */
const CONDITION_ADJUSTMENTS: Record<string, number> = {
  Excellent: 0,
  Good: -50,
  Fair: -200,
  Poor: -500,
};

/** Overall condition multiplier */
const OVERALL_CONDITION_MULTIPLIER: Record<string, number> = {
  Excellent: 1.0,
  Good: 0.95,
  Fair: 0.88,
  Poor: 0.75,
};

/**
 * Get base market value for a vehicle.
 * Replace this with Cartell Car Value API call.
 */
function getBaseMarketValue(vehicle: VehicleDetails): number {
  const makeData = MARKET_BASE[vehicle.make];
  if (!makeData) {
    // Fallback: estimate from age
    return estimateValueFromAge(vehicle.year);
  }

  const modelData = makeData[vehicle.model];
  if (!modelData) {
    return estimateValueFromAge(vehicle.year);
  }

  // Find closest year match
  const years = Object.keys(modelData).map(Number).sort((a, b) => b - a);
  const exactYear = modelData[vehicle.year];
  if (exactYear) return exactYear;

  // Interpolate between nearest years
  const olderYear = years.find((y) => y < vehicle.year);
  const newerYear = years.find((y) => y > vehicle.year);
  if (olderYear && newerYear) {
    const ratio =
      (vehicle.year - olderYear) / (newerYear - olderYear);
    return Math.round(
      modelData[olderYear] +
        (modelData[newerYear] - modelData[olderYear]) * ratio,
    );
  }

  // Extrapolate from nearest available year
  if (olderYear) return modelData[olderYear];
  if (newerYear) return modelData[newerYear];
  return estimateValueFromAge(vehicle.year);
}

function estimateValueFromAge(year: number): number {
  const age = new Date().getFullYear() - year;
  const baseNew = 30000;
  const depreciation = Math.pow(0.85, age);
  return Math.round(baseNew * depreciation);
}

/**
 * Compute full trade-in valuation.
 */
export function computeValuation(
  vehicle: VehicleDetails,
  conditionReport: ConditionReport,
): ValuationResult {
  const baseValue = getBaseMarketValue(vehicle);
  const breakdown: string[] = [];
  let totalConditionAdjustment = 0;

  // Per-panel adjustments
  for (const panel of conditionReport.panels) {
    const adjustment =
      CONDITION_ADJUSTMENTS[panel.grade] || 0;
    if (adjustment !== 0) {
      totalConditionAdjustment += adjustment;
      breakdown.push(
        `${panel.panel}: ${panel.grade} (${adjustment > 0 ? "+" : ""}€${adjustment})`,
      );
    }
  }

  // Overall condition multiplier
  const conditionMultiplier =
    OVERALL_CONDITION_MULTIPLIER[conditionReport.overallGrade] || 1.0;
  const conditionMultiplierAdjustment = Math.round(
    baseValue * (conditionMultiplier - 1),
  );

  // Market adjustment based on age, mileage, and fuel type
  const carAge = new Date().getFullYear() - vehicle.year;
  let marketAdjustment = 0;

  // Diesel penalty for older cars (ULEZ/emissions trends)
  if (vehicle.fuelType === "Diesel" && carAge > 5) {
    marketAdjustment -= Math.round(baseValue * 0.03);
    breakdown.push("Older diesel: market demand softening (-3%)");
  }

  // EV premium
  if (vehicle.fuelType === "Electric" && carAge <= 3) {
    marketAdjustment += Math.round(baseValue * 0.02);
    breakdown.push("EV: strong used market demand (+2%)");
  }

  // High mileage penalty
  const expectedMileage = carAge * 15000;
  if (vehicle.mileage > expectedMileage * 1.3) {
    marketAdjustment -= Math.round(baseValue * 0.05);
    breakdown.push(
      `High mileage (${(vehicle.mileage / 1000).toFixed(0)}k km): -5%`,
    );
  } else if (vehicle.mileage < expectedMileage * 0.7) {
    marketAdjustment += Math.round(baseValue * 0.03);
    breakdown.push("Low mileage premium (+3%)");
  }

  // Automatic transmission premium
  if (vehicle.transmission === "Automatic") {
    marketAdjustment += Math.round(baseValue * 0.02);
    breakdown.push("Automatic transmission premium (+2%)");
  }

  // NCT status penalty
  if (vehicle.nctStatus === "Expired") {
    marketAdjustment -= 500;
    breakdown.push("NCT expired: -€500 (re-test cost & risk)");
  } else if (vehicle.nctStatus === "Due Soon") {
    marketAdjustment -= 200;
    breakdown.push("NCT due soon: -€200");
  }

  const totalAdjustment =
    totalConditionAdjustment + conditionMultiplierAdjustment + marketAdjustment;
  const finalValue = Math.max(baseValue + totalAdjustment, 500); // floor at €500

  // Confidence based on data quality
  const confidence: ValuationResult["confidence"] =
    carAge <= 5 ? "High" : carAge <= 10 ? "Medium" : "Low";

  return {
    baseValue,
    conditionAdjustment: totalConditionAdjustment + conditionMultiplierAdjustment,
    marketAdjustment,
    finalValue,
    confidence,
    breakdown,
  };
}
