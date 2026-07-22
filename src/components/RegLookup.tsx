import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (reg: string) => void;
}

export function RegLookup({ onSubmit }: Props) {
  const [reg, setReg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = reg.trim().replace(/\s+/g, "");
    if (!cleaned) {
      setError("Please enter a registration plate");
      return;
    }

    // Basic format validation
    if (!/^\d{2,3}[A-Za-z]{1,3}\d{4,6}$/.test(cleaned)) {
      setError(
        "Invalid format. Use Irish format: YY-CC-SSSSSS (e.g. 12-D-123456) or YY-CCC-SSSS (e.g. 221-D-12345)",
      );
      return;
    }

    onSubmit(cleaned);
  };

  // Format reg as user types: 12D123456 → 12-D-123456
  const formatReg = (input: string): string => {
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 2) return cleaned;

    // Find where the county code ends
    let countyEnd = 2;
    if (cleaned.length > 2 && /[A-Z]/.test(cleaned[2])) {
      // 3-digit year like "221" → county starts at index 3
      if (/\d{3}/.test(cleaned.substring(0, 3))) {
        countyEnd = 3;
      }
    }

    const year = cleaned.substring(0, countyEnd);
    let rest = cleaned.substring(countyEnd);

    // Split county from sequence
    let countyEndIdx = 0;
    for (let i = 0; i < rest.length; i++) {
      if (/[A-Z]/.test(rest[i])) {
        countyEndIdx = i + 1;
      } else {
        break;
      }
    }

    const county = rest.substring(0, countyEndIdx);
    const seq = rest.substring(countyEndIdx);

    if (!county) return year;
    if (!seq) return `${year}-${county}`;
    return `${year}-${county}-${seq}`;
  };

  const handleChange = (value: string) => {
    setReg(formatReg(value));
    if (error) setError(null);
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Vehicle Registration Lookup
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Enter the Irish registration plate to pull up vehicle details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reg-input"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Registration Plate
          </label>
          <div className="relative">
            <input
              id="reg-input"
              type="text"
              value={reg}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="e.g. 12-D-123456"
              maxLength={13}
              autoComplete="off"
              autoFocus
              className="input-field text-center text-xl font-mono tracking-wider uppercase"
            />
            {/* Plate visual */}
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center rounded-lg border-2 border-gray-800 bg-white px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-gray-900 shadow-sm">
                {reg || "12-D-123456"}
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Look Up Vehicle
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-600 mb-1">
          Supported formats:
        </p>
        <ul className="space-y-0.5">
          <li>
            <code className="rounded bg-gray-200 px-1 font-mono">
              12-D-123456
            </code>{" "}
            — 2012 Dublin
          </li>
          <li>
            <code className="rounded bg-gray-200 px-1 font-mono">
              221-C-12345
            </code>{" "}
            — 2022 Cork (first half)
          </li>
          <li>
            <code className="rounded bg-gray-200 px-1 font-mono">
              152-KK-1234
            </code>{" "}
            — 2015 Kilkenny (second half)
          </li>
        </ul>
      </div>
    </div>
  );
}
