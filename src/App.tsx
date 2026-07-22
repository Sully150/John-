import { useState, useCallback } from "react";
import { lookupReg } from "./services/regLookup";
import { assessPhotos } from "./services/photoAssessment";
import { computeValuation } from "./services/valuation";
import type {
  VehicleDetails,
  ConditionReport,
  ValuationResult,
  UploadedPhoto,
} from "./services/types";
import { RegLookup } from "./components/RegLookup";
import { PhotoUpload } from "./components/PhotoUpload";
import { ValuationDashboard } from "./components/ValuationDashboard";

type Step = "reg" | "photos" | "valuation";

export default function App() {
  const [step, setStep] = useState<Step>("reg");
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [conditionReport, setConditionReport] =
    useState<ConditionReport | null>(null);
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegLookup = useCallback(
    async (reg: string) => {
      setLoading(true);
      setError(null);
      try {
        const details = await lookupReg(reg);
        setVehicle(details);
        setStep("photos");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to look up vehicle",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handlePhotosSubmit = useCallback(
    async (uploadedPhotos: UploadedPhoto[]) => {
      setLoading(true);
      setError(null);
      setPhotos(uploadedPhotos);
      try {
        const report = await assessPhotos(uploadedPhotos);
        setConditionReport(report);

        if (vehicle) {
          const val = computeValuation(vehicle, report);
          setValuation(val);
        }
        setStep("valuation");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to assess vehicle condition",
        );
      } finally {
        setLoading(false);
      }
    },
    [vehicle],
  );

  const handleReset = useCallback(() => {
    setStep("reg");
    setVehicle(null);
    setPhotos([]);
    setConditionReport(null);
    setValuation(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
              T
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                TradeWorth
              </h1>
              <p className="text-xs text-gray-500">
                Irish Motor Trade Valuations
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            New Appraisal
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { id: "reg", label: "Reg Lookup", num: 1 },
              { id: "photos", label: "Photos", num: 2 },
              { id: "valuation", label: "Valuation", num: 3 },
            ].map((s) => {
              const isActive = step === s.id;
              const isComplete =
                (s.id === "reg" && vehicle !== null) ||
                (s.id === "photos" && conditionReport !== null) ||
                (s.id === "valuation" && valuation !== null);
              const isPast =
                (s.id === "reg" && step !== "reg") ||
                (s.id === "photos" && step === "valuation");

              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isComplete || isPast
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isComplete ? "✓" : s.num}
                  </span>
                  <span
                    className={`hidden sm:inline text-sm font-medium ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {step === "reg"
              ? "Looking up vehicle..."
              : step === "photos"
                ? "Analysing vehicle condition..."
                : "Computing valuation..."}
          </div>
        )}

        {/* Step content */}
        <div className="mx-auto max-w-2xl">
          {step === "reg" && <RegLookup onSubmit={handleRegLookup} />}
          {step === "photos" && (
            <PhotoUpload
              vehicle={vehicle!}
              onSubmit={handlePhotosSubmit}
              onBack={() => setStep("reg")}
              loading={loading}
            />
          )}
          {step === "valuation" &&
            vehicle &&
            conditionReport &&
            valuation && (
              <ValuationDashboard
                vehicle={vehicle}
                conditionReport={conditionReport}
                valuation={valuation}
                photos={photos}
                onNewAppraisal={handleReset}
              />
            )}
        </div>
      </div>
    </div>
  );
}
