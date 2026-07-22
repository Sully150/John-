import type {
  VehicleDetails,
  ConditionReport,
  ValuationResult,
  UploadedPhoto,
} from "../services/types";

interface Props {
  vehicle: VehicleDetails;
  conditionReport: ConditionReport;
  valuation: ValuationResult;
  photos: UploadedPhoto[];
  onNewAppraisal: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  Excellent: "bg-green-100 text-green-800 border-green-300",
  Good: "bg-blue-100 text-blue-800 border-blue-300",
  Fair: "bg-amber-100 text-amber-800 border-amber-300",
  Poor: "bg-red-100 text-red-800 border-red-300",
};

const GRADE_EMOJI: Record<string, string> = {
  Excellent: "●",
  Good: "●",
  Fair: "●",
  Poor: "●",
};

const CONFIDENCE_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  High: { label: "High Confidence", className: "badge-green" },
  Medium: { label: "Medium Confidence", className: "badge-amber" },
  Low: { label: "Low Confidence", className: "badge-red" },
};

export function ValuationDashboard({
  vehicle,
  conditionReport,
  valuation,
  photos,
  onNewAppraisal,
}: Props) {
  const confidence = CONFIDENCE_BADGE[valuation.confidence];

  return (
    <div className="space-y-6">
      {/* Valuation hero card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-8 text-center text-white sm:px-8">
          <p className="text-sm font-medium text-blue-200">Trade-In Valuation</p>
          <p className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl">
            €{valuation.finalValue.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidence.className}`}
            >
              {confidence.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-blue-200">
            {vehicle.make} {vehicle.model} • {vehicle.registration} •{" "}
            {vehicle.year}
          </p>
        </div>

        {/* Valuation breakdown */}
        <div className="divide-y divide-gray-100 px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Base Market Value</span>
            <span className="text-sm font-semibold text-gray-900">
              €{valuation.baseValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">
              Condition Adjustment
            </span>
            <span
              className={`text-sm font-semibold ${
                valuation.conditionAdjustment <= 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {valuation.conditionAdjustment > 0 ? "+" : ""}€
              {valuation.conditionAdjustment.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Market Adjustment</span>
            <span
              className={`text-sm font-semibold ${
                valuation.marketAdjustment <= 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {valuation.marketAdjustment > 0 ? "+" : ""}€
              {valuation.marketAdjustment.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-gray-900">
              Final Trade-In Value
            </span>
            <span className="text-base font-bold text-blue-700">
              €{valuation.finalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle details card */}
      <div className="card p-6 sm:p-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Vehicle Details
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Detail label="Make" value={vehicle.make} />
          <Detail label="Model" value={vehicle.model} />
          <Detail label="Year" value={String(vehicle.year)} />
          <Detail label="Engine" value={vehicle.engine} />
          <Detail label="Fuel" value={vehicle.fuelType} />
          <Detail label="Transmission" value={vehicle.transmission} />
          <Detail label="Colour" value={vehicle.colour} />
          <Detail label="Body" value={vehicle.bodyType} />
          <Detail
            label="Mileage"
            value={`${(vehicle.mileage / 1000).toFixed(0)}k km`}
          />
          <Detail label="NCT" value={vehicle.nctStatus}>
            <span
              className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                vehicle.nctStatus === "Valid"
                  ? "bg-green-100 text-green-800"
                  : vehicle.nctStatus === "Due Soon"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {vehicle.nctStatus}
            </span>
          </Detail>
          <Detail label="NCT Due" value={vehicle.nctDueDate} />
          <Detail label="Tax" value={vehicle.taxStatus}>
            <span
              className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                vehicle.taxStatus === "Taxed"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {vehicle.taxStatus}
            </span>
          </Detail>
          <Detail label="Tax Due" value={vehicle.taxDueDate} />
          <Detail
            label="CO₂"
            value={`${vehicle.co2Emissions} g/km`}
          />
        </dl>
      </div>

      {/* Condition report */}
      <div className="card p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            AI Condition Assessment
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${GRADE_COLORS[conditionReport.overallGrade]}`}
          >
            {GRADE_EMOJI[conditionReport.overallGrade]} Overall:{" "}
            {conditionReport.overallGrade}
          </span>
        </div>
        <p className="mb-4 text-sm text-gray-600">{conditionReport.summary}</p>

        {/* Panel grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {conditionReport.panels.map((panel) => (
            <div
              key={panel.panel}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${GRADE_COLORS[panel.grade]}`}
            >
              <div>
                <span className="font-medium">{panel.panel}</span>
                <span className="ml-2 text-xs opacity-75">{panel.notes}</span>
              </div>
              <span className="ml-2 shrink-0 text-xs font-semibold uppercase">
                {panel.grade}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation breakdown details */}
      {valuation.breakdown.length > 0 && (
        <div className="card p-6 sm:p-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Valuation Adjustments
          </h3>
          <ul className="space-y-2">
            {valuation.breakdown.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded photos */}
      {photos.length > 0 && (
        <div className="card p-6 sm:p-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Inspected Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.previewUrl}
                alt="Vehicle"
                className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button onClick={onNewAppraisal} className="btn-primary w-full">
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Appraisal
        </button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">
        {value}
        {children}
      </dd>
    </div>
  );
}
