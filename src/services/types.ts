/** Condition grade for a panel */
export type ConditionGrade = "Excellent" | "Good" | "Fair" | "Poor";

/** Vehicle details returned from reg lookup */
export interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  colour: string;
  bodyType: string;
  taxStatus: string;
  taxDueDate: string;
  nctStatus: string;
  nctDueDate: string;
  co2Emissions: number;
  fuelType: string;
  transmission: string;
  mileage: number;
}

/** Single panel condition assessment */
export interface PanelCondition {
  panel: string;
  grade: ConditionGrade;
  notes: string;
}

/** Full photo condition report */
export interface ConditionReport {
  panels: PanelCondition[];
  overallGrade: ConditionGrade;
  summary: string;
  gradedAt: string;
}

/** Trade-in valuation result */
export interface ValuationResult {
  baseValue: number;
  conditionAdjustment: number;
  marketAdjustment: number;
  finalValue: number;
  confidence: "High" | "Medium" | "Low";
  breakdown: string[];
}

/** An uploaded photo (local preview URL) */
export interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

/** Full appraisal state */
export interface AppraisalState {
  step: "reg" | "photos" | "valuation";
  vehicle: VehicleDetails | null;
  photos: UploadedPhoto[];
  conditionReport: ConditionReport | null;
  valuation: ValuationResult | null;
  loading: boolean;
  error: string | null;
}
